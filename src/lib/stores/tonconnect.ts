import { writable, derived, get } from 'svelte/store';
import { THEME, TonConnectUI, type Wallet } from '@tonconnect/ui';
import { Address } from '@ton/core';
import { browser } from '$app/environment';
import { MANIFEST_URL } from '@/consts';

// TonConnect UI instance
let tonConnectUI: TonConnectUI | null = null;

// Stores
export const wallet = writable<Wallet | null>(null);
export const isConnected = derived(wallet, ($wallet) => $wallet !== null);
export const userAddress = derived(wallet, ($wallet) =>
	$wallet?.account?.address ? Address.parse($wallet.account.address) : null
);

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

	// Set initial wallet state
	if (tonConnectUI.wallet) {
		wallet.set(tonConnectUI.wallet);
	}

	// Subscribe to wallet changes
	tonConnectUI.onStatusChange((walletInfo) => {
		wallet.set(walletInfo);
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
export async function disconnectWallet() {
	if (!tonConnectUI) {
		throw new Error('TonConnect not initialized');
	}
	await tonConnectUI.disconnect();
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
