<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { getBalance, sendTransfer } from '$lib/stores/fi';
	import {
		getIsConnected,
		getUserAddress,
		getConnectedWallets,
		getActiveWalletIndex,
		getWalletInitializing
	} from '@/stores/tonconnect.svelte';
	import WalletSelector from '$lib/components/WalletSelector.svelte';
	// import type { FiJettonFullData } from '$lib/FossFiWallet';
	// import Transfer from '$lib/components/fiJetton/Transfer.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
	import { Badge } from '@/components/ui/badge';
	import { Separator } from '@/components/ui/separator';
	import { Wallet, Coins, ArrowRightLeft, Sparkles, Shield, Zap } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import { Send, QrCode, X } from '@lucide/svelte';
	import { Address, toNano } from '@ton/core';
	import QrScanner from '@/components/common/QrScanner.svelte';

	// let error: string | null = $state(null);
	// let jettonStateFull: FiJettonFullData | null = $state(null);
	let loading = $state(false);
	let balance = $state('loading...');
	let recipient = $state('');
	let amount = $state('');
	let selectedAsset = $state('MINT');
	let isSending = $state(false);
	let error = $state('');

	onMount(async () => {
		const stored = localStorage.getItem('balance');
		if (stored) {
			balance = stored;
		}
		// try {
		// 	balance = await getBalance();
		// } catch (e) {
		// 	// Wallet not connected, ignore
		// }
	});

	// $effect(() => {
	// 	if (getUserAddress()) {
	// 		let isMounted = true;
	// 		getBalance()
	// 			.then((b) => {
	// 				if (isMounted) balance = b;
	// 			})
	// 			.catch(() => {});
	// 		return () => {
	// 			isMounted = false;
	// 		};
	// 	}
	// });

	$effect(() => {
		if (error) {
			const timeout = setTimeout(() => {
				error = '';
			}, 5000);
			return () => clearTimeout(timeout);
		}
	});

	async function handleSend() {
		const amountNum = toNano(amount);
		isSending = true;
		error = '';

		try {
			await sendTransfer(Address.parse(recipient), amountNum);
			recipient = '';
			amount = '';
		} catch (err: any) {
			error = err.message || 'Transaction failed';
		} finally {
			isSending = false;
		}
	}
	const features = [
		{
			icon: Shield,
			title: 'Secure',
			description: 'Your keys, your crypto. Fully non-custodial wallet solution.'
		},
		{
			icon: Zap,
			title: 'Fast',
			description: 'Lightning-fast transactions on the TON blockchain.'
		},
		{
			icon: Sparkles,
			title: 'Simple',
			description: 'Intuitive interface designed for everyone.'
		}
	];
</script>

<svelte:head>
	<title>FossFi - Fi that is Foss</title>
</svelte:head>

<div class="container mx-auto space-y-8 px-4 py-8">
	<!-- Error Display -->
	{#if error}
		<div class="border-destructive/50 bg-destructive/10 rounded-lg border p-4">
			<div class="flex items-center gap-3">
				<div class="bg-destructive/20 flex h-8 w-8 items-center justify-center rounded-full">
					<span class="text-destructive text-lg">!</span>
				</div>
				<div class="flex-1">
					<p class="text-destructive font-medium">{error}</p>
				</div>

				<Button variant="ghost" size="sm" onclick={() => (error = '')}>Dismiss</Button>
			</div>
		</div>
	{/if}

	<!-- Hero Section -->
	{#if getWalletInitializing()}
		<div class="flex items-center justify-center py-12">
			<div class="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
		</div>
	{:else if !getIsConnected()}
		<div
			class="from-primary/10 via-primary/5 to-background border-primary/20 relative overflow-hidden rounded-2xl border bg-linear-to-br p-8 md:p-12"
		>
			<div
				class="bg-grid-white/5 dark:bg-grid-black/5 absolute inset-0 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))]"
			></div>
			<div class="relative z-10 space-y-6 text-center">
				<Badge variant="secondary" class="mb-2">TON Blockchain</Badge>
				<h1 class="text-4xl font-bold tracking-tight md:text-6xl">
					Welcome to <span class="text-primary">FossFi</span>
				</h1>
				<p class="text-muted-foreground mx-auto max-w-2xl text-xl">
					The decentralized finance platform built on TON. Simple, secure, and open source.
				</p>
				<div class="flex flex-wrap items-center justify-center gap-4 pt-4">
					<Button size="lg" onclick={() => goto('/dashboard')}>
						<Wallet class="mr-2 h-5 w-5" />
						Open Wallet
					</Button>
					<Button variant="outline" size="lg" onclick={() => goto('/wallets/create')}>
						<Sparkles class="mr-2 h-5 w-5" />
						Create Wallet
					</Button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Connected Wallets Selector -->
	<!-- {#if !$getWalletInitializing()} -->
	<!-- <WalletSelector /> -->

	<!-- Balance Card -->
	{#if getUserAddress()}
		<Card class="overflow-hidden">
			<CardHeader class="bg-muted/50">
				<div class="flex items-center justify-between">
					<div>
						<CardTitle class="flex items-center gap-2">
							<Coins class="text-primary h-5 w-5" />
							Your Balance
						</CardTitle>
						<CardDescription>MINT Token Balance</CardDescription>
					</div>
					<!-- <Badge variant="outline" class="font-mono">
						{$getUserAddress()}
						{String($getUserAddress()).slice(0, 6)}...{String($getUserAddress()).slice(-4)}
					</Badge> -->
				</div>
			</CardHeader>
			<CardContent class="pt-6">
				<div class="flex flex-col items-center justify-between gap-6 md:flex-row">
					<div class="text-center md:text-left">
						<p class="text-muted-foreground mb-1 text-sm">Available Balance</p>
						<p class="text-4xl font-bold tracking-tight">
							{balance} <span class="text-primary">MINT</span>
						</p>
					</div>
					<div class="flex gap-3">
						<Button variant="outline" onclick={async () => (balance = await getBalance())}>
							<ArrowRightLeft class="mr-2 h-4 w-4" />
							Refresh
						</Button>
						<Button variant="outline" onclick={() => goto('/send')}>
							<ArrowRightLeft class="mr-2 h-4 w-4" />
							Send
						</Button>
						<Button onclick={() => goto('/receive')}>
							<Wallet class="mr-2 h-4 w-4" />
							Receive
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Transfer Section -->
		<Card>
			<CardHeader>
				<div class="flex items-center gap-3">
					<div class="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
						<Send class="text-primary h-5 w-5" />
					</div>
					<div>
						<CardTitle>Send Funds</CardTitle>
						<CardDescription>Transfer TONs or Zettons</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent class="space-y-6">
				<!-- Asset Selection -->
				<!-- <div class="space-y-2">
				<Label>Asset</Label>
				<div class="flex flex-wrap gap-2">
					{#each availableAssets as asset}
						<button
							class="rounded-full border px-4 py-2 transition-all {selectedAsset === asset.symbol
								? 'bg-primary text-primary-foreground border-primary'
								: 'bg-background hover:bg-muted'}"
							onclick={() => (selectedAsset = asset.symbol)}
						>
							{asset.symbol}
							<Badge variant="secondary" class="ml-2">{(asset.balance || 0).toFixed(4)}</Badge>
						</button>
					{/each}
				</div>
			</div> -->

				<!-- Recipient -->
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<Label for="recipient">Recipient Address</Label>
						<QrScanner bind:value={recipient} />
					</div>
					<Input
						id="recipient"
						type="text"
						bind:value={recipient}
						placeholder="0Q..."
						class="font-mono"
					/>
				</div>

				<!-- Amount -->
				<div class="space-y-2">
					<Label for="amount">Amount</Label>
					<div class="relative">
						<Input
							id="amount"
							type="number"
							bind:value={amount}
							placeholder="0.0 Coins"
							step="1"
							min="0"
						/>
						<span class="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-sm">
							{selectedAsset}
						</span>
					</div>
				</div>

				<!-- Send Button -->
				<Button
					class="w-full"
					size="lg"
					onclick={handleSend}
					disabled={isSending || !recipient || !amount}
				>
					{#if isSending}
						<div
							class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
						></div>
						Sending...
					{:else}
						<Send class="mr-2 h-4 w-4" />
						Send {selectedAsset}
					{/if}
				</Button>
			</CardContent>
		</Card>
		<!-- <Card>
			<CardHeader>
				<CardTitle>Transfer Tokens</CardTitle>
				<CardDescription>Send MINT tokens to another address</CardDescription>
			</CardHeader>
			<CardContent>
				<Transfer />
			</CardContent>
		</Card> -->
	{:else}
		<Card class="border-dashed">
			<CardContent class="flex flex-col items-center justify-center py-12 text-center">
				<div class="bg-primary/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
					<Wallet class="text-primary h-8 w-8" />
				</div>
				<h3 class="mb-2 text-lg font-semibold">Connect Your Wallet</h3>
				<p class="text-muted-foreground mb-6 max-w-sm">
					Connect your TON wallet to view your balance and make transfers.
				</p>
				<p class="text-muted-foreground text-sm">Use the connect button in the header above</p>
			</CardContent>
		</Card>
	{/if}
	<!-- {/if} -->

	<Separator />

	<!-- Features Section -->
	{#if !getIsConnected()}
		<div class="grid gap-6 md:grid-cols-3">
			{#each features as feature}
				<Card class="group hover:border-primary/50 transition-colors">
					<CardContent class="pt-6">
						<div
							class="bg-primary/10 group-hover:bg-primary/20 mb-4 flex h-12 w-12 items-center justify-center rounded-lg transition-colors"
						>
							<feature.icon class="text-primary h-6 w-6" />
						</div>
						<h3 class="mb-2 text-lg font-semibold">{feature.title}</h3>
						<p class="text-muted-foreground text-sm">{feature.description}</p>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>
