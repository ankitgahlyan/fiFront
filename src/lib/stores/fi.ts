import { FI_ADDRESS } from '$lib/consts';
import { getTonClient } from '$lib/utils/ton';
import { Address, beginCell, Cell, fromNano, toNano, type OpenedContract } from '@ton/core';
import { getTonConnectUI, userAddress } from './tonconnect';
import { FossFi } from '$lib/FossFi';
import { FossFiWallet } from '$lib/FossFiWallet';
import { browser } from '$app/environment';
import { get } from 'svelte/store';

let fi: OpenedContract<FossFi> | null = null;

async function getFi() {
	if (!fi) {
		fi = getTonClient().open(FossFi.createFromAddress(Address.parse(FI_ADDRESS)));
	}
	return fi;
}

export async function getJettonAddr(ownerAddress: Address) {
	if (!browser) throw new Error('Not in browser environment');

	const stored = localStorage.getItem(ownerAddress.toString());
	if (stored) {
		return Address.parse(stored);
	}

	const jettonAddr = (await getFi()).getWalletAddress(ownerAddress);
	if (!jettonAddr) {
		throw new Error('FiJetton wallet not found');
	}
	localStorage.setItem(ownerAddress.toString(), jettonAddr.toString());
	return jettonAddr;
}

// for calling getters only
export async function getFiJetton(ownerAddress: Address) {
	const jettonAddr = await getJettonAddr(ownerAddress);
	return getTonClient().open(FossFiWallet.createFromAddress(jettonAddr));
}

export async function getBalance(): Promise<string> {
	const userAddr = get(userAddress);
	if (!userAddr) throw new Error('Wallet not connected');
	let balance = fromNano((await (await getFiJetton(userAddr)).getGetWalletData()).balance);
	localStorage.setItem('balance', balance);
	return balance;
}

// function loadState() {
// 	loading = true;
// 	try {
// 		if (!$userAddress) throw new Error('Wallet not connected');
// 		// jettonStateFull = localStorage.getItem('jettonStateFull');
// 		throw new Error
// 	} catch (e) {
// 		getState();
// 	}
// }

// async function getState() {
// 	// loading = true;
// 	try {
// 		// if (!$userAddress) throw new Error('Wallet not connected');
// 		jettonStateFull = await (await getFiJetton($userAddress!)).getGetWalletDataFull();
// 	} catch (e: any) {
// 		error = e.message || 'Failed to fetch state';
// 	} finally {
// 		loading = false;
// 	}
// }

export async function sendTransfer(
	fromAddress: Address,
	toAddress: string,
	amount: number,
	customPayload: Cell | null = null,
	forwardPayload: string = ''
) {
	try {
		const tonConnectUI = getTonConnectUI();
		const fiJettonAddr = await getJettonAddr(fromAddress);

		const transfer = {
			$$type: 'JettonTransfer',
			queryId: 0n, // can be random or sequential
			amount: toNano(amount),
			destination: Address.parse(toAddress),
			responseDestination: fromAddress,
			customPayload: customPayload,
			forwardTonAmount: toNano(1n),
			forwardPayload: beginCell().storeStringRefTail(forwardPayload).endCell()
		};

		const tb = beginCell()
			.storeUint(0xf8a7ea5, 32)
			.storeUint(0, 64) // op, queryId
			.storeCoins(toNano(amount))
			.storeAddress(Address.parse(toAddress))
			.storeAddress(fromAddress)
			.storeMaybeRef(customPayload)
			.storeCoins(toNano(1n))
			.storeMaybeRef(beginCell().storeStringRefTail(forwardPayload))
			.endCell();

		// Build transfer body
		// const tb = beginCell().store(storeJettonTransfer(transfer)).endCell();

		const transaction = {
			validUntil: Math.floor(Date.now() / 1000) + 600,
			messages: [
				{
					address: fiJettonAddr.toString(),
					amount: toNano('1').toString(),
					payload: tb.toBoc().toString('base64')
				}
			]
		};

		await tonConnectUI.sendTransaction(transaction);

		// Wait a bit and refresh state
		// setTimeout(getBalance, 3000);
	} catch (error) {
		console.error('Failed to send txn:', error);
		throw error;
	}
}
