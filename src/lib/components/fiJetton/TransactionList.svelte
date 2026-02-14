<script lang="ts">
	import { Card, CardContent } from '@/components/ui/card';
	import { Badge } from '@/components/ui/badge';
	import { ArrowDownLeft, ArrowUpRight, Inbox } from '@lucide/svelte';

	interface Transaction {
		from: string;
		to: string;
		value: number;
		time: number;
	}

	interface Props {
		transactions: Transaction[];
		currentAddress: string;
	}

	let { transactions = [], currentAddress = '' }: Props = $props();

	function formatAddress(address: string): string {
		if (!address) return 'Unknown';
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	}

	function formatDate(timestamp: number): string {
		const date = new Date(timestamp * 1000);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatAmount(value: number | undefined): string {
		return value !== undefined ? value.toFixed(4) : '0.0000';
	}

	function isReceived(tx: Transaction): boolean {
		return tx.to.toLowerCase() === currentAddress.toLowerCase();
	}
</script>

<div class="space-y-3">
	{#if transactions.length === 0}
		<Card class="border-dashed">
			<CardContent class="flex flex-col items-center justify-center py-12 text-center">
				<div class="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
					<Inbox class="text-muted-foreground h-8 w-8" />
				</div>
				<h3 class="mb-1 font-semibold">No transactions yet</h3>
				<p class="text-muted-foreground text-sm">Your transaction history will appear here</p>
			</CardContent>
		</Card>
	{:else}
		{#each transactions as tx}
			<Card class="hover:border-primary/30 transition-colors">
				<CardContent class="py-4">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-full {isReceived(tx)
									? 'bg-green-500/10'
									: 'bg-red-500/10'}"
							>
								{#if isReceived(tx)}
									<ArrowDownLeft class="h-5 w-5 text-green-600" />
								{:else}
									<ArrowUpRight class="h-5 w-5 text-red-600" />
								{/if}
							</div>
							<div>
								<p class="font-medium">{isReceived(tx) ? 'Received' : 'Sent'}</p>
								<p class="text-muted-foreground font-mono text-xs">
									{isReceived(tx) ? `From ${formatAddress(tx.from)}` : `To ${formatAddress(tx.to)}`}
								</p>
							</div>
						</div>
						<div class="text-right">
							<p class="font-bold {isReceived(tx) ? 'text-green-600' : 'text-red-600'}">
								{isReceived(tx) ? '+' : '-'}{formatAmount(tx.value)} TON
							</p>
							<p class="text-muted-foreground text-xs">
								{formatDate(tx.time)}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		{/each}
	{/if}
</div>
