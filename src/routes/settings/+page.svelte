<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import { walletStore } from '$lib/stores/walletStore';
	import Button from '@/components/ui/button/button.svelte';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
	import { Badge } from '@/components/ui/badge';
	import { Separator } from '@/components/ui/separator';
	import { ArrowLeft, Fingerprint, Globe, Info, Trash2, Check, Wallet } from '@lucide/svelte';

	let biometricAvailable = $state(false);
	let currentPin = '';

	onMount(async () => {
		const pin = prompt('Enter PIN to access settings:');
		if (!pin) {
			goto('/dashboard');
			return;
		}
		currentPin = pin;

		// Check if biometric is available
		if ('credentials' in navigator && 'PublicKeyCredential' in window) {
			biometricAvailable = true;
		}
	});

	async function handleBiometricLink() {
		try {
			alert('Biometric authentication linked successfully!');
		} catch (error: any) {
			alert('Failed to register biometric: ' + error.message);
		}
	}

	async function handleNetworkToggle() {
		if (!currentPin) return;

		if (confirm('Switch network? This will reload your wallet data.')) {
			await walletStore.toggleNetwork(currentPin);
			goto('/dashboard');
		}
	}

	async function handleReset() {
		if (confirm('Are you sure? This will delete all wallet data permanently!')) {
			if (confirm('Last chance! This action cannot be undone.')) {
				await authStore.reset();
				goto('/');
			}
		}
	}
</script>

<svelte:head>
	<title>Settings - TON Wallet</title>
</svelte:head>

<div class="container mx-auto max-w-lg px-4 py-8">
	<Button variant="ghost" class="mb-4" onclick={() => goto('/dashboard')}>
		<ArrowLeft class="mr-2 h-4 w-4" />
		Back to Dashboard
	</Button>

	<Card>
		<CardHeader>
			<div class="flex items-center gap-3">
				<div class="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="text-primary"
						><path
							d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
						/><circle cx="12" cy="12" r="3" /></svg
					>
				</div>
				<div>
					<CardTitle>Settings</CardTitle>
					<CardDescription>Manage your wallet preferences</CardDescription>
				</div>
			</div>
		</CardHeader>
		<CardContent class="space-y-6">
			<!-- Security Section -->
			<div class="space-y-3">
				<h3 class="text-muted-foreground text-sm font-medium tracking-wider uppercase">Security</h3>

				{#if biometricAvailable && !$authStore.hasBiometric}
					<button
						class="hover:bg-muted flex w-full items-center justify-between rounded-lg border p-4 transition-colors"
						onclick={handleBiometricLink}
					>
						<div class="flex items-center gap-3">
							<Fingerprint class="text-primary h-5 w-5" />
							<span class="font-medium">Link Biometric Authentication</span>
						</div>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg
						>
					</button>
				{:else if $authStore.hasBiometric}
					<div
						class="flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/10 p-4"
					>
						<div class="flex items-center gap-3">
							<Fingerprint class="h-5 w-5 text-green-600" />
							<span class="font-medium">Biometric Enabled</span>
						</div>
						<Check class="h-5 w-5 text-green-600" />
					</div>
				{/if}
			</div>

			<Separator />

			<!-- Network Section -->
			<div class="space-y-3">
				<h3 class="text-muted-foreground text-sm font-medium tracking-wider uppercase">Network</h3>

				<button
					class="hover:bg-muted flex w-full items-center justify-between rounded-lg border p-4 transition-colors"
					onclick={handleNetworkToggle}
				>
					<div class="flex items-center gap-3">
						<Globe class="text-primary h-5 w-5" />
						<div class="text-left">
							<p class="font-medium">Current Network</p>
							<p class="text-muted-foreground text-sm">
								{$walletStore.isTestnet ? 'Testnet' : 'Mainnet'}
							</p>
						</div>
					</div>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path
							d="M21 3v5h-5"
						/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path
							d="M3 21v-5h5"
						/></svg
					>
				</button>
			</div>

			<Separator />

			<!-- About Section -->
			<div class="space-y-3">
				<h3 class="text-muted-foreground text-sm font-medium tracking-wider uppercase">About</h3>

				<div class="space-y-3 rounded-lg border p-4">
					<div class="flex items-center gap-3">
						<Info class="text-primary h-5 w-5" />
						<span class="font-medium">App Information</span>
					</div>
					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span class="text-muted-foreground">Version</span>
							<span class="font-medium">1.0.0</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Build</span>
							<span class="font-mono">2025.02.12</span>
						</div>
					</div>
				</div>
			</div>

			<Separator />

			<!-- Danger Zone -->
			<div class="space-y-3">
				<h3 class="text-sm font-medium tracking-wider text-red-600 uppercase">Danger Zone</h3>

				<div class="space-y-3 rounded-lg border border-red-500/20 p-4">
					<div class="flex items-center gap-3">
						<Trash2 class="h-5 w-5 text-red-600" />
						<span class="font-medium text-red-600">Reset & Delete All Data</span>
					</div>
					<p class="text-muted-foreground text-sm">
						This will permanently delete all wallets and settings. Make sure you have backed up your
						recovery phrases!
					</p>
					<Button variant="destructive" class="w-full" onclick={handleReset}>
						<Trash2 class="mr-2 h-4 w-4" />
						Reset Everything
					</Button>
				</div>
			</div>
		</CardContent>
	</Card>
</div>
