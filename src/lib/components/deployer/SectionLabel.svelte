<script lang="ts">
	interface Props {
		num: string;
		title: string;
	}

	let { num, title }: Props = $props();
</script>

<div class="mb-3 flex items-center gap-3">
	<span
		class="flex h-6 w-6 items-center justify-center rounded-md border border-[rgba(14,165,233,.25)] bg-[rgba(14,165,233,.08)] font-mono text-[10px] font-bold text-[--color-accent]"
	>
		{num}
	</span>
	<span
		class="font-sans text-[11px] font-semibold tracking-[.1em] text-[--color-heading] uppercase"
	>
		{title}
	</span>
	<div class="h-px flex-1 bg-[--color-border]"></div>
</div>
