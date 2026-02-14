<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import { walletStore, activeWallet } from '$lib/stores/walletStore';
	import WalletCard from '$lib/components/fiJetton/WalletCard.svelte';
	import TransactionList from '$lib/components/fiJetton/TransactionList.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
	import { Badge } from '@/components/ui/badge';
	import { Separator } from '@/components/ui/separator';
	import { Wallet, ArrowUpRight, ArrowDownLeft, RefreshCw, Settings, LogOut } from '@lucide/svelte';

	let currentPin = '';
	let isRefreshing = $state(false);
	let showMenu = $state(false);

	onMount(async () => {
		if (!$authStore.isUnlocked) {
			goto('/');
			return;
		}

		const pinPrompt = prompt('Enter PIN to decrypt wallet data:');
		if (!pinPrompt) {
			goto('/');
			return;
		}

		currentPin = pinPrompt;
		await walletStore.loadWallets(currentPin);

		if ($walletStore.wallets.length === 0) {
			goto('/wallets/create');
		} else {
			refreshData();
		}
	});

	async function refreshData() {
		if (!currentPin || isRefreshing) return;
		isRefreshing = true;
		await walletStore.refreshBalances(currentPin);
		isRefreshing = false;
	}

	function handleLogout() {
		authStore.lock();
		goto('/');
	}

	function formatBalance(balance: number | undefined): string {
		return balance !== undefined ? balance.toFixed(4) : '0.0000';
	}
</script>

<svelte:head>
	<title>Dashboard - TON Wallet</title>
</svelte:head>

<div class="container mx-auto space-y-6 px-4 py-8">
	<!-- Header Card -->
	<Card class="from-primary/10 via-primary/5 to-background border-primary/20 bg-gradient-to-br">
		<CardContent class="pt-6">
			<div class="mb-6 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="bg-primary/20 flex h-12 w-12 items-center justify-center rounded-full">
						<Wallet class="text-primary h-6 w-6" />
					</div>
					<div>
						<h1 class="text-2xl font-bold">TON Wallet</h1>
						{#if $activeWallet}
							<p class="text-muted-foreground text-sm">{$activeWallet.name}</p>
						{/if}
					</div>
				</div>
				<Button variant="ghost" size="icon" onclick={() => (showMenu = !showMenu)}>
					<Settings class="h-5 w-5" />
				</Button>
			</div>

			{#if $activeWallet}
				<div class="py-4 text-center">
					<p class="mb-2 text-5xl font-bold">{formatBalance($activeWallet.balance)}</p>
					<div class="flex items-center justify-center gap-2">
						<Badge variant="secondary">TON</Badge>
						<Badge variant="outline">{$walletStore.isTestnet ? 'Testnet' : 'Mainnet'}</Badge>
					</div>
					<p class="text-muted-foreground mt-3 font-mono text-xs">
						{$activeWallet.address.slice(0, 8)}...{$activeWallet.address.slice(-6)}
					</p>
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Quick Actions -->
	<Card>
		<CardContent class="pt-6">
			<div class="grid grid-cols-3 gap-4">
				<Button
					variant="outline"
					class="flex h-auto flex-col items-center gap-2 py-4"
					onclick={() => goto('/send')}
				>
					<div class="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
						<ArrowUpRight class="text-primary h-6 w-6" />
					</div>
					<span class="text-sm font-medium">Send</span>
				</Button>

				<Button
					variant="outline"
					class="flex h-auto flex-col items-center gap-2 py-4"
					onclick={() => goto('/receive')}
				>
					<div class="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
						<ArrowDownLeft class="h-6 w-6 text-green-500" />
					</div>
					<span class="text-sm font-medium">Receive</span>
				</Button>

				<Button
					variant="outline"
					class="flex h-auto flex-col items-center gap-2 py-4"
					onclick={refreshData}
					disabled={isRefreshing}
				>
					<div class="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
						<RefreshCw class="h-6 w-6 {isRefreshing ? 'animate-spin' : ''}" />
					</div>
					<span class="text-sm font-medium">Refresh</span>
				</Button>
			</div>
		</CardContent>
	</Card>

	<!-- Jettons -->
	{#if $activeWallet?.jettons && $activeWallet.jettons.length > 0}
		<Card>
			<CardHeader>
				<CardTitle class="text-lg">Jettons</CardTitle>
				<CardDescription>Your token balances</CardDescription>
			</CardHeader>
			<CardContent class="space-y-3">
				{#each $activeWallet.jettons as jetton}
					{#if jetton.balance > 0}
						<div
							class="bg-muted/50 hover:bg-muted flex items-center justify-between rounded-lg p-3 transition-colors"
						>
							<div class="flex items-center gap-3">
								<div class="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
									<span class="text-primary text-sm font-bold">{jetton.symbol[0]}</span>
								</div>
								<div>
									<p class="font-semibold">{jetton.name}</p>
									<p class="text-muted-foreground text-xs">{jetton.symbol}</p>
								</div>
							</div>
							<p class="text-lg font-bold">{formatBalance(jetton.balance)}</p>
						</div>
					{/if}
				{/each}
			</CardContent>
		</Card>
	{/if}

	<Separator />

	<!-- Transactions -->
	<Card>
		<CardHeader>
			<CardTitle class="text-lg">Recent Activity</CardTitle>
		</CardHeader>
		<CardContent>
			<TransactionList
				transactions={$walletStore.transactions}
				currentAddress={$activeWallet?.address || ''}
			/>
		</CardContent>
	</Card>

	<!-- Settings Menu Modal -->
	{#if showMenu}
		<div
			class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
			onclick={() => (showMenu = false)}
		>
			<Card class="w-full max-w-sm" onclick={(e: Event) => e.stopPropagation()}>
				<CardHeader>
					<CardTitle>Menu</CardTitle>
				</CardHeader>
				<CardContent class="space-y-3">
					<Button variant="outline" class="w-full justify-start" onclick={() => goto('/wallets')}>
						<Wallet class="mr-2 h-4 w-4" />
						Manage Wallets
					</Button>
					<Button variant="outline" class="w-full justify-start" onclick={() => goto('/settings')}>
						<Settings class="mr-2 h-4 w-4" />
						Settings
					</Button>
					<Separator />
					<Button variant="destructive" class="w-full" onclick={handleLogout}>
						<LogOut class="mr-2 h-4 w-4" />
						Lock Wallet
					</Button>
				</CardContent>
			</Card>
		</div>
	{/if}
</div>
