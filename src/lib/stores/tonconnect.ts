import { writable, derived, get } from 'svelte/store';
import { THEME, TonConnectUI, type Wallet } from '@tonconnect/ui';
import { Address } from '@ton/core';
import { browser } from '$app/environment';
import { MANIFEST_URL } from '@/consts';

// TonConnect UI instance
let tonConnectUI: TonConnectUI | null = null;

// Stores
export const wallet = writable<Wallet | null>(null);
export const connectedWallets = writable<Wallet[]>([]);
export const activeWalletIndex = writable<number>(-1);
export const walletInitializing = writable<boolean>(true);

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
		connectedWallets.set([tonConnectUI.wallet]);
		activeWalletIndex.set(0);
	}

	// Mark initialization as complete
	walletInitializing.set(false);

	// Subscribe to wallet changes
	tonConnectUI.onStatusChange((walletInfo) => {
		walletInitializing.set(false);
		if (walletInfo) {
			wallet.set(walletInfo);
			const currentWallets = get(connectedWallets);

			// Check if this wallet already exists
			const existingIndex = currentWallets.findIndex(
				(w) => w?.account?.address === walletInfo.account?.address
			);

			if (existingIndex === -1) {
				// New wallet connected - add to list and set as active
				connectedWallets.set([walletInfo, ...currentWallets]);
				activeWalletIndex.set(0);
			} else {
				// Update existing wallet info and make it active
				const updated = [...currentWallets];
				updated[existingIndex] = walletInfo;
				connectedWallets.set(updated);
				activeWalletIndex.set(existingIndex);
			}
		} else {
			// Wallet disconnected
			wallet.set(null);
			connectedWallets.set([]);
			activeWalletIndex.set(-1);
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

	const currentWallets = get(connectedWallets);
	const currentActiveIndex = get(activeWalletIndex);

	if (walletAddress) {
		// Disconnect specific wallet
		const index = currentWallets.findIndex((w) => w?.account?.address === walletAddress);
		if (index !== -1) {
			const updated = currentWallets.filter((_, i) => i !== index);
			connectedWallets.set(updated);

			if (index === currentActiveIndex) {
				if (updated.length > 0) {
					activeWalletIndex.set(0);
					wallet.set(updated[0]);
				} else {
					activeWalletIndex.set(-1);
					wallet.set(null);
					await tonConnectUI.disconnect();
				}
			} else if (currentActiveIndex > index) {
				activeWalletIndex.set(currentActiveIndex - 1);
			}
		}
	} else {
		// Disconnect all wallets
		await tonConnectUI.disconnect();
		connectedWallets.set([]);
		activeWalletIndex.set(-1);
		wallet.set(null);
	}
}

// Switch active wallet
export function switchConnectedWallet(index: number) {
	const currentWallets = get(connectedWallets);
	if (index >= 0 && index < currentWallets.length) {
		wallet.set(currentWallets[index]);
		activeWalletIndex.set(index);
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
