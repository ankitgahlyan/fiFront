// Authentication store

import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { encrypt, decrypt, hashPin } from '../utils/crypto';
import { saveToVault, getFromVault, clearVault } from '../utils/vault';
import { authenticateWithBiometric } from '../utils/biometric';

interface AuthData {
	pinHash?: string;
	biometricCredentialId?: string | null;
}

interface AuthState {
	isUnlocked: boolean;
	hasPin: boolean;
	hasBiometric: boolean;
	biometricCredentialId: string | null;
	pinHash: string | null;
}

interface Result<T = unknown> {
	success: boolean;
	error?: string;
	pin?: string;
}

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>({
		isUnlocked: false,
		hasPin: false,
		hasBiometric: false,
		biometricCredentialId: null,
		pinHash: null
	});

	return {
		subscribe,

		/**
		 * Initialize - check if PIN exists
		 */
		async init(): Promise<void> {
			if (!browser) return;

			try {
				const vaultData = (await getFromVault('auth')) as AuthData | undefined;
				if (vaultData) {
					update((state) => ({
						...state,
						hasPin: true,
						hasBiometric: !!vaultData.biometricCredentialId,
						biometricCredentialId: vaultData.biometricCredentialId || null,
						pinHash: vaultData.pinHash || null
					}));
				}
			} catch (error) {
				console.error('Error initializing auth:', error);
			}
		},

		/**
		 * Setup PIN (first time)
		 */
		async setupPin(pin: string): Promise<Result> {
			if (!browser) return { success: false };

			try {
				const pinHash = await hashPin(pin);
				const authData: AuthData = {
					pinHash,
					biometricCredentialId: null
				};

				await saveToVault('auth', authData);

				update((state) => ({
					...state,
					hasPin: true,
					isUnlocked: true,
					pinHash
				}));

				return { success: true };
			} catch (error) {
				console.error('Error setting up PIN:', error);
				return { success: false, error: String(error) };
			}
		},

		/**
		 * Unlock with PIN
		 */
		async unlockWithPin(pin: string): Promise<Result> {
			if (!browser) return { success: false };

			try {
				const vaultData = (await getFromVault('auth')) as AuthData | undefined;
				if (!vaultData) {
					return { success: false, error: 'No PIN set up' };
				}

				const pinHash = await hashPin(pin);
				if (pinHash !== vaultData.pinHash) {
					return { success: false, error: 'Incorrect PIN' };
				}

				update((state) => ({
					...state,
					isUnlocked: true
				}));

				return { success: true, pin };
			} catch (error) {
				console.error('Error unlocking with PIN:', error);
				return { success: false, error: String(error) };
			}
		},

		/**
		 * Unlock with biometric
		 */
		async unlockWithBiometric(): Promise<Result> {
			if (!browser) return { success: false };

			try {
				const vaultData = (await getFromVault('auth')) as AuthData | undefined;
				if (!vaultData?.biometricCredentialId) {
					return { success: false, error: 'Biometric not set up' };
				}

				const authenticated = await authenticateWithBiometric(vaultData.biometricCredentialId);

				if (authenticated) {
					update((state) => ({
						...state,
						isUnlocked: true
					}));
					return { success: true };
				} else {
					return { success: false, error: 'Biometric authentication failed' };
				}
			} catch (error) {
				console.error('Error unlocking with biometric:', error);
				return { success: false, error: String(error) };
			}
		},

		/**
		 * Link biometric
		 */
		async linkBiometric(credentialId: string): Promise<Result> {
			if (!browser) return { success: false };

			try {
				const vaultData = (await getFromVault('auth')) as AuthData | undefined;
				if (!vaultData) {
					return { success: false, error: 'No PIN set up' };
				}

				vaultData.biometricCredentialId = credentialId;
				await saveToVault('auth', vaultData);

				update((state) => ({
					...state,
					hasBiometric: true,
					biometricCredentialId: credentialId
				}));

				return { success: true };
			} catch (error) {
				console.error('Error linking biometric:', error);
				return { success: false, error: String(error) };
			}
		},

		/**
		 * Lock
		 */
		lock(): void {
			update((state) => ({
				...state,
				isUnlocked: false
			}));
		},

		/**
		 * Reset (clear all data)
		 */
		async reset(): Promise<void> {
			if (!browser) return;

			try {
				await clearVault();
				set({
					isUnlocked: false,
					hasPin: false,
					hasBiometric: false,
					biometricCredentialId: null,
					pinHash: null
				});
			} catch (error) {
				console.error('Error resetting auth:', error);
			}
		}
	};
}

export const authStore = createAuthStore();
