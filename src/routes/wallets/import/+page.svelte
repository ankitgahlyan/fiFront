<script lang="ts">
	import { goto } from '$app/navigation';
	import { walletStore } from '$lib/stores/walletStore';
	import Button from '@/components/ui/button/button.svelte';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import { Textarea } from '@/components/ui/textarea';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
	import { ArrowLeft, Download, ShieldAlert } from '@lucide/svelte';

	let mnemonic = $state('');
	let walletName = $state('');
	let isImporting = $state(false);

	async function handleImport() {
		if (!mnemonic.trim()) {
			alert('Please enter a recovery phrase');
			return;
		}

		const pin = prompt('Enter PIN to encrypt wallet:');
		if (!pin) return;

		isImporting = true;
		const result = await walletStore.importWallet(
			pin,
			mnemonic.trim(),
			walletName || 'Imported Wallet'
		);

		if (result.success) {
			alert('Wallet imported successfully!');
			goto('/dashboard');
		} else {
			alert(result.error || 'Failed to import wallet');
		}
		isImporting = false;
	}
</script>

<svelte:head>
	<title>Import Wallet - TON Wallet</title>
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
					<Download class="text-primary h-5 w-5" />
				</div>
				<div>
					<CardTitle>Import Wallet</CardTitle>
					<CardDescription>Restore an existing wallet</CardDescription>
				</div>
			</div>
		</CardHeader>
		<CardContent class="space-y-6">
			<div class="py-6 text-center">
				<div
					class="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full"
				>
					<Download class="text-primary h-10 w-10" />
				</div>
				<p class="text-muted-foreground">
					Enter your 24-word recovery phrase to restore your wallet
				</p>
			</div>

			<div class="space-y-2">
				<Label for="mnemonic">Recovery Phrase</Label>
				<Textarea
					id="mnemonic"
					bind:value={mnemonic}
					placeholder="word1 word2 word3 ..."
					rows={4}
					class="font-mono text-sm"
				/>
				<p class="text-muted-foreground text-xs">Enter 12 or 24 words separated by spaces</p>
			</div>

			<div class="space-y-2">
				<Label for="walletName">Wallet Name (Optional)</Label>
				<Input
					id="walletName"
					type="text"
					bind:value={walletName}
					placeholder="My Imported Wallet"
				/>
			</div>

			<!-- Security Warning -->
			<div class="flex gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
				<ShieldAlert class="h-5 w-5 flex-shrink-0 text-red-600" />
				<div>
					<p class="text-sm font-medium text-red-800 dark:text-red-200">Security Warning</p>
					<p class="mt-1 text-xs text-red-700 dark:text-red-300">
						Never share your recovery phrase. Anyone with access to it can control your wallet and
						funds.
					</p>
				</div>
			</div>

			<Button
				class="w-full"
				size="lg"
				onclick={handleImport}
				disabled={isImporting || !mnemonic.trim()}
			>
				{#if isImporting}
					<div
						class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
					></div>
					Importing...
				{:else}
					<Download class="mr-2 h-4 w-4" />
					Import Wallet
				{/if}
			</Button>
		</CardContent>
	</Card>
</div>
