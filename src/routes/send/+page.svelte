<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Button from '@/components/ui/button/button.svelte';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
	import { Badge } from '@/components/ui/badge';
	import { ArrowLeft, Send, AlertCircle } from '@lucide/svelte';

	let recipient = $state('');
	let amount = $state('');
	let selectedAsset = $state('TON');
	let isSending = $state(false);
	let error = $state('');

	// let availableAssets = $derived([
	// 	{ symbol: 'TON', balance: $userAddress?.balance || 0 },
	// 	...($userAddress?.jettons?.filter((j) => (j.balance || 0) > 0) || [])
	// ]);

	// onMount(() => {
	// 	if (!$userAddress) {
	// 		goto('/dashboard');
	// 	}
	// });

	async function handleSend() {
		// error = '';

		// if (!recipient || !amount) {
		// 	error = 'Please fill in all fields';
		// 	return;
		// }

		// const amountNum = parseFloat(amount);
		// if (isNaN(amountNum) || amountNum <= 0) {
		// 	error = 'Invalid amount';
		// 	return;
		// }

		// const asset = availableAssets.find((a) => a.symbol === selectedAsset);
		// if (!asset || amountNum > (asset.balance || 0)) {
		// 	error = 'Insufficient balance';
		// 	return;
		// }

		isSending = true;

		try {
			const pin = prompt('Enter PIN to confirm transaction:');
			if (!pin) {
				isSending = false;
				return;
			}

			// Placeholder for actual send functionality
			// This would call the actual sendTon or sendJetton function
			await new Promise((resolve) => setTimeout(resolve, 2000));

			alert('Transaction sent suckcexfully he he he!');
			goto('/');
		} catch (err: any) {
			error = err.message || 'Transaction failed';
		} finally {
			isSending = false;
		}
	}
</script>

<svelte:head>
	<title>Send - TON Wallet</title>
</svelte:head>

<div class="container mx-auto max-w-lg px-4 py-8">
	<Button variant="ghost" class="mb-4" onclick={() => goto('/')}>
		<ArrowLeft class="mr-2 h-4 w-4" />
		Back to Dashboard
	</Button>

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
			<div class="space-y-2">
				<Label>Asset</Label>
				<div class="flex flex-wrap gap-2">
					<!-- {#each availableAssets as asset}
						<button
							class="rounded-full border px-4 py-2 transition-all {selectedAsset === asset.symbol
								? 'bg-primary text-primary-foreground border-primary'
								: 'bg-background hover:bg-muted'}"
							onclick={() => (selectedAsset = asset.symbol)}
						>
							{asset.symbol}
							<Badge variant="secondary" class="ml-2">{(asset.balance || 0).toFixed(4)}</Badge>
						</button>
					{/each} -->
				</div>
			</div>

			<!-- Recipient -->
			<div class="space-y-2">
				<Label for="recipient">Recipient Address</Label>
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
						step="0.001"
						min="0"
					/>
					<span class="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-sm">
						{selectedAsset}
					</span>
				</div>
			</div>

			<!-- Error -->
			{#if error}
				<div
					class="bg-destructive/10 border-destructive/20 text-destructive flex items-center gap-2 rounded-lg border p-3"
				>
					<AlertCircle class="h-4 w-4 flex-shrink-0" />
					<p class="text-sm">{error}</p>
				</div>
			{/if}

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
</div>
