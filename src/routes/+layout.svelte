<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	let { children } = $props();

	import { onMount, onDestroy } from 'svelte';
	import { initTonConnect, isConnected, wallet } from '$lib/stores/tonconnect';
	import '../app.css';
	import Button from '@/components/ui/button/button.svelte';
	import { goto } from '$app/navigation';
	import { Moon, Sun, LayoutGrid, House } from '@lucide/svelte';

	let isDark = $state(false);

	onMount(async () => {
		initTonConnect();

		// Check system preference for dark mode
		if (typeof window !== 'undefined') {
			isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			if (isDark) {
				document.documentElement.classList.add('dark');
			}
		}
	});

	onDestroy(() => {});

	$effect(() => {});

	function toggleDarkMode() {
		isDark = !isDark;
		document.documentElement.classList.toggle('dark');
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="bg-background flex min-h-screen flex-col">
	<header
		class="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur"
	>
		<div class="container mx-auto flex h-16 items-center justify-between px-4">
			<div class="flex items-center gap-2">
				<a href="/" class="flex items-center gap-2">
					<div
						class="from-primary to-primary/70 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br"
					>
						<span class="text-primary-foreground text-lg font-bold">F</span>
					</div>
					<span class="text-xl font-bold tracking-tight">FossFi</span>
				</a>
			</div>

			<div class="flex items-center gap-3">
				<Button variant="ghost" size="icon" onclick={() => goto('/')} title="Home">
					<House class="h-5 w-5" />
				</Button>

				<Button variant="ghost" size="icon" onclick={() => goto('/skeletonui')} title="Dashboard">
					<LayoutGrid class="h-5 w-5" />
				</Button>

				<Button variant="ghost" size="icon" onclick={toggleDarkMode} title="Toggle dark mode">
					{#if isDark}
						<Sun class="h-5 w-5" />
					{:else}
						<Moon class="h-5 w-5" />
					{/if}
				</Button>

				{#if $isConnected && $wallet}
					<div
						class="bg-primary/10 border-primary/20 hidden items-center gap-2 rounded-full border px-3 py-1.5 md:flex"
					>
						<span class="relative flex h-2 w-2">
							<span
								class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"
							></span>
							<span class="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
						</span>
					</div>
				{/if}
				
				<div id="ton-connect-button"></div>
			</div>
		</div>
	</header>

	<main class="flex-1">
		{@render children()}
	</main>

	<footer class="border-border/40 bg-muted/50 border-t py-6">
		<div class="container mx-auto px-4">
			<div
				class="text-muted-foreground flex flex-col items-center justify-between gap-4 text-sm sm:flex-row"
			>
				<p>Built with care on TON Blockchain</p>
				<div class="flex items-center gap-6">
					<a
						href="https://github.com/ankitgahlyan/fossfi"
						target="_blank"
						rel="noopener noreferrer"
						class="hover:text-foreground transition-colors">GitHub</a
					>
					<a
						href="https://docs.ton.org"
						target="_blank"
						rel="noopener noreferrer"
						class="hover:text-foreground transition-colors">Docs</a
					>
					<a
						href="https://t.me/fossfi"
						target="_blank"
						rel="noopener noreferrer"
						class="hover:text-foreground transition-colors">Telegram</a
					>
				</div>
			</div>
		</div>
	</footer>
</div>
