// Web Crypto API encryption using PBKDF2 + AES-GCM

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ITERATIONS = 100000;

/**
 * Derive encryption key from PIN using PBKDF2
 */
async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, [
		'deriveBits',
		'deriveKey'
	]);

	return crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: salt as any,
			iterations: ITERATIONS,
			hash: 'SHA-256'
		},
		keyMaterial,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);
}

/**
 * Encrypt data with PIN
 */
export async function encrypt(data: unknown, pin: string): Promise<string> {
	const encoder = new TextEncoder();
	const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

	const key = await deriveKey(pin, salt);

	const encrypted = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv: iv },
		key,
		encoder.encode(JSON.stringify(data))
	);

	// Combine salt + iv + encrypted data
	const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
	result.set(salt, 0);
	result.set(iv, salt.length);
	result.set(new Uint8Array(encrypted), salt.length + iv.length);

	return arrayBufferToBase64(result);
}

/**
 * Decrypt data with PIN
 */
export async function decrypt<T = unknown>(encryptedBase64: string, pin: string): Promise<T> {
	const decoder = new TextDecoder();
	const encrypted = base64ToArrayBuffer(encryptedBase64);

	const salt = encrypted.slice(0, SALT_LENGTH);
	const iv = encrypted.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
	const data = encrypted.slice(SALT_LENGTH + IV_LENGTH);

	const key = await deriveKey(pin, salt);

	try {
		const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, data);

		return JSON.parse(decoder.decode(decrypted));
	} catch (error) {
		throw new Error('Invalid PIN or corrupted data');
	}
}

/**
 * Generate random mnemonic (24 words)
 */
export function generateMnemonic(): string {
	const words = [
		'abandon',
		'ability',
		'able',
		'about',
		'above',
		'absent',
		'absorb',
		'abstract',
		'absurd',
		'abuse',
		'access',
		'accident',
		'account',
		'accuse',
		'achieve',
		'acid',
		'acoustic',
		'acquire',
		'across',
		'act',
		'action',
		'actor',
		'actress',
		'actual'
		// ... (in production, use full BIP39 wordlist)
	];

	const mnemonic: string[] = [];
	for (let i = 0; i < 24; i++) {
		const randomIndex = crypto.getRandomValues(new Uint32Array(1))[0] % words.length;
		mnemonic.push(words[randomIndex]);
	}

	return mnemonic.join(' ');
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

/**
 * Hash PIN for quick verification (don't store raw PIN)
 */
export async function hashPin(pin: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(pin);
	const hash = await crypto.subtle.digest('SHA-256', data);
	return arrayBufferToBase64(hash);
}
