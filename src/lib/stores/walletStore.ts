// Wallet store

import { writable, derived, type Readable } from 'svelte/store';
import { browser } from '$app/environment';
import { encrypt, decrypt, generateMnemonic } from '../utils/crypto';
import { saveToVault, getFromVault } from '../utils/vault';
import {
	walletFromMnemonic,
	getBalance,
	getJettonBalance,
	getTransactions,
	POPULAR_JETTONS,
	type Jetton,
	type TransactionData
} from '../utils/ton';

interface Wallet {
	id: string;
	name: string;
	address: string;
	mnemonic: string;
	balance: number;
	jettons: Jetton[];
}

interface WalletStoreData {
	wallets: Wallet[];
	activeWalletIndex: number;
	isTestnet: boolean;
	jettons: Jetton[];
	transactions: TransactionData[];
}

interface WalletsSaveData {
	wallets: Wallet[];
	activeWalletIndex: number;
	isTestnet: boolean;
}

interface Result<T = unknown> {
	success: boolean;
	error?: string;
	wallets?: Wallet[];
	wallet?: Wallet;
}

function createWalletStore() {
	const { subscribe, set, update } = writable<WalletStoreData>({
		wallets: [],
		activeWalletIndex: 0,
		isTestnet: true,
		jettons: [],
		transactions: []
	});

	return {
		subscribe,

		/**
		 * Load wallets from vault
		 */
		async loadWallets(pin: string): Promise<Result> {
			if (!browser) return { success: false };

			try {
				const encryptedData = await getFromVault('wallets');
				if (!encryptedData) {
					return { success: true, wallets: [] };
				}

				const data = await decrypt<WalletsSaveData>(encryptedData as string, pin);

				update((state) => ({
					...state,
					wallets: data.wallets || [],
					activeWalletIndex: data.activeWalletIndex || 0,
					isTestnet: data.isTestnet !== undefined ? data.isTestnet : true
				}));

				return { success: true };
			} catch (error) {
				console.error('Error loading wallets:', error);
				return { success: false, error: String(error) };
			}
		},

		/**
		 * Save wallets to vault
		 */
		async saveWallets(pin: string, walletsData: WalletsSaveData): Promise<Result> {
			if (!browser) return { success: false };

			try {
				const encryptedData = await encrypt(walletsData, pin);
				await saveToVault('wallets', encryptedData);
				return { success: true };
			} catch (error) {
				console.error('Error saving wallets:', error);
				return { success: false, error: String(error) };
			}
		},

		/**
		 * Create new wallet
		 */
		async createWallet(pin: string, name: string = 'Wallet'): Promise<Result<Wallet>> {
			if (!browser) return { success: false };

			try {
				const mnemonic = generateMnemonic();
				let currentState: WalletStoreData | undefined;
				const unsubscribe = subscribe((state) => (currentState = state));
				unsubscribe();

				if (!currentState) {
					return { success: false, error: 'Unable to get current state' };
				}

				const walletData = await walletFromMnemonic(mnemonic, currentState.isTestnet);

				const newWallet: Wallet = {
					id: Date.now().toString(),
					name: `${name} ${currentState.wallets.length + 1}`,
					address: walletData.address,
					mnemonic,
					balance: 0,
					jettons: []
				};

				let updatedState: WalletStoreData | undefined;
				update((state) => {
					const newState = {
						...state,
						wallets: [...state.wallets, newWallet],
						activeWalletIndex: state.wallets.length
					};
					updatedState = newState;
					return newState;
				});

				if (!updatedState) {
					return { success: false, error: 'Failed to update store' };
				}

				await this.saveWallets(pin, updatedState);
				return { success: true, wallet: newWallet };
			} catch (error) {
				console.error('Error creating wallet:', error);
				return { success: false, error: String(error) };
			}
		},

		/**
		 * Import wallet
		 */
		async importWallet(
			pin: string,
			mnemonic: string,
			name: string = 'Imported Wallet'
		): Promise<Result<Wallet>> {
			if (!browser) return { success: false };

			try {
				let currentState: WalletStoreData | undefined;
				const unsubscribe = subscribe((state) => (currentState = state));
				unsubscribe();

				if (!currentState) {
					return { success: false, error: 'Unable to get current state' };
				}

				const walletData = await walletFromMnemonic(mnemonic, currentState.isTestnet);

				const newWallet: Wallet = {
					id: Date.now().toString(),
					name,
					address: walletData.address,
					mnemonic,
					balance: 0,
					jettons: []
				};

				let updatedState: WalletStoreData | undefined;
				update((state) => {
					const newState = {
						...state,
						wallets: [...state.wallets, newWallet],
						activeWalletIndex: state.wallets.length
					};
					updatedState = newState;
					return newState;
				});

				if (!updatedState) {
					return { success: false, error: 'Failed to update store' };
				}

				await this.saveWallets(pin, updatedState);
				return { success: true, wallet: newWallet };
			} catch (error) {
				console.error('Error importing wallet:', error);
				return { success: false, error: String(error) };
			}
		},

		/**
		 * Switch active wallet
		 */
		async setActiveWallet(pin: string, index: number): Promise<Result> {
			if (!browser) return { success: false };

			try {
				let updatedState: WalletStoreData | undefined;
				update((state) => {
					const newState = {
						...state,
						activeWalletIndex: index
					};
					updatedState = newState;
					return newState;
				});

				if (!updatedState) {
					return { success: false, error: 'Failed to update store' };
				}

				await this.saveWallets(pin, updatedState);
				return { success: true };
			} catch (error) {
				console.error('Error switching wallet:', error);
				return { success: false, error: String(error) };
			}
		},

		/**
		 * Toggle network
		 */
		async toggleNetwork(pin: string): Promise<Result> {
			if (!browser) return { success: false };

			try {
				let updatedState: WalletStoreData | undefined;
				update((state) => {
					const newState = {
						...state,
						isTestnet: !state.isTestnet
					};
					updatedState = newState;
					return newState;
				});

				if (!updatedState) {
					return { success: false, error: 'Failed to update store' };
				}

				await this.saveWallets(pin, updatedState);
				return { success: true };
			} catch (error) {
				console.error('Error toggling network:', error);
				return { success: false, error: String(error) };
			}
		},

		/**
		 * Refresh balances
		 */
		async refreshBalances(pin: string): Promise<Result> {
			if (!browser) return { success: false };

			try {
				let currentState: WalletStoreData | undefined;
				const unsubscribe = subscribe((state) => (currentState = state));
				unsubscribe();

				if (!currentState) {
					return { success: false, error: 'Unable to get current state' };
				}

				const { wallets, activeWalletIndex, isTestnet } = currentState;
				const activeWallet = wallets[activeWalletIndex];

				if (!activeWallet) return { success: false, error: 'No active wallet' };

				// Get TON balance
				const balance = await getBalance(activeWallet.address, isTestnet);

				// Get jetton balances
				const jettonBalances = await Promise.all(
					POPULAR_JETTONS.map(async (jetton: Jetton) => {
						const jettonBalance = await getJettonBalance(
							activeWallet.address,
							jetton.masterAddress,
							isTestnet
						);
						return { ...jetton, balance: jettonBalance };
					})
				);

				// Get transactions
				const transactions = await getTransactions(activeWallet.address, isTestnet);

				update((state) => {
					const updatedWallets = [...state.wallets];
					updatedWallets[activeWalletIndex] = {
						...updatedWallets[activeWalletIndex],
						balance,
						jettons: jettonBalances
					};
					return {
						...state,
						wallets: updatedWallets,
						transactions
					};
				});

				let updatedState: WalletStoreData | undefined;
				const unsubscribe2 = subscribe((state) => (updatedState = state));
				unsubscribe2();

				if (!updatedState) {
					return { success: false, error: 'Failed to get updated state' };
				}

				await this.saveWallets(pin, updatedState);

				return { success: true };
			} catch (error) {
				console.error('Error refreshing balances:', error);
				return { success: false, error: String(error) };
			}
		}
	};
}

export const walletStore = createWalletStore();

// Derived store for active wallet
export const activeWallet: Readable<Wallet | null> = derived(
	walletStore,
	($walletStore) => $walletStore.wallets[$walletStore.activeWalletIndex] || null
);
