<script lang="ts">
	import { LotteryPhase } from '../lottery-contract';

	export let phase: LotteryPhase;

	const phases = [
		{ name: 'Entry', color: 'var(--neon-pink)', icon: '🎰' },
		{ name: 'Commit', color: 'var(--neon-cyan)', icon: '🔐' },
		{ name: 'Reveal', color: 'var(--neon-green)', icon: '🔓' },
		{ name: 'Complete', color: 'var(--neon-gold)', icon: '🏆' }
	];

	$: currentPhase = phases[phase];
</script>

<div class="phase-indicator">
	<div class="phase-badge" style="color: {currentPhase.color}; border-color: {currentPhase.color};">
		<span class="phase-icon">{currentPhase.icon}</span>
		<span class="phase-name">{currentPhase.name} Phase</span>
	</div>

	<div class="phase-timeline">
		{#each phases as p, i}
			<div class="phase-dot" class:active={i <= phase} style="--phase-color: {p.color}">
				<span>{p.icon}</span>
			</div>
			{#if i < phases.length - 1}
				<div class="phase-line" class:active={i < phase}></div>
			{/if}
		{/each}
	</div>
</div>

<style>
	.phase-indicator {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
		margin: 2rem 0;
	}

	.phase-badge {
		animation: fadeInScale 0.5s ease-out;
	}

	@keyframes fadeInScale {
		from {
			opacity: 0;
			transform: scale(0.8);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.phase-icon {
		font-size: 1.5rem;
		margin-right: 0.75rem;
		filter: drop-shadow(0 0 10px currentColor);
	}

	.phase-name {
		font-size: 1rem;
	}

	.phase-timeline {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 2rem 0;
	}

	.phase-dot {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		border: 3px solid var(--bg-light);
		background: var(--bg-mid);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		transition: all 0.3s ease;
		position: relative;
		opacity: 0.4;
	}

	.phase-dot.active {
		border-color: var(--phase-color);
		background: radial-gradient(circle, var(--phase-color) 0%, transparent 70%);
		box-shadow: 0 0 20px var(--phase-color);
		opacity: 1;
		animation: pulse 2s ease-in-out infinite;
	}

	.phase-line {
		width: 60px;
		height: 4px;
		background: var(--bg-light);
		transition: background 0.3s ease;
	}

	.phase-line.active {
		background: linear-gradient(90deg, var(--neon-cyan), var(--neon-green));
		box-shadow: 0 0 10px var(--neon-cyan);
	}

	@media (max-width: 768px) {
		.phase-timeline {
			flex-wrap: wrap;
			justify-content: center;
		}

		.phase-dot {
			width: 50px;
			height: 50px;
			font-size: 1.25rem;
		}

		.phase-line {
			width: 40px;
		}
	}
</style>
