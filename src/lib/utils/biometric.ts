// WebAuthn biometric authentication

import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

interface BiometricCredential {
	credentialId: string;
	publicKey: string;
	challenge: string;
}

/**
 * Check if WebAuthn is supported
 */
export function isWebAuthnSupported(): boolean {
	return typeof window !== 'undefined' && window.PublicKeyCredential !== undefined;
}

/**
 * Check if biometric is available
 */
export async function isBiometricAvailable(): Promise<boolean> {
	if (!isWebAuthnSupported()) return false;

	try {
		return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
	} catch {
		return false;
	}
}

/**
 * Register biometric credential
 */
export async function registerBiometric(username: string = 'user'): Promise<BiometricCredential> {
	const challenge = crypto.getRandomValues(new Uint8Array(32));
	const userId = crypto.getRandomValues(new Uint8Array(32));

	// Convert to base64 for simplewebauthn
	const challengeBase64 = arrayBufferToBase64(challenge);
	const userIdBase64 = arrayBufferToBase64(userId);

	const registrationOptions = {
		optionsJSON: {
			challenge: challengeBase64,
			rp: {
				name: 'TON Jetton Wallet',
				id: typeof window !== 'undefined' ? window.location.hostname : 'localhost'
			},
			user: {
				id: userIdBase64,
				name: username,
				displayName: 'TON Wallet User'
			},
			pubKeyCredParams: [
				{ alg: -7, type: 'public-key' as const }, // ES256
				{ alg: -257, type: 'public-key' as const } // RS256
			],
			timeout: 60000,
			attestation: 'none' as const,
			authenticatorSelection: {
				authenticatorAttachment: 'platform' as const,
				userVerification: 'required' as const,
				requireResidentKey: false
			}
		}
	};

	try {
		const credential = await startRegistration(registrationOptions);
		return {
			credentialId: credential.id,
			publicKey: credential.response.publicKey || '',
			challenge: challengeBase64
		};
	} catch (error) {
		console.error('Biometric registration failed:', error);
		throw error;
	}
}

/**
 * Authenticate with biometric
 */
export async function authenticateWithBiometric(credentialId: string): Promise<boolean> {
	if (!credentialId) {
		throw new Error('No biometric credential found');
	}

	const challenge = crypto.getRandomValues(new Uint8Array(32));
	const challengeBase64 = arrayBufferToBase64(challenge);

	const authenticationOptions = {
		optionsJSON: {
			challenge: challengeBase64,
			rpId: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
			allowCredentials: [
				{
					id: credentialId,
					type: 'public-key' as const,
					transports: ['internal' as const]
				}
			],
			userVerification: 'required' as const,
			timeout: 60000
		}
	};

	try {
		await startAuthentication(authenticationOptions);
		return true;
	} catch (error) {
		console.error('Biometric authentication failed:', error);
		return false;
	}
}

/**
 * Utilities
 */
function arrayBufferToBase64(buffer: Uint8Array | ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}
