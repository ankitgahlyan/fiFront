# TON Lottery System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TON LOTTERY SYSTEM                              │
└─────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE LAYER                            │
└───────────────────────────────────────────────────────────────────────────┘

   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
   │   Browser    │        │   Browser    │        │   Browser    │
   │  (Player 1)  │        │  (Player 2)  │        │  (Player 3)  │
   └──────┬───────┘        └──────┬───────┘        └──────┬───────┘
          │                       │                       │
          │ TonConnect            │ TonConnect            │ TonConnect
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND APPLICATION                               │
│                         (SvelteKit + TS)                                  │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│  │  UI Components  │    │   Svelte Stores │    │ Contract Wrapper│     │
│  │                 │    │                 │    │                 │     │
│  │ • PhaseIndicator│◄──►│ • tonconnect.ts │◄──►│  lottery-       │     │
│  │ • Participant   │    │ • lottery.ts    │    │  contract.ts    │     │
│  │   Display       │    │                 │    │                 │     │
│  │ • Countdown     │    │                 │    │ • Message       │     │
│  │   Timer         │    │                 │    │   Builders      │     │
│  │ • Main Page     │    │                 │    │ • Get Methods   │     │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘     │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ TON SDK
                                  ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                           BLOCKCHAIN LAYER                                │
│                          (TON Blockchain)                                 │
└───────────────────────────────────────────────────────────────────────────┘

                        ┌──────────────────┐
                        │  Lottery Smart   │
                        │    Contract      │
                        │     (Tolk)       │
                        └────────┬─────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            │                    │                    │
            ▼                    ▼                    ▼
   ┌────────────────┐   ┌────────────────┐   ┌────────────────┐
   │   Storage      │   │    Messages    │   │   Get Methods  │
   ├────────────────┤   ├────────────────┤   ├────────────────┤
   │ • Phase        │   │ • EnterLottery │   │ • getCurrentPh │
   │ • Participants │   │ • SubmitCommit │   │ • getParticipa │
   │ • Commitments  │   │ • RevealCommit │   │ • getCommitCnt │
   │ • Reveals      │   │ • DrawWinner   │   │ • getRevealCnt │
   │ • Prize Pool   │   │ • ClaimPrize   │   │ • getPrizePool │
   │ • Winner       │   │ • Refund       │   │ • getWinner    │
   │ • Deadlines    │   │                │   │ • isParticipan │
   │ • Random Seed  │   │                │   │ • hasCommitted │
   └────────────────┘   └────────────────┘   │ • hasRevealed  │
                                             └────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│                        COMMIT-REVEAL FLOW                                 │
└───────────────────────────────────────────────────────────────────────────┘

PHASE 1: ENTRY                PHASE 2: COMMIT
  User enters                   User generates secret
     ↓                             ↓
  Pays 1 TON      ───────►     Hash(Secret + Address)
     ↓                             ↓
  Stored in                    Submit Hash
  participants map                 ↓
                               Stored in
                               commitments map

PHASE 3: REVEAL               PHASE 4: COMPLETE
  User reveals secret           Contract combines
     ↓                          all secrets
  Contract verifies:               ↓
  Hash(Secret + Addr)           XOR all secrets
  == Stored Hash                with addresses
     ↓                             ↓
  Stored in                    Modulo participant
  reveals map                   count = Winner Index
                                    ↓
                               Select Winner
                                    ↓
                               Winner claims
                               95% of prize pool

┌───────────────────────────────────────────────────────────────────────────┐
│                         SECURITY GUARANTEES                               │
└───────────────────────────────────────────────────────────────────────────┘

✅ Multi-Party Randomness
   └─ All participants contribute to final random seed

✅ Commitment Binding
   └─ Cannot change secret after commitment phase

✅ Address-Based Uniqueness
   └─ Hash(Secret + Address) prevents replay attacks

✅ Validator Resistance
   └─ Validators cannot predict outcome (commit-reveal)

✅ Byzantine Fault Tolerance
   └─ Requires minimum 2 reveals for security

✅ Timeout Protection
   └─ Deadlines prevent indefinite blocking

⚠️  Griefing Resistance (Partial)
   └─ Last revealer can choose not to reveal if losing
   └─ Mitigated by requiring minimum 2 reveals

┌───────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW                                       │
└───────────────────────────────────────────────────────────────────────────┘

User Action → Frontend → TonConnect → TON SDK → Smart Contract
                                                       ↓
Contract State ← TON Client ← Get Methods ← Auto-refresh
       ↓
   UI Update

┌───────────────────────────────────────────────────────────────────────────┐
│                       TECHNOLOGY STACK                                    │
└───────────────────────────────────────────────────────────────────────────┘

Frontend:                 Smart Contract:           Infrastructure:
• SvelteKit              • Tolk                    • TON Blockchain
• TypeScript             • TVM                     • TonConnect
• TonConnect UI          • Blueprint               • TON HTTP API
• @ton/ton               • Fift Assembler          • Vercel/Netlify
• @ton/core                                        • HTTPS Required

Design:                  Security:                 Testing:
• Orbitron Font          • Commit-Reveal           • Testnet First
• Rajdhani Font          • XOR Randomness          • Blueprint Tests
• CSS Animations         • Local Secrets           • Integration Tests
• Glassmorphism          • Error Handling          • User Testing
• Neon Effects
```

## Component Communication

```
┌─────────────────────────────────────────────────────────────┐
│                      +page.svelte                           │
│  (Main lottery interface - subscribes to all stores)        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Uses
                   ▼
        ┌──────────────────────┐
        │   Svelte Stores      │
        ├──────────────────────┤
        │ • lotteryPhase       │
        │ • participantCount   │
        │ • commitCount        │
        │ • revealCount        │
        │ • prizePool          │
        │ • winner             │
        │ • userAddress        │
        └──────────┬───────────┘
                   │
                   │ Updates
                   ▼
        ┌──────────────────────┐
        │  lottery.ts Store    │
        ├──────────────────────┤
        │ • fetchLotteryState()│
        │ • enterLottery()     │
        │ • submitCommitment() │
        │ • revealCommitment() │
        │ • drawWinner()       │
        │ • claimPrize()       │
        └──────────┬───────────┘
                   │
                   │ Uses
                   ▼
        ┌──────────────────────┐
        │ LotteryContract      │
        │     (Wrapper)        │
        ├──────────────────────┤
        │ • sendEnterLottery() │
        │ • sendCommitment()   │
        │ • sendReveal()       │
        │ • getCurrentPhase()  │
        │ • getPrizePool()     │
        └──────────┬───────────┘
                   │
                   │ Communicates
                   ▼
        ┌──────────────────────┐
        │  Smart Contract      │
        │   (On Blockchain)    │
        └──────────────────────┘
```
