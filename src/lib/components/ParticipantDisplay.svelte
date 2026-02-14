<script lang="ts">
	export let count: number;
	export let isParticipant: boolean = false;

	const MIN_PARTICIPANTS = 3;

	$: participantDots = Array.from({ length: Math.max(count, MIN_PARTICIPANTS) }, (_, i) => ({
		index: i,
		active: i < count,
		isYou: isParticipant && i === count - 1
	}));

	$: progress = (count / MIN_PARTICIPANTS) * 100;
</script>

<div class="participant-display">
	<div class="participant-header">
		<h4>Participants: {count} / {MIN_PARTICIPANTS} minimum</h4>
		{#if count >= MIN_PARTICIPANTS}
			<div class="ready-badge">✨ Ready to start!</div>
		{/if}
	</div>

	<div class="progress-ring">
		<svg width="200" height="200" viewBox="0 0 200 200">
			<circle
				class="progress-background"
				cx="100"
				cy="100"
				r="85"
				fill="none"
				stroke="var(--bg-light)"
				stroke-width="10"
			/>
			<circle
				class="progress-foreground"
				cx="100"
				cy="100"
				r="85"
				fill="none"
				stroke="var(--neon-purple)"
				stroke-width="10"
				stroke-dasharray={2 * Math.PI * 85}
				stroke-dashoffset={2 * Math.PI * 85 * (1 - Math.min(progress, 100) / 100)}
				transform="rotate(-90 100 100)"
			/>
			<text
				x="100"
				y="100"
				text-anchor="middle"
				dominant-baseline="middle"
				class="progress-number"
				fill="var(--neon-purple)"
			>
				{count}
			</text>
		</svg>
	</div>

	<div class="participant-grid">
		{#each participantDots as dot}
			<div
				class="participant-dot"
				class:active={dot.active}
				class:you={dot.isYou}
				style="animation-delay: {dot.index * 0.05}s"
			>
				{#if dot.isYou}
					<span class="you-label">YOU</span>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.participant-display {
		padding: 2rem;
		text-align: center;
	}

	.participant-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.participant-header h4 {
		font-size: 1.25rem;
		color: var(--text-primary);
	}

	.ready-badge {
		padding: 0.5rem 1.5rem;
		background: rgba(176, 66, 255, 0.2);
		border: 2px solid var(--neon-purple);
		border-radius: 50px;
		color: var(--neon-purple);
		font-weight: 700;
		font-size: 0.875rem;
		box-shadow: 0 0 20px rgba(176, 66, 255, 0.3);
		animation: pulse 2s ease-in-out infinite;
	}

	.progress-ring {
		display: flex;
		justify-content: center;
		margin: 2rem 0;
	}

	.progress-foreground {
		transition: stroke-dashoffset 0.5s ease;
		filter: drop-shadow(0 0 10px var(--neon-purple));
	}

	.progress-number {
		font-family: var(--font-display);
		font-size: 3rem;
		font-weight: 900;
		filter: drop-shadow(0 0 10px var(--neon-purple));
	}

	.participant-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
		gap: 1rem;
		max-width: 600px;
		margin: 0 auto;
	}

	.participant-dot {
		aspect-ratio: 1;
		border-radius: 50%;
		border: 3px solid var(--bg-light);
		background: var(--bg-mid);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		animation: fadeInDot 0.3s ease-out forwards;
		position: relative;
	}

	@keyframes fadeInDot {
		to {
			opacity: 1;
		}
	}

	.participant-dot.active {
		border-color: var(--neon-purple);
		background: radial-gradient(circle, var(--neon-purple) 0%, transparent 70%);
		box-shadow: 0 0 15px var(--neon-purple);
		animation:
			fadeInDot 0.3s ease-out forwards,
			dotPulse 2s ease-in-out infinite;
	}

	.participant-dot.you {
		border-color: var(--neon-gold);
		background: radial-gradient(circle, var(--neon-gold) 0%, transparent 70%);
		box-shadow: 0 0 20px var(--neon-gold);
	}

	.you-label {
		font-family: var(--font-display);
		font-size: 0.625rem;
		font-weight: 900;
		color: var(--neon-gold);
		text-shadow: 0 0 10px var(--neon-gold);
	}

	@media (max-width: 768px) {
		.participant-grid {
			grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
			gap: 0.75rem;
		}
	}
</style>
