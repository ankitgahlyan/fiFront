<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: HTMLAttributes<HTMLDivElement> & {
		ref?: HTMLDivElement | null;
		children?: import('svelte').Snippet;
	} = $props();
</script>

<div
	bind:this={ref}
	data-slot="card-header"
	class={cn('flex flex-col gap-1.5 p-6', className)}
	{...restProps}
>
	{@render children?.()}
</div>
