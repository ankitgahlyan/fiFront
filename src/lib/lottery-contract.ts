import {
	Address,
	beginCell,
	Cell,
	type Contract,
	contractAddress,
	type ContractProvider,
	type Sender,
	toNano
} from '@ton/core';

// Message opcodes matching the Tolk contract
export const Opcodes = {
	enterLottery: 0x11111111,
	submitCommitment: 0x22222222,
	revealCommitment: 0x33333333,
	drawWinner: 0x44444444,
	claimPrize: 0x55555555,
	refund: 0x66666666
};

// Lottery phases
export enum LotteryPhase {
	Entry = 0,
	Commit = 1,
	Reveal = 2,
	Complete = 3
}

export type LotteryConfig = {
	ownerAddress: Address;
	entryFee: bigint;
};

export function lotteryConfigToCell(config: LotteryConfig): Cell {
	return beginCell()
		.storeAddress(config.ownerAddress)
		.storeUint(0, 8) // currentPhase
		.storeCoins(config.entryFee)
		.storeDict(null) // participants map
		.storeUint(0, 32) // participantCount
		.storeDict(null) // commitments map
		.storeUint(0, 32) // commitCount
		.storeDict(null) // reveals map
		.storeUint(0, 32) // revealCount
		.storeUint(0, 32) // commitDeadline
		.storeUint(0, 32) // revealDeadline
		.storeCoins(0) // prizePool
		.storeBit(false) // winner (null)
		.storeBit(false) // winnerDetermined
		.storeUint(0, 256) // randomSeed
		.endCell();
}

export class LotteryContract implements Contract {
	constructor(
		readonly address: Address,
		readonly init?: { code: Cell; data: Cell }
	) {}

	static createFromAddress(address: Address) {
		return new LotteryContract(address);
	}

	static createFromConfig(config: LotteryConfig, code: Cell, workchain = 0) {
		const data = lotteryConfigToCell(config);
		const init = { code, data };
		return new LotteryContract(contractAddress(workchain, init), init);
	}

	// Message senders
	async sendEnterLottery(
		provider: ContractProvider,
		via: Sender,
		opts: {
			value: bigint;
			queryId?: number;
		}
	) {
		await provider.internal(via, {
			value: opts.value,
			sendMode: 1,
			body: beginCell()
				.storeUint(Opcodes.enterLottery, 32)
				.storeUint(opts.queryId ?? 0, 64)
				.endCell()
		});
	}

	async sendCommitment(
		provider: ContractProvider,
		via: Sender,
		opts: {
			commitmentHash: bigint;
			queryId?: number;
		}
	) {
		await provider.internal(via, {
			value: toNano('0.05'),
			sendMode: 1,
			body: beginCell()
				.storeUint(Opcodes.submitCommitment, 32)
				.storeUint(opts.queryId ?? 0, 64)
				.storeUint(opts.commitmentHash, 256)
				.endCell()
		});
	}

	async sendReveal(
		provider: ContractProvider,
		via: Sender,
		opts: {
			secret: bigint;
			queryId?: number;
		}
	) {
		await provider.internal(via, {
			value: toNano('0.05'),
			sendMode: 1,
			body: beginCell()
				.storeUint(Opcodes.revealCommitment, 32)
				.storeUint(opts.queryId ?? 0, 64)
				.storeUint(opts.secret, 256)
				.endCell()
		});
	}

	async sendDrawWinner(
		provider: ContractProvider,
		via: Sender,
		opts: {
			queryId?: number;
		}
	) {
		await provider.internal(via, {
			value: toNano('0.05'),
			sendMode: 1,
			body: beginCell()
				.storeUint(Opcodes.drawWinner, 32)
				.storeUint(opts.queryId ?? 0, 64)
				.endCell()
		});
	}

	async sendClaimPrize(
		provider: ContractProvider,
		via: Sender,
		opts: {
			queryId?: number;
		}
	) {
		await provider.internal(via, {
			value: toNano('0.05'),
			sendMode: 1,
			body: beginCell()
				.storeUint(Opcodes.claimPrize, 32)
				.storeUint(opts.queryId ?? 0, 64)
				.endCell()
		});
	}

	// Get methods
	async getCurrentPhase(provider: ContractProvider): Promise<number> {
		const result = await provider.get('getCurrentPhase', []);
		return result.stack.readNumber();
	}

	async getParticipantCount(provider: ContractProvider): Promise<number> {
		const result = await provider.get('getParticipantCount', []);
		return result.stack.readNumber();
	}

	async getCommitCount(provider: ContractProvider): Promise<number> {
		const result = await provider.get('getCommitCount', []);
		return result.stack.readNumber();
	}

	async getRevealCount(provider: ContractProvider): Promise<number> {
		const result = await provider.get('getRevealCount', []);
		return result.stack.readNumber();
	}

	async getPrizePool(provider: ContractProvider): Promise<bigint> {
		const result = await provider.get('getPrizePool', []);
		return result.stack.readBigNumber();
	}

	async getWinner(provider: ContractProvider): Promise<Address | null> {
		const result = await provider.get('getWinner', []);
		const address = result.stack.readAddress();
		// Check if it's address_none
		if (address.workChain === -1) {
			return null;
		}
		return address;
	}

	async isParticipant(provider: ContractProvider, address: Address): Promise<boolean> {
		const result = await provider.get('isParticipant', [
			{ type: 'slice', cell: beginCell().storeAddress(address).endCell() }
		]);
		return result.stack.readBoolean();
	}

	async hasCommitted(provider: ContractProvider, address: Address): Promise<boolean> {
		const result = await provider.get('hasCommitted', [
			{ type: 'slice', cell: beginCell().storeAddress(address).endCell() }
		]);
		return result.stack.readBoolean();
	}

	async hasRevealed(provider: ContractProvider, address: Address): Promise<boolean> {
		const result = await provider.get('hasRevealed', [
			{ type: 'slice', cell: beginCell().storeAddress(address).endCell() }
		]);
		return result.stack.readBoolean();
	}

	async getDeadlines(provider: ContractProvider): Promise<{ commit: number; reveal: number }> {
		const result = await provider.get('getDeadlines', []);
		const commit = result.stack.readNumber();
		const reveal = result.stack.readNumber();
		return { commit, reveal };
	}
}

// Utility functions for commitment generation
export function generateSecret(): Uint8Array {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return array;
}

export function createCommitmentHash(secret: Uint8Array, address: Address): bigint {
	const cell = beginCell().storeBuffer(secret).storeAddress(address).endCell();

	const hash = cell.hash();
	return BigInt('0x' + hash.toString('hex'));
}

export function secretToHex(secret: Uint8Array): string {
	return Array.from(secret)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export function hexToSecret(hex: string): Uint8Array {
	const array = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		array[i / 2] = parseInt(hex.substr(i, 2), 16);
	}
	return array;
}
