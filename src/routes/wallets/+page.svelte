<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { walletStore } from '$lib/stores/walletStore';
	import WalletCard from '$lib/components/fiJetton/WalletCard.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
	import { Badge } from '@/components/ui/badge';
	import { ArrowLeft, Plus, Download, Wallet } from '@lucide/svelte';

	let currentPin = '';

	onMount(async () => {
		const pin = prompt('Enter PIN:');
		if (!pin) {
			goto('/dashboard');
			return;
		}
		currentPin = pin;
		await walletStore.loadWallets(pin);
	});

	async function switchWallet(index: number) {
		if (!currentPin) return;
		await walletStore.setActiveWallet(currentPin, index);
		goto('/dashboard');
	}
</script>

<svelte:head>
	<title>Wallets - TON Wallet</title>
</svelte:head>

<div class="container mx-auto max-w-lg px-4 py-8">
	<Button variant="ghost" class="mb-4" onclick={() => goto('/dashboard')}>
		<ArrowLeft class="mr-2 h-4 w-4" />
		Back to Dashboard
	</Button>

	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
						<Wallet class="text-primary h-5 w-5" />
					</div>
					<div>
						<CardTitle>Your Wallets</CardTitle>
						<CardDescription>Manage your TON wallets</CardDescription>
					</div>
				</div>
				<Button size="icon" onclick={() => goto('/wallets/create')}>
					<Plus class="h-4 w-4" />
				</Button>
			</div>
		</CardHeader>
		<CardContent class="space-y-4">
			{#if $walletStore.wallets.length === 0}
				<div class="rounded-xl border-2 border-dashed py-12 text-center">
					<div
						class="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
					>
						<Wallet class="text-muted-foreground h-8 w-8" />
					</div>
					<h3 class="mb-2 font-semibold">No wallets yet</h3>
					<p class="text-muted-foreground mb-4 text-sm">Create your first wallet to get started</p>
					<Button onclick={() => goto('/wallets/create')}>
						<Plus class="mr-2 h-4 w-4" />
						Create Wallet
					</Button>
				</div>
			{:else}
				{#each $walletStore.wallets as wallet, index}
					<button class="w-full text-left" onclick={() => switchWallet(index)}>
						<WalletCard
							{wallet}
							isActive={index === $walletStore.activeWalletIndex}
							isTestnet={$walletStore.isTestnet}
							onClick={() => {}}
						/>
					</button>
				{/each}
			{/if}

			<div class="border-t pt-4">
				<Button variant="outline" class="w-full" onclick={() => goto('/wallets/import')}>
					<Download class="mr-2 h-4 w-4" />
					Import Existing Wallet
				</Button>
			</div>
		</CardContent>
	</Card>
</div>
