<script lang="ts">
	import { onMount } from 'svelte';
	import { fromNano } from '@ton/core';
	import { getFiJetton } from '$lib/stores/fi';
	import { isConnected, userAddress } from '$lib/stores/tonconnect';
	import type { FiJettonFullData } from '$lib/FossFiWallet';
	import Transfer from '$lib/components/fiJetton/Transfer.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
	import { Badge } from '@/components/ui/badge';
	import { Separator } from '@/components/ui/separator';
	import { Wallet, Coins, ArrowRightLeft, Sparkles, Shield, Zap } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { getJettonBalance } from '@/utils/ton';

	let loading = $state(false);
	let error: string | null = $state(null);
	let jettonStateFull: FiJettonFullData | null = $state(null);
	let balance = $state('loading...');

	onMount(() => {
		getBalance();
		// loadState();
		// getState();
	});

	async function getBalance() {
		try {
			if (!$userAddress) throw new Error('Wallet not connected');
			balance = fromNano((await (await getFiJetton($userAddress!)).getGetWalletData()).balance);
		} catch (e: any) {
			error = e.message || 'failed to get balance';
		}
	}
	function loadState() {
		loading = true;
		try {
			if (!$userAddress) throw new Error('Wallet not connected');
			// jettonStateFull = localStorage.getItem('jettonStateFull');
			throw new Error
		} catch (e) {
			getState();
		}
	}

	async function getState() {
		// loading = true;
		try {
			// if (!$userAddress) throw new Error('Wallet not connected');
			jettonStateFull = await (await getFiJetton($userAddress!)).getGetWalletDataFull();
		} catch (e: any) {
			error = e.message || 'Failed to fetch state';
		} finally {
			loading = false;
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
	<!-- Hero Section -->
	{#if !$isConnected}
		<div
			class="from-primary/10 via-primary/5 to-background border-primary/20 relative overflow-hidden rounded-2xl border bg-gradient-to-br p-8 md:p-12"
		>
			<div
				class="bg-grid-white/5 dark:bg-grid-black/5 absolute inset-0 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"
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

	<!-- Balance Card -->
	{#if $userAddress}
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
						{$userAddress}
						{String($userAddress).slice(0, 6)}...{String($userAddress).slice(-4)}
					</Badge> -->
				</div>
			</CardHeader>
			<CardContent class="pt-6">
				<div class="flex flex-col items-center justify-between gap-6 md:flex-row">
					<div class="text-center md:text-left">
						<p class="text-muted-foreground mb-1 text-sm">Available Balance</p>
						<p class="text-4xl font-bold tracking-tight">
							<!-- {#if balance} -->
								{balance} <span class="text-primary">MINT</span>
							<!-- {:else if loading}
								<span class="text-muted-foreground">Loading...</span>
							{:else}
								<span class="text-muted-foreground">0 MINT</span>
							{/if} -->
						</p>
					</div>
					<div class="flex gap-3">
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
				<CardTitle>Transfer Tokens</CardTitle>
				<CardDescription>Send MINT tokens to another address</CardDescription>
			</CardHeader>
			<CardContent>
				<Transfer />
			</CardContent>
		</Card>
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
				<Button variant="ghost" size="sm" onclick={() => (error = null)}>Dismiss</Button>
			</div>
		</div>
	{/if}

	<Separator />

	<!-- Features Section -->
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
</div>
