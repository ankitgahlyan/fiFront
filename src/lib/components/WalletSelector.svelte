<script lang="ts">
	import {
		connectedWallets,
		activeWalletIndex,
		switchConnectedWallet,
		disconnectWallet
	} from '$lib/stores/tonconnect';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
	import Button from '@/components/ui/button/button.svelte';
	import { Badge } from '@/components/ui/badge';
	import { Separator } from '@/components/ui/separator';
	import { Wallet, LogOut, Check } from '@lucide/svelte';
	import { Address } from '@ton/core';

	function truncateAddress(address: string): string {
		return `${address.slice(0, 6)}...${address.slice(-6)}`;
	}

	function getWalletIcon(name?: string | null): string {
		if (!name) return '👛';
		if (name.toLowerCase().includes('ton')) return '🐋';
		if (name.toLowerCase().includes('tangem')) return '🇨🇭';
		if (name.toLowerCase().includes('ledger')) return '🔐';
		return '👛';
	}

	async function handleDisconnect(address: string) {
		await disconnectWallet(address);
	}
</script>

{#if $connectedWallets.length > 0}
	<Card>
		<CardHeader>
			<div class="flex items-center gap-3">
				<div class="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
					<Wallet class="text-primary h-5 w-5" />
				</div>
				<div>
					<CardTitle>Connected Wallets</CardTitle>
					<CardDescription>
						{$connectedWallets.length} wallet{$connectedWallets.length !== 1 ? 's' : ''} connected
					</CardDescription>
				</div>
			</div>
		</CardHeader>
		<CardContent class="space-y-2">
			{#each $connectedWallets as walletInfo, index}
				<div
					class="group hover:bg-muted/50 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-all"
					class:bg-primary={index === $activeWalletIndex}
					class:border-primary={index === $activeWalletIndex}
				>
					<button
						class="flex-1 text-left"
						onclick={() => switchConnectedWallet(index)}
						title="Switch to this wallet"
					>
						<div class="flex items-center gap-3">
							<span class="text-xl">{getWalletIcon()}</span>
							<div class="min-w-0 flex-1">
								<!-- <p class="text-sm font-medium truncate">
									{walletInfo.account.address || 'Unknown Wallet'}
								</p> -->
								<p class="text-muted-foreground font-mono text-xs">
									{truncateAddress(
										Address.parse(walletInfo.account.address).toString({
											testOnly: true,
											bounceable: false
										})
									) || ''}
								</p>
							</div>
						</div>
					</button>

					<div class="flex items-center gap-2">
						{#if index === $activeWalletIndex}
							<Badge variant="outline" class="whitespace-nowrap">
								<Check class="mr-1 h-3 w-3" />
								Active
							</Badge>
						{/if}
						<Button
							variant="ghost"
							size="sm"
							onclick={() => handleDisconnect(walletInfo.account?.address || '')}
							class="h-auto p-1 opacity-0 transition-opacity group-hover:opacity-100"
							title="Disconnect wallet"
						>
							<LogOut class="h-4 w-4" />
						</Button>
					</div>
				</div>
			{/each}
		</CardContent>
	</Card>
{/if}
