<script lang="ts">
	import { goto } from "$app/navigation";
	import { Button } from "@/components/ui/button";
	import { ArrowLeft } from "@lucide/svelte";

	// let availableAssets = $derived([
	// 	{ symbol: 'TON', balance: $userAddress?.balance || 0 },
	// 	...($userAddress?.jettons?.filter((j) => (j.balance || 0) > 0) || [])
	// ]);

	// onMount(() => {
	// 	if (!$userAddress) {
	// 		goto('/');
	// 	}

	// 	return () => {
	// 		stopQRScanner();
	// 	};
	// });

	// async function handleSend() {
	// 	// error = '';

	// 	// if (!recipient || !amount) {
	// 	// 	error = 'Please fill in all fields';
	// 	// 	return;
	// 	// }

	// 	// const amountNum = parseFloat(amount);
	// 	// if (isNaN(amountNum) || amountNum <= 0) {
	// 	// 	error = 'Invalid amount';
	// 	// 	return;
	// 	// }

	// 	// const asset = availableAssets.find((a) => a.symbol === selectedAsset);
	// 	// if (!asset || amountNum > (asset.balance || 0)) {
	// 	// 	error = 'Insufficient balance';
	// 	// 	return;
	// 	// }

	// 	isSending = true;

	// 	try {
	// 		const pin = prompt('Enter PIN to confirm transaction:');
	// 		if (!pin) {
	// 			isSending = false;
	// 			return;
	// 		}

	// 		// Placeholder for actual send functionality
	// 		// This would call the actual sendTon or sendJetton function
	// 		await new Promise((resolve) => setTimeout(resolve, 2000));

	// 		alert('Transaction sent suckcexfully he he he!');
	// 		goto('/');
	// 	} catch (err: any) {
	// 		error = err.message || 'Transaction failed';
	// 	} finally {
	// 		isSending = false;
	// 	}
	// }
</script>

<svelte:head>
	<title>ui testing page</title>
</svelte:head>

<div class="container mx-auto max-w-lg px-4 py-8">
	<!-- Error -->
	<!-- {#if error}
		<div
			class="bg-destructive/10 border-destructive/20 text-destructive flex items-center gap-2 rounded-lg border p-3"
		>
			<AlertCircle class="h-4 w-4 shrink-0" />
			<p class="text-sm">{error}</p>
		</div>
		<Separator />
	{/if} -->

	<Button variant="ghost" class="mb-4" onclick={() => goto('/')}>
		<ArrowLeft class="mr-2 h-4 w-4" />
		Back to Dashboard
	</Button>

	
</div>
