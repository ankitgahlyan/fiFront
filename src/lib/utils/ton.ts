// TON blockchain integration
import { ENDPOINT, FI_ADDRESS } from '../consts';
import {
	TonClient,
	Address,
	WalletContractV5R1,
	internal,
	beginCell,
	toNano,
	type CommonMessageInfo,
	SendMode
} from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { fromNano } from '@ton/core';

let tonClient: TonClient | null = null;

export interface WalletData {
	address: string;
	publicKey: string;
	secretKey: string;
}

export interface TransactionData {
	hash: string;
	time: number;
	value: number;
	from: string;
	to: string;
}

export interface Jetton {
	name: string;
	symbol: string;
	masterAddress: string;
	decimals: number;
	balance?: number;
}

export interface SendResult {
	success: boolean;
	error?: string;
}

/**
 * Get TON client
 */
export function getTonClient(): TonClient {
	if (!tonClient) {
		tonClient = new TonClient({ endpoint: ENDPOINT });
	}
	return tonClient;
}

/**
 * Create wallet from mnemonic
 */
export async function walletFromMnemonic(mnemonic: string, isTestnet: boolean = true): Promise<WalletData> {
	const mnemonicArray = mnemonic.trim().split(' ');
	const keyPair = await mnemonicToPrivateKey(mnemonicArray);

	const wallet = WalletContractV5R1.create({
		workchain: 0,
		publicKey: keyPair.publicKey
	});

	return {
		address: wallet.address.toString({ testOnly: isTestnet }),
		publicKey: keyPair.publicKey.toString('hex'),
		secretKey: keyPair.secretKey.toString('hex')
	};
}

/**
 * Get wallet balance
 */
export async function getBalance(address: string): Promise<number> {
	try {
		const client = getTonClient();
		const balance = await client.getBalance(Address.parse(address));
		return Number(fromNano(balance)); // Convert to TON
	} catch (error) {
		console.error('Error getting balance:', error);
		return 0;
	}
}

/**
 * Send TON
 */
export async function sendTon(
	fromMnemonic: string,
	toAddress: string,
	amount: number,
): Promise<SendResult> {
	try {
		const mnemonicArray = fromMnemonic.trim().split(' ');
		const keyPair = await mnemonicToPrivateKey(mnemonicArray);

		const wallet = WalletContractV5R1.create({
			workchain: 0,
			publicKey: keyPair.publicKey
		});

		const client = getTonClient();
		const contract = client.open(wallet);

		const seqno = await contract.getSeqno();

		await contract.sendTransfer({
			seqno,
			secretKey: keyPair.secretKey,
			sendMode: SendMode.PAY_GAS_SEPARATELY, // pay fee separately
			messages: [
				internal({
					to: Address.parse(toAddress),
					value: toNano(amount),
					body: ''
				})
			]
		});

		return { success: true };
	} catch (error) {
		console.error('Error sending TON:', error);
		return { success: false, error: String(error) };
	}
}

/**
 * Get jetton balance
 */
export async function getJettonBalance(
	ownerAddress: string,
	jettonMasterAddress: string
): Promise<number> {
	try {
		const client = getTonClient();

		// Get jetton wallet address
		const jettonWalletAddress = await getJettonWalletAddress(
			ownerAddress,
			jettonMasterAddress,
			client
		);

		if (!jettonWalletAddress) return 0;

		// Query jetton wallet for balance
		const result = await client.runMethod(Address.parse(jettonWalletAddress), 'get_wallet_data');

		const balance = result.stack.readBigNumber();
		return Number(balance) / 1e9; // Assuming 9 decimals
	} catch (error) {
		console.error('Error getting jetton balance:', error);
		return 0;
	}
}

/**
 * Get jetton wallet address
 */
async function getJettonWalletAddress(
	ownerAddress: string,
	jettonMasterAddress: string,
	client: TonClient
): Promise<string | null> {
	try {
		const ownerAddressCell = beginCell().storeAddress(Address.parse(ownerAddress)).endCell();

		const result = await client.runMethod(
			Address.parse(jettonMasterAddress),
			'get_wallet_address',
			[{ type: 'slice', cell: ownerAddressCell }]
		);

		return result.stack.readAddress().toString();
	} catch (error) {
		console.error('Error getting jetton wallet address:', error);
		return null;
	}
}

/**
 * Send jettons
 */
export async function sendJetton(
	fromMnemonic: string,
	jettonMasterAddress: string,
	toAddress: string,
	amount: number
): Promise<SendResult> {
	try {
		const mnemonicArray = fromMnemonic.trim().split(' ');
		const keyPair = await mnemonicToPrivateKey(mnemonicArray);

		const wallet = WalletContractV5R1.create({
			workchain: 0,
			publicKey: keyPair.publicKey
		});

		const client = getTonClient();

		// Get jetton wallet address
		const jettonWalletAddress = await getJettonWalletAddress(
			wallet.address.toString({ testOnly: true }),
			jettonMasterAddress,
			client
		);

		if (!jettonWalletAddress) {
			throw new Error('Jetton wallet not found');
		}

		// Build transfer body
		const transferBody = beginCell()
			.storeUint(0xf8a7ea5, 32) // transfer op
			.storeUint(0, 64) // query_id
			.storeCoins(toNano(amount))
			.storeAddress(Address.parse(toAddress))
			.storeAddress(wallet.address) // response_destination
			.storeBit(0) // no custom payload
			.storeCoins(1) // forward_ton_amount
			.storeBit(0) // no forward_payload
			.endCell();

		const contract = client.open(wallet);
		const seqno = await contract.getSeqno();

		await contract.sendTransfer({
			seqno,
			secretKey: keyPair.secretKey,
			sendMode: SendMode.PAY_GAS_SEPARATELY, // pay fee separately
			messages: [
				internal({
					to: Address.parse(jettonWalletAddress),
					value: toNano('0.05'), // Gas fee
					body: transferBody
				})
			]
		});

		return { success: true };
	} catch (error) {
		console.error('Error sending jetton:', error);
		return { success: false, error: String(error) };
	}
}

/**
 * Get transactions
 */
export async function getTransactions(
	address: string,
	limit: number = 10
): Promise<TransactionData[]> {
	try {
		const client = getTonClient();
		const transactions = await client.getTransactions(Address.parse(address), { limit });

		return transactions.map((tx) => {
			const value = tx.inMessage?.info
				? Number((tx.inMessage.info as any).value?.coins || (tx.inMessage.info as any).coins || 0) /
					1e9
				: 0;

			return {
				hash: tx.hash().toString('hex'),
				time: tx.now,
				value,
				from: tx.inMessage?.info.src?.toString() || '',
				to: tx.inMessage?.info.dest?.toString() || ''
			};
		});
	} catch (error) {
		console.error('Error getting transactions:', error);
		return [];
	}
}

/**
 * Popular jettons for quick access
 */
export const POPULAR_JETTONS: Jetton[] = [
	{
		name: 'Tether USD',
		symbol: 'USDT',
		masterAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
		decimals: 6
	},
	{
		name: 'STON',
		symbol: 'STON',
		masterAddress: 'EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO',
		decimals: 9
	}
];
