import { browser } from '$app/environment';
import { MANIFEST_URL } from '@/consts';

// ── Types ────────────────────────────────────────────────────────────────────
interface WalletInfo {
	address: string; // raw 0:hex format
	friendly: string; // UQ... testnet friendly
	name: string;
}

// ── Store (Svelte 5 runes class) ──────────────────────────────────────────────
class TonConnectStore {
	ui = $state<any>(null);
	wallet = $state<WalletInfo | null>(null);
	ready = $state(false);
	error = $state<string | null>(null);

	get connected() {
		return this.wallet !== null;
	}
	get address() {
		return this.wallet?.friendly ?? null;
	}
	get rawAddress() {
		return this.wallet?.address ?? null;
	}

	async init() {
		if (!browser || this.ui) return;

		try {
			// Dynamic import to avoid SSR issues
			const { TonConnectUI, THEME } = await import('@tonconnect/ui');
			const ui = new TonConnectUI({
				manifestUrl: MANIFEST_URL,
				buttonRootId: 'ton-connect-button',
				analytics: { mode: 'off' },
				uiPreferences: {
					theme: THEME.DARK
				}
			});

			ui.onStatusChange((w: any) => {
				if (w?.account) {
					const raw = w.account.address as string;
					this.wallet = {
						address: raw,
						friendly: rawToFriendly(raw),
						name: w.device?.appName ?? 'Wallet'
					};
				} else {
					this.wallet = null;
				}
			});

			// Restore any existing session
			if (ui.wallet?.account) {
				const raw = ui.wallet.account.address as string;
				this.wallet = {
					address: raw,
					friendly: rawToFriendly(raw),
					name: ui.wallet.device?.appName ?? 'Wallet'
				};
			}

			this.ui = ui;
			this.ready = true;
		} catch (e: any) {
			this.error = e?.message ?? 'Failed to init TonConnect';
		}
	}

	async connect() {
		if (!this.ui) return;
		try {
			await this.ui.openModal();
		} catch (e: any) {
			this.error = e?.message;
		}
	}

	async disconnect() {
		if (!this.ui) return;
		try {
			await this.ui.disconnect();
		} catch (_) {
			/* ignore */
		}
	}

	async sendTransaction(tx: any): Promise<{ boc: string }> {
		if (!this.ui) throw new Error('TonConnect not initialised');
		return this.ui.sendTransaction(tx);
	}
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function rawToFriendly(raw: string): string {
	// raw is "0:<64 hex chars>" or just the hex — convert to UQ... testnet address
	try {
		// We'll do this in the browser via @ton/core at call site; keep raw here
		// as a fallback if core isn't loaded yet
		return raw;
	} catch (_) {
		return raw;
	}
}

export const tonStore = new TonConnectStore();
