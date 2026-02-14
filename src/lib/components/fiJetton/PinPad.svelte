<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
	import Button from '@/components/ui/button/button.svelte';
	import { Delete, X } from '@lucide/svelte';

	interface Props {
		onComplete?: (pin: string) => void;
		title?: string;
		maxLength?: number;
	}

	let { onComplete = () => {}, title = 'Enter PIN', maxLength = 6 }: Props = $props();
	let pin = $state('');
	let error = $state('');

	function handleNumber(num: string) {
		if (pin.length < maxLength) {
			pin += num;
			error = '';

			if (pin.length === maxLength) {
				setTimeout(() => onComplete(pin), 100);
			}
		}
	}

	function handleBackspace() {
		pin = pin.slice(0, -1);
		error = '';
	}

	function handleClear() {
		pin = '';
		error = '';
	}

	export function setError(msg: string) {
		error = msg;
		pin = '';
	}

	export function reset() {
		pin = '';
		error = '';
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center p-6">
	<Card class="w-full max-w-sm">
		<CardHeader class="text-center">
			<CardTitle>{title}</CardTitle>
			{#if error}
				<p class="text-destructive mt-2 text-sm">{error}</p>
			{/if}
		</CardHeader>
		<CardContent class="space-y-8">
			<!-- PIN dots -->
			<div class="flex justify-center gap-3">
				{#each Array(maxLength) as _, i}
					<div
						class="border-primary h-4 w-4 rounded-full border-2 transition-all duration-200 {pin.length >
						i
							? 'bg-primary'
							: 'bg-transparent'}"
					></div>
				{/each}
			</div>

			<!-- Number pad -->
			<div class="grid grid-cols-3 gap-3">
				{#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as num}
					<Button
						variant="outline"
						size="lg"
						class="aspect-square text-2xl font-semibold"
						onclick={() => handleNumber(num.toString())}
					>
						{num}
					</Button>
				{/each}
			</div>

			<div class="grid grid-cols-3 gap-3">
				<Button variant="ghost" size="lg" class="aspect-square" onclick={handleClear}>
					<X class="h-5 w-5" />
				</Button>
				<Button
					variant="outline"
					size="lg"
					class="aspect-square text-2xl font-semibold"
					onclick={() => handleNumber('0')}
				>
					0
				</Button>
				<Button variant="ghost" size="lg" class="aspect-square" onclick={handleBackspace}>
					<Delete class="h-5 w-5" />
				</Button>
			</div>
		</CardContent>
	</Card>
</div>
