<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	export let deadline: number;
	export let label: string = 'Time Remaining';

	let timeRemaining = 0;
	let interval: ReturnType<typeof setInterval>;

	function updateTime() {
		const now = Math.floor(Date.now() / 1000);
		timeRemaining = Math.max(0, deadline - now);
	}

	onMount(() => {
		updateTime();
		interval = setInterval(updateTime, 1000);
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});

	$: hours = Math.floor(timeRemaining / 3600);
	$: minutes = Math.floor((timeRemaining % 3600) / 60);
	$: seconds = timeRemaining % 60;
	$: isExpired = timeRemaining === 0;
	$: isUrgent = timeRemaining <= 300; // Last 5 minutes

	function pad(num: number): string {
		return num.toString().padStart(2, '0');
	}
</script>

<div class="countdown-timer" class:urgent={isUrgent} class:expired={isExpired}>
	<div class="countdown-label">{label}</div>

	{#if isExpired}
		<div class="countdown expired-message">⏰ EXPIRED</div>
	{:else}
		<div class="countdown">
			<div class="time-block">
				<div class="time-value">{pad(hours)}</div>
				<div class="time-unit">Hours</div>
			</div>
			<div class="time-separator">:</div>
			<div class="time-block">
				<div class="time-value">{pad(minutes)}</div>
				<div class="time-unit">Minutes</div>
			</div>
			<div class="time-separator">:</div>
			<div class="time-block">
				<div class="time-value">{pad(seconds)}</div>
				<div class="time-unit">Seconds</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.countdown-timer {
		margin: 2rem 0;
		padding: 2rem;
		background: var(--bg-mid);
		border-radius: 20px;
		border: 2px solid var(--glass-border);
		transition: all 0.3s ease;
	}

	.countdown-timer.urgent {
		border-color: var(--neon-pink);
		background: rgba(255, 0, 110, 0.05);
		animation: urgentPulse 1s ease-in-out infinite;
	}

	@keyframes urgentPulse {
		0%,
		100% {
			box-shadow: 0 0 20px rgba(255, 0, 110, 0.3);
		}
		50% {
			box-shadow: 0 0 40px rgba(255, 0, 110, 0.6);
		}
	}

	.countdown-timer.expired {
		border-color: var(--text-dim);
		opacity: 0.6;
	}

	.countdown-label {
		text-align: center;
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 0.875rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--text-secondary);
		margin-bottom: 1.5rem;
	}

	.countdown {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		font-family: var(--font-display);
	}

	.expired-message {
		color: var(--text-dim);
		font-size: 2rem;
		font-weight: 900;
		text-align: center;
	}

	.time-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.time-value {
		font-size: 3rem;
		font-weight: 900;
		color: var(--neon-cyan);
		text-shadow:
			0 0 10px var(--neon-cyan),
			0 0 20px var(--neon-cyan),
			0 0 40px var(--neon-cyan);
		min-width: 80px;
		background: var(--bg-deep);
		padding: 0.5rem;
		border-radius: 10px;
		border: 2px solid rgba(0, 245, 255, 0.3);
	}

	.urgent .time-value {
		color: var(--neon-pink);
		text-shadow:
			0 0 10px var(--neon-pink),
			0 0 20px var(--neon-pink),
			0 0 40px var(--neon-pink);
		border-color: rgba(255, 0, 110, 0.3);
		animation: blink 0.5s ease-in-out infinite;
	}

	@keyframes blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	.time-unit {
		font-size: 0.75rem;
		color: var(--text-dim);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.time-separator {
		font-size: 3rem;
		font-weight: 900;
		color: var(--text-dim);
		margin: 0 0.5rem;
	}

	@media (max-width: 768px) {
		.countdown {
			gap: 0.5rem;
		}

		.time-value {
			font-size: 2rem;
			min-width: 60px;
			padding: 0.25rem;
		}

		.time-separator {
			font-size: 2rem;
			margin: 0 0.25rem;
		}

		.time-unit {
			font-size: 0.625rem;
		}
	}
</style>
