<script lang="ts">
	import { onMount } from 'svelte';
	import {
		lotteryPhase,
		participantCount,
		commitCount,
		revealCount,
		prizePool,
		winner,
		deadlines,
		canEnter,
		canCommit,
		canReveal,
		canDrawWinner,
		isWinner,
		isParticipant,
		hasCommitted,
		hasRevealed,
		enterLottery,
		submitCommitment,
		revealCommitment,
		drawWinner,
		claimPrize,
		fetchLotteryState
	} from '$lib/stores/lottery';
	import { getIsConnected } from '$lib/stores/tonconnect.svelte';
	// const { isConnected } = await import('$lib/stores/tonconnect');
	import { LotteryPhase } from '$lib/lottery-contract';
	import { fromNano } from '@ton/core';
	import PhaseIndicator from '$lib/components/PhaseIndicator.svelte';
	import ParticipantDisplay from '$lib/components/ParticipantDisplay.svelte';
	import CountdownTimer from '$lib/components/CountdownTimer.svelte';

	let loading = $state(false);
	let error: string | null = $state(null);

	onMount(() => {
		// fetchLotteryState();
	});

	async function handleEnter() {
		if (loading) return;
		loading = true;
		error = null;

		try {
			await enterLottery();
		} catch (e: any) {
			error = e.message || 'Failed to enter lottery';
		} finally {
			loading = false;
		}
	}

	async function handleCommit() {
		if (loading) return;
		loading = true;
		error = null;

		try {
			await submitCommitment();
		} catch (e: any) {
			error = e.message || 'Failed to submit commitment';
		} finally {
			loading = false;
		}
	}

	async function handleReveal() {
		if (loading) return;
		loading = true;
		error = null;

		try {
			await revealCommitment();
		} catch (e: any) {
			error = e.message || 'Failed to reveal commitment';
		} finally {
			loading = false;
		}
	}

	async function handleDrawWinner() {
		if (loading) return;
		loading = true;
		error = null;

		try {
			await drawWinner();
		} catch (e: any) {
			error = e.message || 'Failed to draw winner';
		} finally {
			loading = false;
		}
	}

	async function handleClaimPrize() {
		if (loading) return;
		loading = true;
		error = null;

		try {
			await claimPrize();
		} catch (e: any) {
			error = e.message || 'Failed to claim prize';
		} finally {
			loading = false;
		}
	}

	let prizeDisplay = $prizePool ? fromNano($prizePool) : '0'; // todo:
	let phaseName = ['Entry', 'Commit', 'Reveal', 'Complete'][$lotteryPhase];
</script>

<svelte:head>
	<title>TON Lottery - Provably Fair Decentralized Lottery</title>
</svelte:head>

<div class="lottery-container">
	<!-- Hero Section -->
	<div class="hero glass-card">
		<div class="hero-content">
			<h2 class="hero-title neon-text" style="color: var(--neon-gold);">PRIZE POOL</h2>
			<div class="prize-pool">
				{prizeDisplay} TON
			</div>
			<PhaseIndicator phase={$lotteryPhase} />
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="stats-grid">
		<div class="stat-card glass-card">
			<div class="stat-icon" style="color: var(--neon-purple);">👥</div>
			<div class="stat-value">{$participantCount}</div>
			<div class="stat-label">Participants</div>
		</div>

		<div class="stat-card glass-card">
			<div class="stat-icon" style="color: var(--neon-cyan);">🔒</div>
			<div class="stat-value">{$commitCount}</div>
			<div class="stat-label">Commitments</div>
		</div>

		<div class="stat-card glass-card">
			<div class="stat-icon" style="color: var(--neon-green);">🔓</div>
			<div class="stat-value">{$revealCount}</div>
			<div class="stat-label">Reveals</div>
		</div>

		<div class="stat-card glass-card">
			<div class="stat-icon" style="color: var(--neon-gold);">⏱️</div>
			<div class="stat-value">{phaseName}</div>
			<div class="stat-label">Current Phase</div>
		</div>
	</div>

	<!-- Main Action Area -->
	<div class="action-area">
		{#if !getIsConnected}
			<!-- Not Connected -->
			<div class="info-card glass-card">
				<h3>Connect Your Wallet</h3>
				<p>Connect your TON wallet to participate in the lottery</p>
				<div class="pulse-icon">💎</div>
			</div>
		{:else if $lotteryPhase === LotteryPhase.Entry}
			<!-- Entry Phase -->
			<div class="phase-card glass-card">
				<h3>🎰 Entry Phase</h3>
				<p class="phase-description">
					Join the lottery by paying the entry fee of <strong>1 TON</strong>. Once we reach the
					minimum number of participants, we'll move to the commit phase.
				</p>

				<ParticipantDisplay count={$participantCount} isParticipant={$isParticipant} />

				{#if $canEnter}
					<button
						class="neon-button"
						style="color: var(--neon-pink);"
						on:click={handleEnter}
						disabled={loading}
					>
						{loading ? 'Entering...' : 'Enter Lottery (1 TON)'}
					</button>
				{:else if $isParticipant}
					<div class="success-message">✅ You're in! Waiting for more participants...</div>
				{/if}
			</div>
		{:else if $lotteryPhase === LotteryPhase.Commit}
			<!-- Commit Phase -->
			<div class="phase-card glass-card">
				<h3>🔐 Commit Phase</h3>
				<p class="phase-description">
					Submit your commitment hash. A secret will be generated automatically and saved locally.
					<strong>Do not lose your secret!</strong> You'll need it in the reveal phase.
				</p>

				<CountdownTimer deadline={$deadlines.commit} label="Commit Deadline" />

				<div class="progress-bar">
					<div
						class="progress-fill"
						style="width: {($commitCount / $participantCount) * 100}%"
					></div>
					<span class="progress-text">{$commitCount} / {$participantCount} committed</span>
				</div>

				{#if $canCommit}
					<button
						class="neon-button"
						style="color: var(--neon-cyan);"
						on:click={handleCommit}
						disabled={loading}
					>
						{loading ? 'Committing...' : 'Submit Commitment'}
					</button>
				{:else if $hasCommitted}
					<div class="success-message">✅ Commitment submitted! Your secret is saved locally.</div>
				{:else if !$isParticipant}
					<div class="info-message">You didn't enter the lottery</div>
				{/if}
			</div>
		{:else if $lotteryPhase === LotteryPhase.Reveal}
			<!-- Reveal Phase -->
			<div class="phase-card glass-card">
				<h3>🔓 Reveal Phase</h3>
				<p class="phase-description">
					Reveal your secret to contribute to the random number generation. The winner will be
					selected once enough participants have revealed or the deadline passes.
				</p>

				<CountdownTimer deadline={$deadlines.reveal} label="Reveal Deadline" />

				<div class="progress-bar">
					<div
						class="progress-fill neon-glow"
						style="width: {($revealCount / $commitCount) * 100}%; background: var(--neon-green);"
					></div>
					<span class="progress-text">{$revealCount} / {$commitCount} revealed</span>
				</div>

				{#if $canReveal}
					<button
						class="neon-button"
						style="color: var(--neon-green);"
						on:click={handleReveal}
						disabled={loading}
					>
						{loading ? 'Revealing...' : 'Reveal Secret'}
					</button>
				{:else if $hasRevealed}
					<div class="success-message">✅ Secret revealed! Waiting for others or deadline...</div>
				{:else if !$hasCommitted}
					<div class="info-message">You didn't commit in the previous phase</div>
				{/if}

				{#if $canDrawWinner}
					<div class="draw-winner-section">
						<p>✨ Ready to draw winner!</p>
						<button
							class="neon-button"
							style="color: var(--neon-gold);"
							on:click={handleDrawWinner}
							disabled={loading}
						>
							{loading ? 'Drawing...' : 'Draw Winner'}
						</button>
					</div>
				{/if}
			</div>
		{:else if $lotteryPhase === LotteryPhase.Complete}
			<!-- Complete Phase -->
			<div class="phase-card glass-card winner-announcement">
				<h3>🎉 Lottery Complete!</h3>

				{#if $winner}
					<div class="winner-display">
						<div class="winner-icon">👑</div>
						<div class="winner-label">Winner</div>
						<div class="winner-address">{$winner.toString()}</div>
					</div>

					{#if isWinner}
						<div class="winner-celebration">
							<h2 class="neon-text" style="color: var(--neon-gold);">🎊 CONGRATULATIONS! 🎊</h2>
							<p>You won the lottery!</p>
							<button
								class="neon-button big-button"
								style="color: var(--neon-gold);"
								on:click={handleClaimPrize}
								disabled={loading}
							>
								{loading ? 'Claiming...' : `Claim ${prizeDisplay} TON`}
							</button>
						</div>
					{:else}
						<div class="info-message">
							Better luck next time! The lottery will reset after the winner claims their prize.
						</div>
					{/if}
				{:else}
					<div class="info-message">Winner is being determined...</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Error Display -->
	{#if error}
		<div class="error-card glass-card">
			<div class="error-icon">⚠️</div>
			<div class="error-message">{error}</div>
			<button class="neon-button" style="color: var(--neon-pink);" on:click={() => (error = null)}>
				Dismiss
			</button>
		</div>
	{/if}

	<!-- How It Works -->
	<div class="info-section glass-card">
		<h3>How It Works</h3>
		<div class="steps">
			<div class="step">
				<div class="step-number" style="background: var(--neon-pink);">1</div>
				<div class="step-content">
					<h4>Entry Phase</h4>
					<p>Pay 1 TON to enter. When minimum participants join, commit phase begins.</p>
				</div>
			</div>
			<div class="step">
				<div class="step-number" style="background: var(--neon-cyan);">2</div>
				<div class="step-content">
					<h4>Commit Phase</h4>
					<p>Submit a hash of your secret. Your secret is saved locally for the reveal phase.</p>
				</div>
			</div>
			<div class="step">
				<div class="step-number" style="background: var(--neon-green);">3</div>
				<div class="step-content">
					<h4>Reveal Phase</h4>
					<p>Reveal your secret. All secrets are combined to generate a random winner.</p>
				</div>
			</div>
			<div class="step">
				<div class="step-number" style="background: var(--neon-gold);">4</div>
				<div class="step-content">
					<h4>Winner Claims Prize</h4>
					<p>Winner receives 95% of the prize pool. 5% goes to the contract owner.</p>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.lottery-container {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		animation: fadeIn 0.6s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.hero {
		padding: 4rem 2rem;
		text-align: center;
		position: relative;
		overflow: hidden;
	}

	.hero::before {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
		animation: rotate 20s linear infinite;
	}

	@keyframes rotate {
		to {
			transform: rotate(360deg);
		}
	}

	.hero-content {
		position: relative;
		z-index: 1;
	}

	.hero-title {
		font-size: 1.5rem;
		margin-bottom: 1rem;
		letter-spacing: 0.3em;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.stat-card {
		padding: 2rem;
		text-align: center;
		transition: transform 0.3s ease;
	}

	.stat-card:hover {
		transform: translateY(-5px);
	}

	.stat-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
		filter: drop-shadow(0 0 10px currentColor);
	}

	.stat-value {
		font-family: var(--font-display);
		font-size: 2.5rem;
		font-weight: 900;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.stat-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.action-area {
		min-height: 400px;
	}

	.phase-card,
	.info-card {
		padding: 3rem 2rem;
		text-align: center;
	}

	.phase-card h3,
	.info-card h3 {
		font-size: 2rem;
		margin-bottom: 1rem;
		color: var(--text-primary);
	}

	.phase-description {
		color: var(--text-secondary);
		line-height: 1.8;
		margin-bottom: 2rem;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}

	.pulse-icon {
		font-size: 5rem;
		margin: 2rem 0;
		animation: pulse 2s ease-in-out infinite;
	}

	.progress-bar {
		position: relative;
		width: 100%;
		height: 50px;
		background: var(--bg-mid);
		border-radius: 25px;
		overflow: hidden;
		margin: 2rem 0;
		border: 2px solid var(--glass-border);
	}

	.progress-fill {
		height: 100%;
		background: var(--neon-cyan);
		transition: width 0.5s ease;
		box-shadow: 0 0 20px currentColor;
	}

	.neon-glow {
		box-shadow:
			0 0 20px currentColor,
			0 0 40px currentColor,
			0 0 60px currentColor;
	}

	.progress-text {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 1.125rem;
		text-shadow: 0 0 10px var(--bg-deep);
	}

	.success-message {
		padding: 1.5rem;
		background: rgba(57, 255, 20, 0.1);
		border: 2px solid var(--neon-green);
		border-radius: 15px;
		color: var(--neon-green);
		font-weight: 600;
		margin: 2rem 0;
	}

	.info-message {
		padding: 1.5rem;
		background: rgba(0, 245, 255, 0.1);
		border: 2px solid var(--neon-cyan);
		border-radius: 15px;
		color: var(--neon-cyan);
		font-weight: 600;
		margin: 2rem 0;
	}

	.draw-winner-section {
		margin-top: 3rem;
		padding-top: 3rem;
		border-top: 2px solid var(--glass-border);
	}

	.draw-winner-section p {
		font-size: 1.25rem;
		margin-bottom: 1.5rem;
		color: var(--neon-gold);
	}

	.winner-announcement {
		background: radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
	}

	.winner-display {
		margin: 3rem 0;
	}

	.winner-icon {
		font-size: 5rem;
		margin-bottom: 1rem;
		animation: bounce 1s ease-in-out infinite;
	}

	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-20px);
		}
	}

	.winner-label {
		font-size: 1.5rem;
		color: var(--neon-gold);
		font-family: var(--font-display);
		font-weight: 700;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		margin-bottom: 1rem;
	}

	.winner-address {
		font-family: var(--font-display);
		font-size: 1rem;
		color: var(--text-primary);
		word-break: break-all;
		padding: 1rem;
		background: var(--bg-mid);
		border-radius: 10px;
		max-width: 600px;
		margin: 0 auto;
	}

	.winner-celebration {
		margin-top: 3rem;
	}

	.winner-celebration h2 {
		font-size: 2.5rem;
		margin-bottom: 1rem;
	}

	.big-button {
		font-size: 1.25rem;
		padding: 1.5rem 3rem;
	}

	.error-card {
		padding: 2rem;
		text-align: center;
		border-color: var(--neon-pink);
		background: rgba(255, 0, 110, 0.1);
		animation: shake 0.5s ease;
	}

	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-10px);
		}
		75% {
			transform: translateX(10px);
		}
	}

	.error-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.error-message {
		color: var(--neon-pink);
		font-weight: 600;
		margin-bottom: 1.5rem;
	}

	.info-section {
		padding: 3rem 2rem;
	}

	.info-section h3 {
		text-align: center;
		font-size: 2rem;
		margin-bottom: 3rem;
		color: var(--text-primary);
	}

	.steps {
		display: grid;
		gap: 2rem;
	}

	.step {
		display: flex;
		gap: 2rem;
		align-items: flex-start;
	}

	.step-number {
		flex-shrink: 0;
		width: 60px;
		height: 60px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 900;
		color: var(--bg-deep);
		box-shadow: 0 0 20px currentColor;
	}

	.step-content h4 {
		font-size: 1.25rem;
		margin-bottom: 0.5rem;
		color: var(--text-primary);
	}

	.step-content p {
		color: var(--text-secondary);
		line-height: 1.6;
	}

	@media (max-width: 768px) {
		.hero {
			padding: 2rem 1rem;
		}

		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.step {
			flex-direction: column;
			align-items: center;
			text-align: center;
		}
	}
</style>
