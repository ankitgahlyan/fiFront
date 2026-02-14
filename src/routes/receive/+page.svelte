<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	// import { activeWallet } from '$lib/stores/walletStore';
	import Button from '@/components/ui/button/button.svelte';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
	import { Badge } from '@/components/ui/badge';
	import { ArrowLeft, Copy, Check, Wallet, AlertTriangle, AlertTriangleIcon, AlertOctagon, AlertCircle } from '@lucide/svelte';
	import Label from '@/components/ui/label/label.svelte';
	import { userAddress } from '@/stores/tonconnect';

	let copied = $state(false);

	onMount(() => {
		// if (!$activeWallet) {
		// 	goto('/dashboard');
		// }
	});

	function copyAddress() {
			navigator.clipboard.writeText($userAddress!.toString());
			copied = true;
			setTimeout(() => (copied = false), 2000);
	}

	function generateQR(address: string): string {
		return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(address)}`;
	}
</script>

<svelte:head>
	<title>Receive - TON Wallet</title>
</svelte:head>

<div class="container mx-auto max-w-lg px-4 py-8">
	<Button variant="ghost" class="mb-4" onclick={() => goto('/')}>
		<ArrowLeft class="mr-2 h-4 w-4" />
		Back to Dashboard
	</Button>

	{#if $userAddress}
		<Card>
			<CardHeader>
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
						<Wallet class="h-5 w-5 text-green-500" />
					</div>
					<div>
						<CardTitle>Receive Funds</CardTitle>
						<CardDescription>Share your address to receive TON</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent class="space-y-6">
				<!-- QR Code -->
				<div class="flex flex-col items-center">
					<div class="border-border rounded-xl border-2 bg-white p-4">
						<img src={generateQR($userAddress.toString())} alt="QR Code" class="h-48 w-48" />
					</div>
					<p class="text-muted-foreground mt-4 text-center text-sm">
						gimme gimme fundssshhh...
					</p>
				</div>

				<!-- Address -->
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<Label class="text-sm font-medium">Your Address</Label>
						<Badge variant="outline" class="font-mono text-xs">
							{$userAddress.toString().slice(0, 6)}...{$userAddress.toString().slice(-4)}
						</Badge>
					</div>
					<div class="relative">
						<div class="bg-muted rounded-lg border p-4 font-mono text-sm break-all">
							{$userAddress}
						</div>
					</div>
				</div>

				<!-- Copy Button -->
				<Button class="w-full" variant={copied ? 'secondary' : 'default'} onclick={copyAddress}>
					{#if copied}
						<Check class="mr-2 h-4 w-4" />
						Copied!
					{:else}
						<Copy class="mr-2 h-4 w-4" />
						Copy Address
					{/if}
				</Button>

				<!-- Warning -->
				<div class="flex gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
					<AlertCircle class="h-5 w-5 flex-shrink-0 text-yellow-600" />
					<div>
						<p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">Important</p>
						<p class="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
							Only send TON blockchain assets to this address. Sending assets from other blockchains
							may result in permanent loss.
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
