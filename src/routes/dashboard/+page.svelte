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
	import {
		Wallet,
		ArrowUpRight,
		ArrowDownLeft,
		RefreshCw,
		Settings,
		LogOut,
		Wifi,
		WifiOff
	} from '@lucide/svelte';

	let currentPin = '';
	let isRefreshing = $state(false);
	let showMenu = $state(false);
	let isOnline = $state(true);
	let lastUpdated = $state<number | undefined>(undefined);

	onMount(async () => {
		if (!$authStore.isUnlocked) {
			goto('/');
			return;
		}

		isOnline = navigator.onLine;
		window.addEventListener('online', () => (isOnline = true));
		window.addEventListener('offline', () => (isOnline = false));

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
			await walletStore.loadCachedData();
			const wallet = $activeWallet;
			if (wallet?.lastUpdated) {
				lastUpdated = wallet.lastUpdated;
			}
		}
	});

	async function refreshData() {
		if (!currentPin || isRefreshing) return;
		isRefreshing = true;
		await walletStore.refreshBalances(currentPin, false);
		const wallet = $activeWallet;
		if (wallet?.lastUpdated) {
			lastUpdated = wallet.lastUpdated;
		}
		isRefreshing = false;
	}

	function handleLogout() {
		authStore.lock();
		goto('/');
	}

	function formatBalance(balance: number | undefined): string {
		return balance !== undefined ? balance.toFixed(4) : '0.0000';
	}

	function formatLastUpdated(timestamp: number | undefined): string {
		if (!timestamp) return 'Never';
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `${diffHours}h ago`;
		return date.toLocaleDateString();
	}
</script>

<svelte:head>
	<title>Dashboard - TON Wallet</title>
</svelte:head>

<div class="container mx-auto space-y-6 px-3 py-6 sm:px-4 sm:py-8">
	<!-- Online/Offline Status & Last Updated -->
	<div class="flex items-center justify-between px-2">
		<div class="flex items-center gap-2">
			{#if isOnline}
				<Wifi class="h-4 w-4 text-green-500" />
				<span class="text-xs text-green-500">Online</span>
			{:else}
				<WifiOff class="h-4 w-4 text-yellow-500" />
				<span class="text-xs text-yellow-500">Offline</span>
			{/if}
		</div>
		<span class="text-muted-foreground text-xs">Updated: {formatLastUpdated(lastUpdated)}</span>
	</div>

	<!-- Header Card -->
	<Card class="from-primary/10 via-primary/5 to-background border-primary/20 bg-linear-to-br">
		<CardContent class="p-4 sm:pt-6">
			<div class="mb-4 flex items-center justify-between sm:mb-6">
				<div class="flex items-center gap-3">
					<div
						class="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12"
					>
						<Wallet class="text-primary h-5 w-5 sm:h-6 sm:w-6" />
					</div>
					<div>
						<h1 class="text-xl font-bold sm:text-2xl">TON Wallet</h1>
						{#if $activeWallet}
							<p class="text-muted-foreground text-xs sm:text-sm">{$activeWallet.name}</p>
						{/if}
					</div>
				</div>
				<Button variant="ghost" size="icon" onclick={() => (showMenu = !showMenu)}>
					<Settings class="h-5 w-5" />
				</Button>
			</div>

			{#if $activeWallet}
				<div class="py-2 text-center sm:py-4">
					<p class="mb-2 text-4xl font-bold sm:text-5xl">{formatBalance($activeWallet.balance)}</p>
					<div class="flex flex-wrap items-center justify-center gap-2">
						<Badge variant="secondary">TON</Badge>
						<Badge variant="outline">{$walletStore.isTestnet ? 'Testnet' : 'Mainnet'}</Badge>
					</div>
					<p class="text-muted-foreground mx-auto mt-3 max-w-[280px] truncate font-mono text-xs">
						{$activeWallet.address.slice(0, 8)}...{$activeWallet.address.slice(-6)}
					</p>
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Quick Actions -->
	<Card>
		<CardContent class="p-4 sm:pt-6">
			<div class="grid grid-cols-3 gap-3 sm:gap-4">
				<Button
					variant="outline"
					class="flex h-auto flex-col items-center gap-2 py-3 sm:py-4"
					onclick={() => goto('/send')}
				>
					<div
						class="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12"
					>
						<ArrowUpRight class="text-primary h-5 w-5 sm:h-6 sm:w-6" />
					</div>
					<span class="text-xs font-medium sm:text-sm">Send</span>
				</Button>

				<Button
					variant="outline"
					class="flex h-auto flex-col items-center gap-2 py-3 sm:py-4"
					onclick={() => goto('/receive')}
				>
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 sm:h-12 sm:w-12"
					>
						<ArrowDownLeft class="h-5 w-5 text-green-500 sm:h-6 sm:w-6" />
					</div>
					<span class="text-xs font-medium sm:text-sm">Receive</span>
				</Button>

				<Button
					variant="outline"
					class="flex h-auto flex-col items-center gap-2 py-3 sm:py-4"
					onclick={refreshData}
					disabled={isRefreshing}
				>
					<div
						class="bg-muted flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12"
					>
						<RefreshCw class="h-5 w-5 sm:h-6 sm:w-6 {isRefreshing ? 'animate-spin' : ''}" />
					</div>
					<span class="text-xs font-medium sm:text-sm">Refresh</span>
				</Button>
			</div>
		</CardContent>
	</Card>

	<!-- Jettons -->
	{#if $activeWallet?.jettons && $activeWallet.jettons.length > 0}
		<Card>
			<CardHeader class="p-4 sm:p-6">
				<CardTitle class="text-base sm:text-lg">Jettons</CardTitle>
				<CardDescription class="text-xs sm:text-sm">Your token balances</CardDescription>
			</CardHeader>
			<CardContent class="space-y-2 p-4 pt-0 sm:space-y-3 sm:p-6">
				{#each $activeWallet.jettons as jetton}
					{#if jetton.balance > 0}
						<div
							class="bg-muted/50 hover:bg-muted flex items-center justify-between rounded-lg p-2 transition-colors sm:p-3"
						>
							<div class="flex items-center gap-2 sm:gap-3">
								<div
									class="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full sm:h-10 sm:w-10"
								>
									<span class="text-primary text-xs font-bold sm:text-sm">{jetton.symbol[0]}</span>
								</div>
								<div>
									<p class="text-sm font-semibold sm:text-base">{jetton.name}</p>
									<p class="text-muted-foreground text-xs">{jetton.symbol}</p>
								</div>
							</div>
							<p class="text-base font-bold sm:text-lg">{formatBalance(jetton.balance)}</p>
						</div>
					{/if}
				{/each}
			</CardContent>
		</Card>
	{/if}

	<Separator />

	<!-- Transactions -->
	<Card>
		<CardHeader class="p-4 sm:p-6">
			<CardTitle class="text-base sm:text-lg">Recent Activity</CardTitle>
		</CardHeader>
		<CardContent class="p-4 pt-0 sm:p-6">
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
