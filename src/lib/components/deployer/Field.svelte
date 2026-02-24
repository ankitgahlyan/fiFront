<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		id: string;
		label: string;
		required?: boolean;
		hint?: string;
		error?: string | null;
		children: Snippet;
	}

	let { id, label, required = false, hint = '', error = null, children }: Props = $props();
</script>

<div>
	<label
		for={id}
		class="mb-1.5 block font-mono text-[11px] tracking-[.08em] text-[--color-muted] uppercase"
	>
		{label}
		{#if required}
			<span class="ml-0.5 text-[--color-rose]">*</span>
		{:else}
			<span class="ml-1 font-mono text-[10px] tracking-normal normal-case opacity-50"
				>(optional)</span
			>
		{/if}
	</label>
	{@render children()}
	{#if error}
		<p class="mt-1.5 font-mono text-[11px] text-[--color-rose]">{error}</p>
	{:else if hint}
		<p class="mt-1.5 font-mono text-[10.5px] leading-relaxed text-[--color-muted]">
			{hint}
		</p>
	{/if}
</div>
