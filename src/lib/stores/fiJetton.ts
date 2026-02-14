import { type SendResult } from '../utils/ton';
import { Address, beginCell, Cell, toNano, type Sender } from '@ton/core';
import { getFiJetton } from './fi';

/**
 * Transfer
 */
export async function transfer(
	provider: Sender,
	toAddress: string,
	amount: number,
	customPayload: Cell | null = null,
	forwardPayload: string = ''
): Promise<SendResult> {
	try {
		const ownerAddr = provider.address;
		const fiJetton = await getFiJetton(ownerAddr!); // todo: handle null case
		fiJetton.send(
			provider,
			{
				value: toNano(1),
				bounce: true
			},
			{
				$$type: 'JettonTransfer',
				queryId: 0n,
				amount: toNano(amount),
				destination: Address.parse(toAddress),
				responseDestination: provider.address!, // todo:
				customPayload,
				forwardTonAmount: 0n,
				forwardPayload: beginCell().storeStringTail(forwardPayload).asSlice()
			}
		);
		return { success: true };
	} catch (error) {
		console.error('Error sending jetton:', error);
		return { success: false, error: String(error) };
	}
}
