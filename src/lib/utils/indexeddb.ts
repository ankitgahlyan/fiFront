import { browser } from '$app/environment';

const DB_NAME = 'fisvelte-cache';
const DB_VERSION = 1;

interface CacheEntry<T> {
	key: string;
	data: T;
	timestamp: number;
	expiresAt: number;
}

let db: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
	if (!browser) throw new Error('IndexedDB not available in SSR');
	if (db) return db;

	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => {
			db = request.result;
			resolve(db);
		};

		request.onupgradeneeded = (event) => {
			const database = (event.target as IDBOpenDBRequest).result;

			if (!database.objectStoreNames.contains('cache')) {
				database.createObjectStore('cache', { keyPath: 'key' });
			}
			if (!database.objectStoreNames.contains('walletData')) {
				database.createObjectStore('walletData', { keyPath: 'address' });
			}
			if (!database.objectStoreNames.contains('lotteryData')) {
				database.createObjectStore('lotteryData', { keyPath: 'key' });
			}
		};
	});
}

export async function setCache<T>(
	store: string,
	key: string,
	data: T,
	ttlMs: number = 3600000
): Promise<void> {
	if (!browser) return;

	const database = await openDB();
	const entry: CacheEntry<T> = {
		key,
		data,
		timestamp: Date.now(),
		expiresAt: Date.now() + ttlMs
	};

	return new Promise((resolve, reject) => {
		const transaction = database.transaction(store, 'readwrite');
		const objectStore = transaction.objectStore(store);
		const request = objectStore.put({ ...entry, key } as any);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve();
	});
}

export async function getCache<T>(store: string, key: string): Promise<T | null> {
	if (!browser) return null;

	const database = await openDB();

	return new Promise((resolve, reject) => {
		const transaction = database.transaction(store, 'readonly');
		const objectStore = transaction.objectStore(store);
		const request = objectStore.get(key);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => {
			const entry = request.result as CacheEntry<T> | undefined;
			if (!entry) {
				resolve(null);
				return;
			}
			if (Date.now() > entry.expiresAt) {
				deleteCache(store, key);
				resolve(null);
				return;
			}
			resolve(entry.data);
		};
	});
}

export async function deleteCache(store: string, key: string): Promise<void> {
	if (!browser) return;

	const database = await openDB();

	return new Promise((resolve, reject) => {
		const transaction = database.transaction(store, 'readwrite');
		const objectStore = transaction.objectStore(store);
		const request = objectStore.delete(key);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve();
	});
}

export async function clearStore(store: string): Promise<void> {
	if (!browser) return;

	const database = await openDB();

	return new Promise((resolve, reject) => {
		const transaction = database.transaction(store, 'readwrite');
		const objectStore = transaction.objectStore(store);
		const request = objectStore.clear();

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve();
	});
}

export async function getAllCache<T>(store: string): Promise<T[]> {
	if (!browser) return [];

	const database = await openDB();

	return new Promise((resolve, reject) => {
		const transaction = database.transaction(store, 'readonly');
		const objectStore = transaction.objectStore(store);
		const request = objectStore.getAll();

		request.onerror = () => reject(request.error);
		request.onsuccess = () => {
			const entries = request.result as CacheEntry<T>[];
			const validEntries = entries.filter((entry) => Date.now() <= entry.expiresAt);
			resolve(validEntries.map((entry) => entry.data));
		};
	});
}

export async function setWalletData(
	address: string,
	balance: number,
	jettons: any[],
	transactions: any[],
	lastUpdated: number = Date.now()
): Promise<void> {
	if (!browser) return;

	const database = await openDB();

	return new Promise((resolve, reject) => {
		const transaction = database.transaction('walletData', 'readwrite');
		const objectStore = transaction.objectStore('walletData');
		const request = objectStore.put({
			address,
			balance,
			jettons,
			transactions,
			lastUpdated
		});

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve();
	});
}

export async function getWalletData(
	address: string
): Promise<{ balance: number; jettons: any[]; transactions: any[]; lastUpdated: number } | null> {
	if (!browser) return null;

	const database = await openDB();

	return new Promise((resolve, reject) => {
		const transaction = database.transaction('walletData', 'readonly');
		const objectStore = transaction.objectStore('walletData');
		const request = objectStore.get(address);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result || null);
	});
}

export async function setLotteryData(key: string, data: any, ttlMs: number = 30000): Promise<void> {
	return setCache('lotteryData', key, data, ttlMs);
}

export async function getLotteryData<T>(key: string): Promise<T | null> {
	return getCache<T>('lotteryData', key);
}
