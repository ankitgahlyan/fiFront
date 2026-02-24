import { THEME, TonConnectUI, type Wallet } from '@tonconnect/ui';
import { Address } from '@ton/core';
import { browser } from '$app/environment';
import { MANIFEST_URL } from '@/consts';

let tonConnectUI: TonConnectUI | null = null;
let wallet: Wallet | null = $state(null);
let connectedWallets: Wallet[] = $state([]);
let activeWalletIndex: number = $state(-1);
let walletInitializing: boolean = $state(true);

let isConnected = $derived(getWallet() !== null);
let userAddress = $derived.by(() => {
	const w = getWallet();
	return w?.account?.address ? Address.parse(w.account.address) : null;
});

// Export getters instead of state directly
export function getWallet() {
	return wallet;
}

export function getConnectedWallets() {
	return connectedWallets;
}

export function getActiveWalletIndex() {
	return activeWalletIndex;
}

export function getWalletInitializing() {
	return walletInitializing;
}

export function getIsConnected() {	return isConnected;
}

export function getUserAddress() {
	return userAddress;
}

// Initialize TonConnect
export function initTonConnect() {
	if (!browser || tonConnectUI) return;

	tonConnectUI = new TonConnectUI({
		manifestUrl: MANIFEST_URL,
		buttonRootId: 'ton-connect-button',
		analytics: { mode: 'off' },
		uiPreferences: {
			theme: THEME.DARK
		}
	});

	if (tonConnectUI.wallet) {
		wallet = tonConnectUI.wallet;
		connectedWallets = [tonConnectUI.wallet];
		activeWalletIndex = 0;
	}

	walletInitializing = false;

	tonConnectUI.onStatusChange((walletInfo) => {
		walletInitializing = false;
		if (walletInfo) {
			wallet = walletInfo;

			const existingIndex = connectedWallets.findIndex(
				(w) => w?.account?.address === walletInfo.account?.address
			);

			if (existingIndex === -1) {
				connectedWallets = [walletInfo, ...connectedWallets];
				activeWalletIndex = 0;
			} else {
				const updated = [...connectedWallets];
				updated[existingIndex] = walletInfo;
				connectedWallets = updated;
				activeWalletIndex = existingIndex;
			}
		} else {
			wallet = null;
			connectedWallets = [];
			activeWalletIndex = -1;
		}
	});
}

// Connect wallet
export async function connectWallet() {
	if (!tonConnectUI) {
		throw new Error('TonConnect not initialized');
	}
	await tonConnectUI.openModal();
}

// Disconnect wallet
export async function disconnectWallet(walletAddress?: string) {
	if (!tonConnectUI) {
		throw new Error('TonConnect not initialized');
	}

	if (walletAddress) {
		const index = connectedWallets.findIndex((w) => w?.account?.address === walletAddress);
		if (index !== -1) {
			const updated = connectedWallets.filter((_, i) => i !== index);
			connectedWallets = updated;

			if (index === activeWalletIndex) {
				if (updated.length > 0) {
					activeWalletIndex = 0;
					wallet = updated[0];
				} else {
					activeWalletIndex = -1;
					wallet = null;
					await tonConnectUI.disconnect();
				}
			} else if (activeWalletIndex > index) {
				activeWalletIndex = activeWalletIndex - 1;
			}
		}
	} else {
		await tonConnectUI.disconnect();
		connectedWallets = [];
		activeWalletIndex = -1;
		wallet = null;
	}
}

// Switch active wallet
export function switchConnectedWallet(index: number) {
	if (index >= 0 && index < connectedWallets.length) {
		wallet = connectedWallets[index];
		activeWalletIndex = index;
	}
}

// Get TonConnect UI instance
export function getTonConnectUI(): TonConnectUI {
	if (!tonConnectUI) {
		throw new Error('TonConnect not initialized');
	}
	return tonConnectUI;
}

// Send transaction
export async function sendTransaction(transaction: {
	validUntil: number;
	messages: Array<{
		address: string;
		amount: string;
		payload?: string;
	}>;
}) {
	if (!tonConnectUI) {
		throw new Error('TonConnect not initialized');
	}

	return await tonConnectUI.sendTransaction(transaction);
}

export function formatAddress(address: string): string {
	// todo: move to utils
	const addr = Address.normalize(Address.parseFriendly(address).address);
	return `${addr}`;
	// return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
