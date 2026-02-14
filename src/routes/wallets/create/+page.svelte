<script lang="ts">
	import { goto } from '$app/navigation';
	import { walletStore } from '$lib/stores/walletStore';
	import Button from '@/components/ui/button/button.svelte';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
	import { ArrowLeft, Sparkles, AlertTriangle } from '@lucide/svelte';

	let walletName = $state('');
	let isCreating = $state(false);

	async function handleCreate() {
		const pin = prompt('Enter PIN to encrypt wallet:');
		if (!pin) return;

		isCreating = true;
		const result = await walletStore.createWallet(pin, walletName || 'Wallet');

		if (result.success) {
			alert('Wallet created successfully! Please save your recovery phrase.');
			goto('/dashboard');
		} else {
			alert(result.error || 'Failed to create wallet');
		}
		isCreating = false;
	}
</script>

<svelte:head>
	<title>Create Wallet - TON Wallet</title>
</svelte:head>

<div class="container mx-auto max-w-lg px-4 py-8">
	<Button variant="ghost" class="mb-4" onclick={() => goto('/wallets')}>
		<ArrowLeft class="mr-2 h-4 w-4" />
		Back to Wallets
	</Button>

	<Card>
		<CardHeader>
			<div class="flex items-center gap-3">
				<div class="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
					<Sparkles class="text-primary h-5 w-5" />
				</div>
				<div>
					<CardTitle>Create New Wallet</CardTitle>
					<CardDescription>Generate a new secure wallet</CardDescription>
				</div>
			</div>
		</CardHeader>
		<CardContent class="space-y-6">
			<div class="py-6 text-center">
				<div
					class="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full"
				>
					<Sparkles class="text-primary h-10 w-10" />
				</div>
				<p class="text-muted-foreground">
					A new wallet will be generated with a unique recovery phrase
				</p>
			</div>

			<div class="space-y-2">
				<Label for="walletName">Wallet Name (Optional)</Label>
				<Input id="walletName" type="text" bind:value={walletName} placeholder="My TON Wallet" />
			</div>

			<!-- Warning -->
			<div class="flex gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
				<AlertTriangle class="h-5 w-5 flex-shrink-0 text-yellow-600" />
				<div class="space-y-1">
					<p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
						Important Security Notes
					</p>
					<ul class="list-inside list-disc space-y-1 text-xs text-yellow-700 dark:text-yellow-300">
						<li>Write down your recovery phrase</li>
						<li>Keep it safe and private</li>
						<li>Never share it with anyone</li>
						<li>You'll need it to restore your wallet</li>
					</ul>
				</div>
			</div>

			<Button class="w-full" size="lg" onclick={handleCreate} disabled={isCreating}>
				{#if isCreating}
					<div
						class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
					></div>
					Creating...
				{:else}
					<Sparkles class="mr-2 h-4 w-4" />
					Create Wallet
				{/if}
			</Button>
		</CardContent>
	</Card>
</div>
