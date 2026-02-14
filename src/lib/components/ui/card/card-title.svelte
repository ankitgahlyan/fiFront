<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: HTMLAttributes<HTMLDivElement> & {
		ref?: HTMLHeadingElement | null;
		children?: import('svelte').Snippet;
	} = $props();
</script>

<h3
	bind:this={ref}
	data-slot="card-title"
	class={cn('leading-none font-semibold tracking-tight', className)}
	{...restProps}
>
	{@render children?.()}
</h3>
