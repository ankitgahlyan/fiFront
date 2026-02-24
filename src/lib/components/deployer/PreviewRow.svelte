<script lang="ts">
	interface Props {
		key: string;
		value: string;
		mono?: boolean;
	}

	let { key, value, mono = false }: Props = $props();
</script>

<div class="flex items-start justify-between gap-3">
	<span class="shrink-0 font-mono text-[11px] text-[--color-muted]">{key}</span>
	<span
		class="max-w-[300px] text-right font-mono text-[11px] break-all text-[--color-heading]"
		class:font-mono={mono}>{value}</span
	>
</div>
