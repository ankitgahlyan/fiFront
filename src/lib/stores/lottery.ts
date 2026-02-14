import { writable, derived, get } from 'svelte/store';
import { TonClient } from '@ton/ton';
import { Address } from '@ton/core';
import {
	LotteryContract,
	LotteryPhase,
	generateSecret,
	createCommitmentHash,
	secretToHex,
	hexToSecret
} from '../lottery-contract';
import { userAddress, getTonConnectUI } from './tonconnect';
import { browser } from '$app/environment';
import { ENDPOINT as TON_CLIENT_ENDPOINT } from '$lib/consts';
import { getTonClient } from '$lib/utils/ton';

// Configuration
const LOTTERY_ADDRESS = 'EQD...'; // Replace with actual contract address

// Lottery state
export const lotteryPhase = writable<LotteryPhase>(LotteryPhase.Entry);
export const participantCount = writable<number>(0);
export const commitCount = writable<number>(0);
export const revealCount = writable<number>(0);
export const prizePool = writable<bigint>(0n);
export const winner = writable<Address | null>(null);
export const deadlines = writable<{ commit: number; reveal: number }>({ commit: 0, reveal: 0 });

// User participation state
export const isParticipant = writable<boolean>(false);
export const hasCommitted = writable<boolean>(false);
export const hasRevealed = writable<boolean>(false);

// Local secret storage (in localStorage)
export const userSecret = writable<string | null>(null);

// Derived states
export const canEnter = derived(
	[lotteryPhase, isParticipant],
	([$phase, $isParticipant]) => $phase === LotteryPhase.Entry && !$isParticipant
);

export const canCommit = derived(
	[lotteryPhase, isParticipant, hasCommitted],
	([$phase, $isParticipant, $hasCommitted]) =>
		$phase === LotteryPhase.Commit && $isParticipant && !$hasCommitted
);

export const canReveal = derived(
	[lotteryPhase, hasCommitted, hasRevealed, userSecret],
	([$phase, $hasCommitted, $hasRevealed, $userSecret]) =>
		$phase === LotteryPhase.Reveal && $hasCommitted && !$hasRevealed && $userSecret !== null
);

export const canDrawWinner = derived(
	[lotteryPhase, commitCount, revealCount],
	([$phase, $commitCount, $revealCount]) => $phase === LotteryPhase.Reveal && $revealCount >= 2
);

export const isWinner = derived(
	[winner, userAddress],
	([$winner, $userAddress]) =>
		$winner !== null && $userAddress !== null && $winner.equals($userAddress)
);

// Get lottery contract instance
function getLotteryContract(): LotteryContract {
	const address = Address.parse(LOTTERY_ADDRESS);
	return LotteryContract.createFromAddress(address);
}

// Load secret from localStorage
export function loadSecretFromStorage(): string | null {
	if (!browser) return null;
	const stored = localStorage.getItem('lottery_secret');
	userSecret.set(stored);
	return stored;
}

// Save secret to localStorage
export function saveSecretToStorage(secret: string) {
	if (!browser) return;
	localStorage.setItem('lottery_secret', secret);
	userSecret.set(secret);
}

// Clear secret from localStorage
export function clearSecretFromStorage() {
	if (!browser) return;
	localStorage.removeItem('lottery_secret');
	userSecret.set(null);
}

// Fetch lottery state
export async function fetchLotteryState() {
	try {
		const client = getTonClient();
		const contract = getLotteryContract();
		const contractProvider = client.open(contract);

		// Fetch contract state
		const [phase, participants, commits, reveals, pool, winnerAddr, deadlinesData] =
			await Promise.all([
				contractProvider.getCurrentPhase(),
				contractProvider.getParticipantCount(),
				contractProvider.getCommitCount(),
				contractProvider.getRevealCount(),
				contractProvider.getPrizePool(),
				contractProvider.getWinner(),
				contractProvider.getDeadlines()
			]);

		lotteryPhase.set(phase);
		participantCount.set(participants);
		commitCount.set(commits);
		revealCount.set(reveals);
		prizePool.set(pool);
		winner.set(winnerAddr);
		deadlines.set(deadlinesData);

		// Fetch user-specific state if connected
		const addr = get(userAddress);
		if (addr) {
			const [participant, committed, revealed] = await Promise.all([
				contractProvider.isParticipant(addr),
				contractProvider.hasCommitted(addr),
				contractProvider.hasRevealed(addr)
			]);

			isParticipant.set(participant);
			hasCommitted.set(committed);
			hasRevealed.set(revealed);
		}
	} catch (error) {
		console.error('Failed to fetch lottery state:', error);
	}
}

// Enter lottery
export async function enterLottery() {
	try {
		const tonConnectUI = getTonConnectUI();
		const contract = getLotteryContract();

		const transaction = {
			validUntil: Math.floor(Date.now() / 1000) + 600,
			messages: [
				{
					address: contract.address.toString(),
					amount: '1000000000', // 1 TON in nanotons
					payload: contract.createEnterLotteryBody()
				}
			]
		};

		await tonConnectUI.sendTransaction(transaction);

		// Wait a bit and refresh state
		setTimeout(fetchLotteryState, 3000);
	} catch (error) {
		console.error('Failed to enter lottery:', error);
		throw error;
	}
}

// Submit commitment
export async function submitCommitment() {
	try {
		// Generate secret
		const secret = generateSecret();
		const secretHex = secretToHex(secret);

		// Save secret locally
		saveSecretToStorage(secretHex);

		const addr = get(userAddress);
		if (!addr) throw new Error('Wallet not connected');

		// Create commitment hash
		const commitmentHash = createCommitmentHash(secret, addr);

		const tonConnectUI = getTonConnectUI();
		const contract = getLotteryContract();

		const transaction = {
			validUntil: Math.floor(Date.now() / 1000) + 600,
			messages: [
				{
					address: contract.address.toString(),
					amount: '50000000', // 0.05 TON
					payload: contract.createCommitmentBody(commitmentHash)
				}
			]
		};

		await tonConnectUI.sendTransaction(transaction);

		setTimeout(fetchLotteryState, 3000);
	} catch (error) {
		console.error('Failed to submit commitment:', error);
		throw error;
	}
}

// Reveal commitment
export async function revealCommitment() {
	try {
		const secretHex = get(userSecret);
		if (!secretHex) throw new Error('Secret not found');

		const secret = hexToSecret(secretHex);
		const secretBigInt = BigInt('0x' + secretHex);

		const tonConnectUI = getTonConnectUI();
		const contract = getLotteryContract();

		const transaction = {
			validUntil: Math.floor(Date.now() / 1000) + 600,
			messages: [
				{
					address: contract.address.toString(),
					amount: '50000000', // 0.05 TON
					payload: contract.createRevealBody(secretBigInt)
				}
			]
		};

		await tonConnectUI.sendTransaction(transaction);

		setTimeout(fetchLotteryState, 3000);
	} catch (error) {
		console.error('Failed to reveal commitment:', error);
		throw error;
	}
}

// Draw winner
export async function drawWinner() {
	try {
		const tonConnectUI = getTonConnectUI();
		const contract = getLotteryContract();

		const transaction = {
			validUntil: Math.floor(Date.now() / 1000) + 600,
			messages: [
				{
					address: contract.address.toString(),
					amount: '50000000', // 0.05 TON
					payload: contract.createDrawWinnerBody()
				}
			]
		};

		await tonConnectUI.sendTransaction(transaction);

		setTimeout(fetchLotteryState, 3000);
	} catch (error) {
		console.error('Failed to draw winner:', error);
		throw error;
	}
}

// Claim prize
export async function claimPrize() {
	try {
		const tonConnectUI = getTonConnectUI();
		const contract = getLotteryContract();

		const transaction = {
			validUntil: Math.floor(Date.now() / 1000) + 600,
			messages: [
				{
					address: contract.address.toString(),
					amount: '50000000', // 0.05 TON
					payload: contract.createClaimPrizeBody()
				}
			]
		};

		await tonConnectUI.sendTransaction(transaction);

		setTimeout(fetchLotteryState, 3000);

		// Clear secret after claiming
		clearSecretFromStorage();
	} catch (error) {
		console.error('Failed to claim prize:', error);
		throw error;
	}
}

// Auto-refresh lottery state
let refreshInterval: ReturnType<typeof setInterval> | null = null;

export function startAutoRefresh(intervalMs: number = 10000) {
	if (refreshInterval) return;

	fetchLotteryState(); // Initial fetch
	refreshInterval = setInterval(fetchLotteryState, intervalMs);
}

export function stopAutoRefresh() {
	if (refreshInterval) {
		clearInterval(refreshInterval);
		refreshInterval = null;
	}
}
