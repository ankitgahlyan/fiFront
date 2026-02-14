<script lang="ts">
	import { Card, CardContent } from '@/components/ui/card';
	import { Badge } from '@/components/ui/badge';
	import { Wallet, ChevronRight } from '@lucide/svelte';

	interface Wallet {
		name: string;
		address: string;
		balance: number;
		jettons?: Array<{
			symbol: string;
			name: string;
			balance: number;
		}>;
	}

	interface Props {
		wallet: Wallet;
		isActive?: boolean;
		isTestnet?: boolean;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
		onClick?: Function;
	}

	let { wallet, isActive = false, isTestnet = true, onClick = () => {} }: Props = $props();

	function formatAddress(address: string): string {
		if (!address) return '';
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	}

	function formatBalance(balance: number | undefined): string {
		return balance !== undefined ? balance.toFixed(4) : '0.0000';
	}
</script>

<button onclick={() => onClick()} class="w-full text-left transition-all duration-200">
	<Card
		class="{isActive
			? 'border-primary ring-primary ring-1'
			: ''} hover:border-primary/50 transition-colors"
	>
		<CardContent class="pt-6">
			<div class="mb-4 flex items-start justify-between">
				<div class="flex items-center gap-3">
					<div class="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
						<Wallet class="text-primary h-5 w-5" />
					</div>
					<div>
						<h3 class="font-semibold">{wallet.name}</h3>
						<p class="text-muted-foreground font-mono text-xs">
							{formatAddress(wallet.address)}
						</p>
					</div>
				</div>
				{#if isActive}
					<div class="h-2.5 w-2.5 rounded-full bg-green-500"></div>
				{/if}
			</div>

			<div class="flex items-end justify-between">
				<div>
					<p class="text-2xl font-bold">{formatBalance(wallet.balance)}</p>
					<p class="text-muted-foreground text-sm">TON</p>
				</div>
				<Badge variant="secondary">
					{isTestnet ? 'Testnet' : 'Mainnet'}
				</Badge>
			</div>

			{#if wallet.jettons && wallet.jettons.length > 0}
				<div class="mt-4 border-t pt-4">
					<p class="text-muted-foreground mb-2 text-xs">Jettons</p>
					<div class="space-y-2">
						{#each wallet.jettons.filter((j) => j.balance > 0) as jetton}
							<div class="flex items-center justify-between text-sm">
								<div class="flex items-center gap-2">
									<div
										class="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
									>
										{jetton.symbol[0]}
									</div>
									<span class="text-muted-foreground">{jetton.symbol}</span>
								</div>
								<span class="font-medium">{formatBalance(jetton.balance)}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</CardContent>
	</Card>
</button>
