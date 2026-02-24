<script lang="ts">
	import './app.css';
	import { tonStore } from '$lib/deployer/tonstore.svelte';
	import {
		validate,
		computeContractAddress,
		buildTransaction,
		toFriendlyTestnet,
		toFriendlyBounce,
		isValidAddress,
		type DeployParams,
		type ValidationError
	} from '$lib/deployer/deploy';
	import SectionLabel from '$lib/components/deployer/SectionLabel.svelte';
	import Field from '$lib/components/deployer/Field.svelte';
	import PreviewRow from '$lib/components/deployer/PreviewRow.svelte';
	import QrScanner from '@/components/common/QrScanner.svelte';
	import { getJettonAddr } from '@/stores/fi';
	import { Address } from '@ton/core';

	// ── Form state (Svelte 5 runes) ────────────────────────────────────────────
	let fiJettonAddr = $state('');
	let admin = $state('');
	// let fiJettonAddr = $derived((await getJettonAddr(Address.parse(admin))).toString({testOnly: true}));
	let iconUri = $state('');
	let tokenName = $state('');
	let tokenSymbol = $state('');

	// ── UI state ───────────────────────────────────────────────────────────────
	let deploying = $state(false);
	let deployedAddr = $state<string | null>(null);
	let deployedBoc = $state<string | null>(null);
	let errors = $state<ValidationError[]>([]);

	interface LogEntry {
		time: string;
		type: 'info' | 'ok' | 'warn' | 'err';
		msg: string;
	}
	let logs = $state<LogEntry[]>([]);

	// ── Toast ──────────────────────────────────────────────────────────────────
	let toast = $state<{ msg: string; type: 'ok' | 'err' | 'info' } | null>(null);
	let toastTimer = 0;

	function showToast(msg: string, type: 'ok' | 'err' | 'info' = 'info') {
		toast = { msg, type };
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toast = null), 3200) as unknown as number;
	}

	// ── Log helpers ────────────────────────────────────────────────────────────
	function log(type: LogEntry['type'], msg: string) {
		const now = new Date();
		const time = now.toTimeString().slice(0, 8);
		logs = [...logs, { time, type, msg }];
	}

	// ── Derived: preview contract address ─────────────────────────────────────
	let previewAddr = $derived.by(() => {
		if (!fiJettonAddr.trim() || !admin.trim()) return null;
		if (!isValidAddress(fiJettonAddr) || !isValidAddress(admin)) return null;
		try {
			return computeContractAddress({ fiJettonAddr, admin, iconUri, tokenName, tokenSymbol });
		} catch {
			return null;
		}
	});

	// ── Field-level error helpers ──────────────────────────────────────────────
	function fieldError(field: string): string | null {
		return errors.find((e) => e.field === field)?.message ?? null;
	}

	// ── Auto-fill admin from connected wallet ─────────────────────────────────
	// $effect(() => {
	// 	const raw = tonStore.rawAddress;
	// 	if (raw && !adminAddr) {
	// 		adminAddr = toFriendlyTestnet(raw);
	// 	}
	// });

	// ── Init TonConnect on mount ───────────────────────────────────────────────
	// onMount(async () => {
	// 	// if (!browser) return;
	// 	// const manifestUrl = `${window.location.origin}/tonconnect-manifest.json`;
	// 	log('info', 'Initialising TonConnect…');
	// 	// await tonStore.init();
	// 	if (tonStore.error) {
	// 		log('err', `TonConnect error: ${tonStore.error}`);
	// 	} else {
	// 		log('info', 'TonConnect ready.');
	// 	}
	// });

	// ── Deploy ─────────────────────────────────────────────────────────────────
	async function deploy() {
		const params: DeployParams = {
			fiJettonAddr,
			admin,
			iconUri,
			tokenName,
			tokenSymbol
		};

		errors = validate(params);
		if (errors.length) return;

		if (!tonStore.connected) {
			showToast('Please connect your wallet first.', 'err');
			return;
		}

		deploying = true;
		deployedAddr = null;
		deployedBoc = null;

		log('info', '— Building transaction…');

		try {
			const tx = buildTransaction(params);
			const contractAddr = tx.messages[0].address;

			log('info', `Contract address: ${contractAddr}`);
			log('info', `Sending 0.2 TON from ${tonStore.address?.slice(0, 12)}…`);

			const result = await tonStore.sendTransaction(tx);

			deployedAddr = contractAddr;
			deployedBoc = result.boc;

			log('ok', `✓ Broadcast! BOC: ${result.boc.slice(0, 24)}…`);
			showToast('Transaction sent!', 'ok');
		} catch (e: any) {
			const msg = e?.message ?? String(e);
			if (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('cancel')) {
				log('warn', 'Transaction rejected by user.');
				showToast('Cancelled.', 'err');
			} else {
				log('err', `Error: ${msg}`);
				showToast('Deploy failed — see log.', 'err');
			}
		} finally {
			deploying = false;
		}
	}

	function clearLogs() {
		logs = [];
	}

	const TONSCAN = (addr: string) => `https://testnet.tonscan.org/address/${addr}`;
	const TONVIEWER = (addr: string) => `https://testnet.tonviewer.com/${addr}`;
</script>

<!-- ─────────────────────────────────── MARKUP ─────────────────────────────── -->

<div class="relative min-h-screen overflow-x-hidden">
	<!-- Grid bg -->
	<div
		class="pointer-events-none fixed inset-0 z-0"
		style="background-image: linear-gradient(rgba(14,165,233,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,.04) 1px, transparent 1px); background-size: 40px 40px;"
	></div>
	<!-- Glow -->
	<div
		class="pointer-events-none fixed inset-0 z-0"
		style="background: radial-gradient(ellipse 70% 45% at 50% -5%, rgba(14,165,233,.1) 0%, transparent 70%);"
	></div>

	<!-- ── MAIN CONTENT ──────────────────────────────────────────────────────── -->
	<div class="relative z-10 mx-auto max-w-2xl px-4 pt-0 pb-24">
		<!-- ── HEADER ──────────────────────────────────────────────────────────── -->
		<header class="mb-10 flex items-center justify-between border-b border-[--color-border] py-7">
			<div class="flex items-center gap-4">
				<div
					class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg
                    bg-linear-to-br from-[--color-accent] to-[--color-accent2]
                    font-mono text-base font-bold text-white shadow-[0_0_20px_rgba(14,165,233,.3)]"
				>
					FI
				</div>
				<div>
					<h1
						class="font-sans text-sm font-semibold tracking-widest text-[--color-heading] uppercase"
					>
						Jetton Deployer
					</h1>
					<p class="font-mono text-[11px] tracking-wider text-[--color-muted]">
						Personal Minter · FossFi Protocol
					</p>
				</div>
			</div>
			<!-- Testnet badge -->
			<span
				class="flex items-center gap-2 rounded-full border border-[rgba(245,158,11,.3)]
                   bg-[rgba(245,158,11,.08)] px-3 py-1.5 font-mono text-[11px]
                   font-medium tracking-widest text-[--color-amber]"
			>
				<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-[--color-amber]"></span>
				TESTNET
			</span>
		</header>

		<!-- ── WALLET SECTION ───────────────────────────────────────────────────── -->
		<section
			class="mb-7 flex items-center justify-between gap-4 rounded-xl
                    border border-[--color-border] bg-[--color-surface] p-5"
		>
			<div class="flex items-center gap-3">
				<div
					class="flex h-9 w-9 items-center justify-center rounded-lg
                    border border-[--color-border2] bg-[--color-surface2] text-base"
				>
					{#if tonStore.connected}💎{:else}👛{/if}
				</div>
				<div>
					<p class="font-mono text-[10px] tracking-widest text-[--color-muted] uppercase">
						Connected Wallet
					</p>
					{#if tonStore.connected && tonStore.rawAddress}
						<p class="max-w-65 truncate font-mono text-xs text-[--color-heading]">
							{toFriendlyTestnet(tonStore.rawAddress)}
						</p>
					{:else}
						<p class="font-mono text-xs text-[--color-muted]">Not connected</p>
					{/if}
				</div>
			</div>

			{#if tonStore.connected}
				<button
					onclick={() => tonStore.disconnect()}
					class="cursor-pointer rounded-lg border border-[rgba(244,63,94,.3)]
                 bg-[rgba(244,63,94,.07)] px-4 py-2 font-mono text-[11px]
                 font-medium tracking-wider text-[--color-rose] transition hover:bg-[rgba(244,63,94,.14)]"
				>
					Disconnect
				</button>
			{:else}
				<button
					onclick={() => tonStore.connect()}
					disabled={!tonStore.ready}
					class="cursor-pointer rounded-lg bg-linear-to-r from-[--color-accent] to-[--color-accent2]
                 px-5 py-2 font-mono text-[11px] font-semibold tracking-wider text-white
                 shadow-[0_0_14px_rgba(14,165,233,.25)] transition
                 hover:-translate-y-px hover:shadow-[0_0_24px_rgba(14,165,233,.4)]
                 disabled:cursor-not-allowed disabled:opacity-40"
				>
					{tonStore.ready ? 'Connect Wallet' : 'Loading…'}
				</button>
			{/if}
		</section>

		<!-- ── SECTION: CONTRACT CONFIG ─────────────────────────────────────────── -->
		<section class="mb-6">
			<SectionLabel num="01" title="Contract Configuration" />

			<div class="space-y-5 rounded-xl border border-[--color-border] bg-[--color-surface] p-6">
				<!-- Admin / Deployer Address -->
				<Field
					id="admin-addr"
					label="Deployer / Admin Address"
					required
					hint="This address will be set as the jetton admin and mint recipient. Auto-filled from your wallet."
					error={fieldError('admin')}
				>
					<QrScanner bind:value={admin} />
					<div class="relative">
						<input
							id="admin-addr"
							type="text"
							bind:value={admin}
							placeholder="0Q... for testnet, EQ... for mainnet"
							spellcheck="false"
							autocomplete="off"
							class:input-error={!!fieldError('admin')}
							class="input-base pr-24"
						/>
						{#if tonStore.rawAddress}
							<button
								onclick={() => (admin = toFriendlyTestnet(tonStore.rawAddress!))}
								class="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer
                       rounded-md border border-[--color-border2] bg-[--color-surface2] px-2.5
                       py-1 font-mono text-[10px] tracking-wider
                       text-[--color-accent] transition hover:bg-[rgba(14,165,233,.1)]"
							>
								SELF
							</button>
						{/if}
					</div>
				</Field>

				<!-- FI Jetton Address -->
				{#if admin}
					<!-- {#await getFiJetton(Address.parse(tonStore.address!)) then } -->
					<button
						onclick={async () =>
							(fiJettonAddr = (await getJettonAddr(Address.parse(admin))).toString({
								testOnly: true
							}))}
						class="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer
								rounded-md border border-[--color-border2] bg-[--color-surface2] px-2.5
								py-1 font-mono text-[10px] tracking-wider
								text-[--color-accent] transition hover:bg-[rgba(14,165,233,.1)]"
					>
						SELF
					</button>
					<!-- {/await} -->
				{/if}
				<!-- <Field
					id="fi-jetton"
					label="FI Jetton Address"
					required
					hint="The deployed FossFi jetton wallet contract address on testnet."
					error={fieldError('fiJettonAddr')}
				>
					<div class="relative">
						<input
							id="fi-jetton"
							type="text"
							bind:value={fiJettonAddr}
							placeholder="kQ... for testnet or EQ... for mainnet"
							spellcheck="false"
							autocomplete="off"
							class:input-error={!!fieldError('fiJettonAddr')}
							class="input-base"
						/>
					</div>
				</Field> -->

				<!-- token name -->
				<Field id="token-name" label="TOKEN NAME" required hint="full name of your TOKEN">
					<input
						id="token-name"
						type="text"
						bind:value={tokenName}
						placeholder="Bitcoin"
						spellcheck="false"
						autocomplete="off"
						class:input-error={!!fieldError('token name')}
						class="input-base"
					/>
				</Field>

				<!-- token symbol -->
				<Field id="token-symbol" required label="TOKEN SYMBOL" hint="short symbol for display">
					<input
						id="token-symbol"
						type="text"
						bind:value={tokenSymbol}
						placeholder="BTC"
						spellcheck="false"
						autocomplete="off"
						class:input-error={!!fieldError('token symbol')}
						class="input-base"
					/>
				</Field>

				<!-- Icon URI -->
				<Field id="icon-uri" label="ICON IMAGE URI" hint="Optional HTTPS URL to a file with image">
					<input
						id="icon-uri"
						type="text"
						bind:value={iconUri}
						placeholder="https://example.com/my-picture.png"
						spellcheck="false"
						autocomplete="off"
						class="input-base"
					/>
				</Field>
			</div>
		</section>

		<!-- ── SECTION: DEFAULTS INFO ────────────────────────────────────────────── -->
		<!-- <section class="mb-6">
			<SectionLabel num="02" title="Deployment Defaults" />

			<div
				class="divide-y divide-[--color-border] rounded-xl border border-[--color-border] bg-[--color-surface]"
			>
				{#each [['Initial Supply', '0 tokens'], ['Mint Amount', '1,000,000 tokens (×10⁹ nanos)'], ['Mint Recipient', 'Deployer / Admin Address'], ['TON for Storage', '0.1 TON'], ['Total TX Value', '0.2 TON'], ['Network', 'TON Testnet']] as [k, v]}
					<div class="flex items-center justify-between px-5 py-3">
						<span class="font-mono text-[11px] text-[--color-muted]">{k}</span>
						<span class="font-mono text-[11px] text-[--color-heading]">{v}</span>
					</div>
				{/each}
			</div>
		</section> -->

		<!-- ── SECTION: TX PREVIEW ───────────────────────────────────────────────── -->
		<section class="mb-7">
			<SectionLabel num="03" title="Transaction Preview" />

			<div
				class="space-y-2.5 rounded-xl border border-[rgba(14,165,233,.2)] bg-[rgba(14,165,233,.04)] p-5"
			>
				<PreviewRow key="Admin / Deployer" value={admin || '—'} mono />
				<PreviewRow key="FI Jetton Addr" value={fiJettonAddr || '—'} mono />
				<PreviewRow key="Metadata URI" value={iconUri || '(none)'} />
				<div class="border-t border-[rgba(14,165,233,.12)] pt-2.5">
					<div class="flex items-start justify-between gap-3">
						<span class="font-mono text-[11px] text-[--color-muted]">Contract Address</span>
						{#if previewAddr}
							<span
								class="max-w-75 text-right font-mono text-[11px] break-all text-[--color-accent]"
							>
								{previewAddr}
							</span>
						{:else}
							<span class="font-mono text-[11px] text-[--color-muted] italic">
								Fill required fields to compute
							</span>
						{/if}
					</div>
				</div>
			</div>
		</section>

		<!-- ── DEPLOY BUTTON ─────────────────────────────────────────────────────── -->
		<button
			onclick={deploy}
			disabled={deploying ||
				!tonStore.connected ||
				!tokenName ||
				!tokenSymbol ||
				!fiJettonAddr ||
				!admin}
			class="relative w-full cursor-pointer overflow-hidden
             rounded-xl bg-linear-to-r from-[--color-accent]
             to-[--color-accent2] py-4 font-sans text-sm font-semibold tracking-[.15em] text-white
             uppercase shadow-[0_0_24px_rgba(14,165,233,.3)]
             transition hover:-translate-y-0.5
             hover:shadow-[0_0_40px_rgba(14,165,233,.5)]
             active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
		>
			<span class="relative z-10 flex items-center justify-center gap-3">
				{#if deploying}
					<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="3"
						/>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8v4l3-3-3-3v4a10 10 0 100 10z"
						/>
					</svg>
					Broadcasting…
				{:else if !tonStore.connected}
					Connect Wallet to Deploy
				{:else}
					Deploy &amp; Mint Jetton
				{/if}
			</span>
			<!-- Shimmer -->
			{#if !deploying && tonStore.connected}
				<span
					class="absolute inset-0 translate-x-[-150%] -skew-x-12 bg-linear-to-r
                     from-transparent via-white/10 to-transparent transition-transform
                     duration-700 hover:translate-x-[150%]"
				></span>
			{/if}
		</button>

		<!-- ── SUCCESS CARD ──────────────────────────────────────────────────────── -->
		{#if deployedAddr}
			<div
				class="mt-6 animate-[fadeUp_.3s_ease_forwards] rounded-xl border
                  border-[rgba(16,185,129,.3)] bg-[rgba(16,185,129,.06)] p-5"
			>
				<p
					class="mb-3 font-mono text-[10px] font-bold tracking-[.15em] text-[--color-emerald] uppercase"
				>
					✓ Transaction Broadcast
				</p>
				<p class="mb-1 font-mono text-[11px] text-[--color-muted]">Contract Address</p>
				<p class="mb-4 font-mono text-xs break-all text-[--color-heading]">{deployedAddr}</p>
				<div class="flex flex-wrap gap-3">
					<a
						href={TONSCAN(deployedAddr)}
						target="_blank"
						rel="noopener"
						class="rounded-lg border border-[rgba(14,165,233,.25)] px-4 py-2
                    font-mono text-[11px] text-[--color-accent] transition
                    hover:bg-[rgba(14,165,233,.1)]"
					>
						Tonscan →
					</a>
					<a
						href={TONVIEWER(deployedAddr)}
						target="_blank"
						rel="noopener"
						class="rounded-lg border border-[rgba(14,165,233,.25)] px-4 py-2
                    font-mono text-[11px] text-[--color-accent] transition
                    hover:bg-[rgba(14,165,233,.1)]"
					>
						Tonviewer →
					</a>
				</div>
			</div>
		{/if}

		<!-- ── CONSOLE LOG ───────────────────────────────────────────────────────── -->
		<div class="mt-8 overflow-hidden rounded-xl border border-[--color-border]">
			<div
				class="flex items-center justify-between border-b border-[--color-border]
                  bg-[--color-surface] px-4 py-2.5"
			>
				<span class="font-mono text-[10px] tracking-widest text-[--color-muted] uppercase">
					▸ Console
				</span>
				<button
					onclick={clearLogs}
					class="cursor-pointer rounded px-2 py-1
                       font-mono text-[10px] text-[--color-muted] transition hover:text-[--color-rose]"
				>
					clear
				</button>
			</div>
			<div class="max-h-56 min-h-18 space-y-1.5 overflow-y-auto bg-[--color-bg] p-4">
				{#if logs.length === 0}
					<p class="py-4 text-center font-mono text-[11px] text-[--color-muted]">
						No activity yet.
					</p>
				{:else}
					{#each logs as entry (entry.time + entry.msg)}
						<div
							class="flex gap-3 border-b border-[rgba(255,255,255,.03)] pb-1.5 font-mono text-[11px]"
						>
							<span class="shrink-0 text-[--color-muted]">[{entry.time}]</span>
							<span
								class:text-[--color-text]={entry.type === 'info'}
								class:text-[--color-emerald]={entry.type === 'ok'}
								class:text-[--color-rose]={entry.type === 'err'}
								class:text-[--color-amber]={entry.type === 'warn'}
							>
								{entry.msg}
							</span>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
	<!-- /wrapper -->
</div>

<!-- ── TOAST ───────────────────────────────────────────────────────────────── -->
{#if toast}
	<div
		class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2
              rounded-xl border px-5 py-3 font-mono text-xs text-[--color-heading]
              shadow-xl backdrop-blur-sm transition-all duration-300
              {toast.type === 'ok'
			? 'border-[rgba(16,185,129,.4)] bg-[rgba(16,185,129,.12)]'
			: toast.type === 'err'
				? 'border-[rgba(244,63,94,.4)]  bg-[rgba(244,63,94,.1)]'
				: 'border-[--color-border2] bg-[--color-surface2]'}"
	>
		{toast.msg}
	</div>
{/if}

<style>
	:global(.input-base) {
		width: 100%;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		color: var(--color-heading);
		font-family: var(--font-mono);
		font-size: 12px;
		padding: 0.6rem 0.875rem;
		outline: none;
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
	}
	:global(.input-base:focus) {
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.12);
	}
	:global(.input-base::placeholder) {
		color: var(--color-muted);
		opacity: 0.5;
	}
	:global(.input-error) {
		border-color: var(--color-rose) !important;
		box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.12) !important;
	}
	@keyframes fadeUp {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
