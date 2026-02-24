import { beginCell, Cell, Address, toNano, contractAddress, Dictionary } from '@ton/core';
import { Sha256 } from '@aws-crypto/sha256-js';
import { ICON_IMAGE_URL } from '@/consts';

const ONCHAIN_CONTENT_PREFIX = 0x00
const SNAKE_PREFIX = 0x00
const CELL_MAX_SIZE_BYTES = Math.floor((1023 - 8) / 8)

const sha256 = (str: string) => {
	const sha = new Sha256()
	sha.update(str)
	return Buffer.from(sha.digestSync())
}

const toKey = (key: string) => {
	return BigInt(`0x${sha256(key).toString("hex")}`)
}

// ── Fixed contract bytecode (from deployPersonal.ts) ──────────────────────────
// Both minter and wallet share this placeholder BoC for now
const MINTER_CODE_HEX =
	"b5ee9c72410210010003d3000114ff00f4a413f4bcf2c80b01020162020b03b8d0f8918eafd31f31d72c20bc6a28cc8e17ed44d001d33f31fa003001fa0002a1c801fa02cec9ed54e0d72c200000004ce302f23fe020ed44d0fa00fa48fa48d4f40505d72c23deecbef4e30fc85003fa02fa52fa5212ccf400c9ed5403050601faed44d001d33ffa00fa483003fa0020fa4831fa48d74c5134a0c801fa0212cec9ed54f82825c8cf8420fa5212fa52fa52c97825541232c8cf83cb04cf85a0ccccf91684f7b012800b5003d724c8cf8a0040cecbf7cf506d8b08c8cf905e35146615cb3f5003fa02cf88004014fa52fa54cf8420cec9c8cf850812fa5271040012cf0b6eccc98042fb0000e43605d33ffa00fa48fa5030f892f8285336c8cf842012fa52fa52fa52c97853b4541332c8cf83cb04cf85a0ccccf91684f7b012800b5003d724c8cf8a0040cecbf7cf50c705f2e04a5162a1066e925f038e1fc8cf85885250fa52cf841071fa0279cf0b8513cb3f01fa02fa52c98050fb00e20328d72c2163b5cb9c8f09d72c23215be83ce30fe30d07090a01fc36f89223c705f89223c705b1f2e2bc05d33f31fa48fa00d74c22fa4430f2d14d20d0d72c20bc6a28ccf2e048d33f31fa00d30a31fa4831fa5031fa00f404016e913091d1e2f89370f83a217271e304f839206e8118b722e304216e811d135803e3045023a813a07381032c70f83ca00270f83612a00170f836a0738104020800c282100966018070f837a023b9f2b016a0820898968070fb02f8285334c8cf842012fa52fa52fa52c97829c8cf898801547312c8cf83cb04cf85a0ccccf91684f7b007800b24d7243312ce15cbf75003fa0281150dcf0b7513cccc14ccc98011fb0000f4d72c23280f9aa48e1036f89258c705f2e2bc04d33f31fa48308e5ed72c265c3148149d3535f89221c705f2e2bc03d74c8e45d72c212846b3548e2436f89223c705f2e2bc05d30a31fa4831f404f405206e913092fb04e2206e913092ed54e28e14d72c269b90ac6431913598840f06c70016f2f4e2e203e203e200e43605d33ffa48d70a009520c8fa52c9916de26d22fa4430c0008e3730f8285324c8cf842012fa52fa52fa52c978543191c8cf83cb04cf85a0ccccf91684f7b013800b5004d724c8cf8a0040ce12cbf7cf50019132e2f892c8cf8508fa528210d1735400cf0b8e13cb3ffa54f400c98050fb000201200c0d001bbe9d6f6a2687d007d247d241800c0202710e0f0085adbcf6a2687d0018fd2418fd246ba67c1411e467c2107d2909fd29097d2964bc28916467c1e58267c2d066667c8b427bd8094005a801eb926467c500206765fbe7a8400025af16f6a2687d007d2418fd246a7a02bfa189c063fded93";
const WALLET_CODE_HEX =
	"b5ee9c7241020e0100034f000114ff00f4a413f4bcf2c80b01020162020b02bed0eda2edfbf8918e34d31f31d72c20bc6a28cc96d33f31fa00308e11d72c23deecbef492f23fe1d33f31fa0030e2ed44d0fa0002a0c801fa02cec9ed54e020ed44d0fa0020fa48fa4831fa483004d72c20bc6a28cce30fc858fa02cec9ed54030602ea3504d33ffa00d30a31fa48fa50fa00f8925009c7058e49f892ed44d0fa0031fa4831fa48fa4830f82a26c8cf8420fa5213fa52fa52c97826541232c8cf83cb04cf85a0ccccf91684f7b012800b5003d724c8cf8a0040cecbf7cf50c705f2e04adf5163a02696104850765f05e30d226e926c22e30e04050056c8cf91cd8b427225cf0b3f5004fa0212fa5216cec9c8cf850817fa525004fa0271cf0b6a15ccc98011fb00006af8276f10f897a1f82fa07381040282100966018070f837b60972fb02c8cf850813fa528210d53276dbcf0b8e13cb3fc9810082fb00025ed72c207c53f52c8ea3d72c22caf83de48e17313302d72c269b90ac6431913298840f03c70013f2f4e2e30d01e30d01070800c235f897f839206e81109e58e304718102f270f8380170f836a0810fe770f836a0bcf2b0f89221c705f2e04904d33ffa00fa50305341bef2af5141a1c8cf91ef765f7a13cb3f01fa0215fa5212fa54c9c8cf858813fa5271cf0b6e12ccc98050fb0001fc3504d33ffa00fa48fa50f401fa0020f404016e913091d1e223fa4430f2d14df897f89370f83a237271e304f839206e8118b722e304216e811d135803e3045023a825a07381032c70f83ca00170f836a00170f836a07381040282100966018070f837a0bcf2b0f8922ac705f2e0495374bef2af5174a1c821fa0227cf16c90901fced54f89224c7055349c705b18e375b343435f892f8925004c705586de304c8cf91ef765f7a12cb3f5004fa02fa5212fa54c9c8cf858812fa5271cf0b6eccc98050fb00db31e038ed44d0fa0031fa4831fa48fa4830f82a25c8cf8420fa5213fa52fa52c978c8cf905e35146618cb3f5006fa02cf8800401afa5212fa54010a0072fa0215cec9c8cf898801547273c8cf83cb04cf85a0ccccf91684f7b006800b25d7243413ce14cbf781150dcf0b7915cc12cc13ccc98050fb000201200c0d0023bfd8176a2687d007d247d2418fd24187c154001dbeb7676a2687d007d247d247d2468cd148834a";

// ── Op codes ──────────────────────────────────────────────────────────────────
const Op = {
	top_up: 0xd372158c,
	mint: 0x642b7d07,
	internal_transfer: 0x178d4519,
	MintNewJettons: 1680571655, // 0x642b7d07 alternate representation used in tact msg
	InternalTransferStep: 395134233 // 0x17...
} as const;

// ── Default mint parameters ───────────────────────────────────────────────────
const DEFAULTS = {
	supply: 0n,
	jettonAmount: 1_000_000_000_000_000n, // 1 000 000 tokens × 10^9
	tonForStorage: 100_000_000n, // 0.1 TON
	forwardTonAmount: 1n,
	totalSendValue: toNano('0.2') // 0.2 TON total
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────
export interface DeployParams {
	fiJettonAddr: string; // FossFi master jetton address
	admin: string; // Admin/deployer address (editable)
	iconUri?: string; // Optional off-chain PICTURE URL (for metadata)
	tokenName: string; // token name (for metadata)
	tokenSymbol: string; // token symbol (for metadata)
	// metadataUri?: string; // Optional off-chain JSON metadata URL
}

export interface DeployResult {
	contractAddress: string;
	boc: string;
}

export interface ValidationError {
	field: string;
	message: string;
}

// ── Address helpers ───────────────────────────────────────────────────────────
export function parseAddress(addr: string): Address {
	return Address.parse(addr.trim());
}

export function isValidAddress(addr: string): boolean {
	try {
		Address.parse(addr.trim());
		return true;
	} catch {
		return false;
	}
}

export function toFriendlyTestnet(raw: string): string {
	try {
		return Address.parse(raw).toString({ bounceable: false, testOnly: true });
	} catch {
		return raw;
	}
}

export function toFriendlyBounce(raw: string): string {
	try {
		return Address.parse(raw).toString({ bounceable: true, testOnly: true });
	} catch {
		return raw;
	}
}

// ── Validate inputs ───────────────────────────────────────────────────────────
export function validate(params: DeployParams): ValidationError[] {
	const errors: ValidationError[] = [];

	if (!params.fiJettonAddr.trim()) {
		errors.push({ field: 'fiJettonAddr', message: 'FI Jetton Address is required' });
	} else if (!isValidAddress(params.fiJettonAddr)) {
		errors.push({ field: 'fiJettonAddr', message: 'Invalid TON address' });
	}

	if (!params.admin.trim()) {
		errors.push({ field: 'admin', message: 'Deployer/Admin Address is required' });
	} else if (!isValidAddress(params.admin)) {
		errors.push({ field: 'admin', message: 'Invalid TON address' });
	}

	return errors;
}

// ── Build state init data cell ────────────────────────────────────────────────
function buildStateInitData(params: DeployParams): Cell {
	const fiAddr = parseAddress(params.fiJettonAddr);
	const adminAddr = parseAddress(params.admin);
	const walletCode = Cell.fromHex(WALLET_CODE_HEX);

	// FIX from original: content cell only included when URI is non-empty
	const contentCell =
		buildOnchainMetadata({
			name: params.tokenName,
			description: `A personal token for ${params.tokenName}`,
			symbol: params.tokenSymbol,
			image: params.iconUri ?? ICON_IMAGE_URL
		})
		// params.metadataUri && params.metadataUri.trim() !== ''
		// 	? beginCell().storeStringRefTail(params.metadataUri.trim()).endCell()
		// 	: null;

	return beginCell()
		.storeCoins(DEFAULTS.supply)
		.storeAddress(fiAddr)
		.storeAddress(adminAddr)
		.storeRef(walletCode)
		.storeMaybeRef(contentCell)
		.endCell();
}

// ── Compute deterministic contract address ────────────────────────────────────
export function computeContractAddress(params: DeployParams): string {
	const code = Cell.fromHex(MINTER_CODE_HEX);
	const data = buildStateInitData(params);
	const addr = contractAddress(0, { code, data });
	return addr.toString({ bounceable: true, testOnly: true });
}

// ── Build StateInit BOC (for TonConnect) ─────────────────────────────────────
function buildStateInitBoc(params: DeployParams): string {
	const code = Cell.fromHex(MINTER_CODE_HEX);
	const data = buildStateInitData(params);

	const stateInitCell = beginCell()
		.storeBit(0) // split_depth: nothing
		.storeBit(0) // special: nothing
		.storeBit(1) // code: present
		.storeRef(code)
		.storeBit(1) // data: present
		.storeRef(data)
		.storeBit(0) // library: empty
		.endCell();

	return stateInitCell.toBoc().toString('base64');
}

// ── Build MintNewJettons message body ─────────────────────────────────────────
function buildMintBody(adminAddr: Address): string {
	// InternalTransferStep
	const internalTransfer = beginCell()
		.storeUint(Op.InternalTransferStep, 32)
		.storeUint(0n, 64) // queryId
		.storeCoins(DEFAULTS.jettonAmount)
		.storeUint(0n, 10) // version
		.storeBit(false) // transferredAsCredit
		.storeAddress(adminAddr) // transferInitiator
		.storeAddress(null) // sendExcessesTo
		.storeCoins(DEFAULTS.forwardTonAmount)
		.endCell();

	// MintNewJettons
	const body = beginCell()
		.storeUint(Op.MintNewJettons, 32)
		.storeUint(0n, 64) // queryId
		.storeAddress(adminAddr) // mintRecipient = admin
		.storeCoins(DEFAULTS.tonForStorage)
		.storeRef(internalTransfer)
		.endCell();

	return body.toBoc().toString('base64');
}

// ── Build full TonConnect transaction ─────────────────────────────────────────
export function buildTransaction(params: DeployParams) {
	const errors = validate(params);
	if (errors.length) throw new Error(errors[0].message);

	const adminAddr = parseAddress(params.admin);
	const contractAddr = computeContractAddress(params);
	const stateInitBoc = buildStateInitBoc(params);
	const bodyBoc = buildMintBody(adminAddr);

	return {
		validUntil: Math.floor(Date.now() / 1000) + 300,
		messages: [
			{
				address: contractAddr,
				amount: String(DEFAULTS.totalSendValue),
				stateInit: stateInitBoc,
				payload: bodyBoc
			}
		]
	};
}

export function buildOnchainMetadata(data: {
    name: string
    description: string
    symbol: string
    image: string
}): Cell {
    const dict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell())

    // Store the on-chain metadata in the dictionary
    Object.entries(data).forEach(([key, value]) => {
        dict.set(toKey(key), makeSnakeCell(Buffer.from(value, "utf8")))
    })

    return beginCell().storeInt(ONCHAIN_CONTENT_PREFIX, 8).storeDict(dict).endCell()
}

function makeSnakeCell(data: Buffer) {
    // Create a cell that package the data
    const chunks = bufferToChunks(data, CELL_MAX_SIZE_BYTES)

    const b = chunks.reduceRight((curCell, chunk, index) => {
        if (index === 0) {
            curCell.storeInt(SNAKE_PREFIX, 8)
        }
        curCell.storeBuffer(chunk)
        if (index > 0) {
            const cell = curCell.endCell()
            return beginCell().storeRef(cell)
        } else {
            return curCell
        }
    }, beginCell())
    return b.endCell()
}

function bufferToChunks(buff: Buffer, chunkSize: number) {
    const chunks: Buffer[] = []
    while (buff.byteLength > 0) {
        chunks.push(buff.slice(0, chunkSize))
        buff = buff.slice(chunkSize)
    }
    return chunks
}

type Metadata = {
    name: string
    symbol: string
    description: string
    image: string
}

type JettonParams = {
    address: Address
    metadata: Metadata
    totalSupply: bigint
    owner: Address
    jettonWalletCode: Cell
}

