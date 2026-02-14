// Decentralized Lottery Contract using Commit-Reveal Scheme
// Addresses are used as part of the commitment to ensure uniqueness

import "@stdlib/common"
import "@stdlib/tvm-dicts"
import "@stdlib/tvm-lowlevel"

// ============================================================================
// CONSTANTS
// ============================================================================

const ENTRY_FEE: coins = ton("1.0");           // 1 TON to enter
const MIN_PARTICIPANTS: int = 3;                // Minimum participants required
const COMMIT_DEADLINE_SECONDS: int = 3600;      // 1 hour to commit
const REVEAL_DEADLINE_SECONDS: int = 3600;      // 1 hour to reveal
const OWNER_FEE_PERCENT: int = 5;              // 5% fee for owner

// ============================================================================
// LOTTERY PHASES
// ============================================================================

const PHASE_ENTRY: int8 = 0;
const PHASE_COMMIT: int8 = 1;
const PHASE_REVEAL: int8 = 2;
const PHASE_COMPLETE: int8 = 3;

// ============================================================================
// MESSAGE OPCODES
// ============================================================================

struct (0x11111111) MsgEnterLottery {
    queryId: uint64
}

struct (0x22222222) MsgSubmitCommitment {
    queryId: uint64
    commitmentHash: uint256  // hash of (secret + address)
}

struct (0x33333333) MsgRevealCommitment {
    queryId: uint64
    secret: uint256
}

struct (0x44444444) MsgDrawWinner {
    queryId: uint64
}

struct (0x55555555) MsgClaimPrize {
    queryId: uint64
}

struct (0x66666666) MsgRefund {
    queryId: uint64
}

type AllowedMessage = MsgEnterLottery | MsgSubmitCommitment | 
                      MsgRevealCommitment | MsgDrawWinner | 
                      MsgClaimPrize | MsgRefund

// ============================================================================
// STORAGE
// ============================================================================

struct LotteryStorage {
    ownerAddress: address
    currentPhase: int8
    entryFee: coins
    
    // Participant tracking
    participants: map<address, bool>     // All participants who paid
    participantCount: int32
    
    // Commit-reveal data
    commitments: map<address, uint256>   // address => hash(secret + address)
    commitCount: int32
    reveals: map<address, uint256>       // address => revealed secret
    revealCount: int32
    
    // Timing
    commitDeadline: int32
    revealDeadline: int32
    
    // Prize tracking
    prizePool: coins
    winner: address?
    winnerDetermined: bool
    
    // Random seed accumulation
    randomSeed: uint256
}

fun LotteryStorage.load() {
    return LotteryStorage.fromCell(contract.getData())
}

fun LotteryStorage.save(self) {
    contract.setData(self.toCell())
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Calculate hash of secret + address for commitment verification
fun calculateCommitmentHash(secret: uint256, addr: address): uint256 {
    val builder = createBuilderFromSlice(beginCell()
        .storeUint256(secret)
        .storeAddress(addr)
        .asSlice());
    return builder.hashCell();
}

// XOR all revealed secrets with addresses to generate final random number
fun combineReveals(reveals: map<address, uint256>, participants: map<address, bool>): uint256 {
    var seed: uint256 = 0;
    var entry = reveals.findFirst();
    
    while (entry.isFound) {
        val addr = entry.getKey();
        val secret = entry.loadValue();
        
        // XOR the secret with the address hash
        val addrHash = createBuilderFromSlice(beginCell()
            .storeAddress(addr)
            .asSlice()).hashCell();
        
        seed ^= secret;
        seed ^= addrHash;
        
        entry = reveals.iterateNext(entry);
    }
    
    return seed;
}

// Select winner based on random seed
fun selectWinner(seed: uint256, participants: map<address, bool>, count: int32): address {
    // Use the seed to select an index
    val winnerIndex = seed % count;
    
    var currentIndex: int32 = 0;
    var entry = participants.findFirst();
    
    while (entry.isFound) {
        if (currentIndex == winnerIndex) {
            return entry.getKey();
        }
        currentIndex += 1;
        entry = participants.iterateNext(entry);
    }
    
    // Fallback (should never reach here)
    throw 999;
}

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

fun onInternalMessage(in: InMessage) {
    val msg = lazy AllowedMessage.fromSlice(in.body);
    var storage = lazy LotteryStorage.load();
    
    match (msg) {
        MsgEnterLottery => {
            // Phase check
            assert(storage.currentPhase == PHASE_ENTRY) throw 100;
            
            // Value check
            assert(in.valueCoins >= storage.entryFee) throw 101;
            
            // Check not already entered
            assert(!storage.participants.exists(in.senderAddress)) throw 102;
            
            // Add participant
            storage.participants.set(in.senderAddress, true);
            storage.participantCount += 1;
            storage.prizePool += in.valueCoins;
            
            // If minimum participants reached, move to commit phase
            if (storage.participantCount >= MIN_PARTICIPANTS) {
                storage.currentPhase = PHASE_COMMIT;
                storage.commitDeadline = now() + COMMIT_DEADLINE_SECONDS;
            }
            
            storage.save();
        }
        
        MsgSubmitCommitment => {
            // Phase check
            assert(storage.currentPhase == PHASE_COMMIT) throw 200;
            
            // Deadline check
            assert(now() <= storage.commitDeadline) throw 201;
            
            // Must be a participant
            assert(storage.participants.exists(in.senderAddress)) throw 202;
            
            // Check not already committed
            assert(!storage.commitments.exists(in.senderAddress)) throw 203;
            
            // Store commitment
            storage.commitments.set(in.senderAddress, msg.commitmentHash);
            storage.commitCount += 1;
            
            // If all participants committed, move to reveal phase
            if (storage.commitCount == storage.participantCount) {
                storage.currentPhase = PHASE_REVEAL;
                storage.revealDeadline = now() + REVEAL_DEADLINE_SECONDS;
            }
            
            storage.save();
        }
        
        MsgRevealCommitment => {
            // Phase check
            assert(storage.currentPhase == PHASE_REVEAL) throw 300;
            
            // Deadline check
            assert(now() <= storage.revealDeadline) throw 301;
            
            // Must have committed
            val commitment = storage.commitments.mustGet(in.senderAddress);
            
            // Verify the reveal matches the commitment
            val calculatedHash = calculateCommitmentHash(msg.secret, in.senderAddress);
            assert(calculatedHash == commitment) throw 302;
            
            // Store reveal
            storage.reveals.set(in.senderAddress, msg.secret);
            storage.revealCount += 1;
            
            storage.save();
        }
        
        MsgDrawWinner => {
            // Phase check
            assert(storage.currentPhase == PHASE_REVEAL) throw 400;
            
            // Either all revealed or deadline passed
            val allRevealed = (storage.revealCount == storage.commitCount);
            val deadlinePassed = (now() > storage.revealDeadline);
            assert(allRevealed || deadlinePassed) throw 401;
            
            // Need at least 2 reveals for security
            assert(storage.revealCount >= 2) throw 402;
            
            // Combine all reveals to generate random seed
            storage.randomSeed = combineReveals(storage.reveals, storage.participants);
            
            // Select winner
            storage.winner = selectWinner(storage.randomSeed, 
                                         storage.participants, 
                                         storage.participantCount);
            storage.winnerDetermined = true;
            storage.currentPhase = PHASE_COMPLETE;
            
            storage.save();
        }
        
        MsgClaimPrize => {
            // Must be in complete phase
            assert(storage.currentPhase == PHASE_COMPLETE) throw 500;
            assert(storage.winnerDetermined) throw 501;
            
            // Must be the winner
            assert(storage.winner! == in.senderAddress) throw 502;
            
            // Calculate owner fee and prize
            val ownerFee = (storage.prizePool * OWNER_FEE_PERCENT) / 100;
            val prize = storage.prizePool - ownerFee;
            
            // Send owner fee
            val ownerMsg = createMessage({
                bounce: BounceMode.NoBounce,
                dest: storage.ownerAddress,
                value: ownerFee,
                body: void
            });
            ownerMsg.send(SEND_MODE_REGULAR);
            
            // Send prize to winner
            val prizeMsg = createMessage({
                bounce: BounceMode.NoBounce,
                dest: in.senderAddress,
                value: prize,
                body: void
            });
            prizeMsg.send(SEND_MODE_REGULAR | SEND_MODE_IGNORE_ERRORS);
            
            // Reset storage for new lottery
            storage.prizePool = 0;
            storage.winner = null;
            
            storage.save();
        }
        
        MsgRefund => {
            // Only owner can trigger refund
            assert(in.senderAddress == storage.ownerAddress) throw 600;
            
            // Only if lottery failed (e.g., not enough reveals)
            assert(storage.currentPhase != PHASE_COMPLETE) throw 601;
            
            // Refund all participants
            var entry = storage.participants.findFirst();
            while (entry.isFound) {
                val participantAddr = entry.getKey();
                
                val refundMsg = createMessage({
                    bounce: BounceMode.NoBounce,
                    dest: participantAddr,
                    value: storage.entryFee,
                    body: void
                });
                refundMsg.send(SEND_MODE_REGULAR | SEND_MODE_IGNORE_ERRORS);
                
                entry = storage.participants.iterateNext(entry);
            }
            
            // Reset storage
            storage.currentPhase = PHASE_ENTRY;
            storage.participants = createEmptyMap();
            storage.participantCount = 0;
            storage.commitments = createEmptyMap();
            storage.commitCount = 0;
            storage.reveals = createEmptyMap();
            storage.revealCount = 0;
            storage.prizePool = 0;
            
            storage.save();
        }
        
        else => {
            // Reject unknown messages
            assert(in.body.isEmpty()) throw 0xFFFF;
        }
    }
}

// ============================================================================
// GET METHODS
// ============================================================================

get fun getCurrentPhase() {
    val storage = lazy LotteryStorage.load();
    return storage.currentPhase;
}

get fun getParticipantCount() {
    val storage = lazy LotteryStorage.load();
    return storage.participantCount;
}

get fun getCommitCount() {
    val storage = lazy LotteryStorage.load();
    return storage.commitCount;
}

get fun getRevealCount() {
    val storage = lazy LotteryStorage.load();
    return storage.revealCount;
}

get fun getPrizePool() {
    val storage = lazy LotteryStorage.load();
    return storage.prizePool;
}

get fun getWinner() {
    val storage = lazy LotteryStorage.load();
    if (storage.winner == null) {
        return createAddressNone();
    }
    return storage.winner!;
}

get fun isParticipant(addr: address) {
    val storage = lazy LotteryStorage.load();
    return storage.participants.exists(addr);
}

get fun hasCommitted(addr: address) {
    val storage = lazy LotteryStorage.load();
    return storage.commitments.exists(addr);
}

get fun hasRevealed(addr: address) {
    val storage = lazy LotteryStorage.load();
    return storage.reveals.exists(addr);
}

get fun getDeadlines() {
    val storage = lazy LotteryStorage.load();
    return (storage.commitDeadline, storage.revealDeadline);
}
