<script lang="ts">
	import { sendTransfer } from '$lib/stores/fi';
	import { userAddress } from '$lib/stores/tonconnect';
	import Button from '@/components/ui/button/button.svelte';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import { Card, CardContent } from '@/components/ui/card';
	import { Send, AlertCircle } from '@lucide/svelte';
	import { Address, toNano } from '@ton/core';
	
	let recipient = $state('');
	let amount = $state('');
	let isSending = $state(false);
	let error = $state('');

	async function handleSend() {
		const amountNum = toNano(amount);
		isSending = true;
		error = '';

		try {
			await sendTransfer(Address.parse(recipient), amountNum);
			recipient = '';
			amount = '';
		} catch (err: any) {
			error = err.message || 'Transaction failed';
		} finally {
			isSending = false;
		}
	}
</script>

<div class="space-y-4">
	<!-- Recipient -->
	<div class="space-y-2">
		<Label for="transfer-recipient">Recipient Address</Label>
		<Input
			id="transfer-recipient"
			type="text"
			bind:value={recipient}
			placeholder="0Q..."
			class="font-mono"
		/>
	</div>

	<!-- Amount -->
	<div class="space-y-2">
		<Label for="transfer-amount">Amount</Label>
		<div class="relative">
			<Input
				id="transfer-amount"
				type="number"
				bind:value={amount}
				placeholder="0.0"
				step="1"
				min="0"
			/>
			<span
				class="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-sm font-medium"
			>
				MINT
			</span>
		</div>
	</div>

	<!-- Error -->
	{#if error}
		<div
			class="bg-destructive/10 border-destructive/20 text-destructive flex items-center gap-2 rounded-lg border p-3"
		>
			<AlertCircle class="h-4 w-4 shrink-0" />
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
			Send MINT
		{/if}
	</Button>
</div>
