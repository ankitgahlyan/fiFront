# 🎰 Complete TON Lottery Setup Guide

A complete decentralized lottery system with commit-reveal randomness scheme.

## 📁 Project Structure

```
ton-lottery/
├── lottery.tolk                    # Smart contract (Tolk)
├── README.md                       # Contract documentation
├── lottery.test.ts                 # Test examples
└── lottery-frontend/               # SvelteKit frontend
    ├── src/
    │   ├── lib/
    │   │   ├── components/
    │   │   ├── stores/
    │   │   └── lottery-contract.ts
    │   ├── routes/
    │   │   ├── +layout.svelte
    │   │   └── +page.svelte
    │   ├── app.css
    │   └── app.html
    ├── static/
    │   └── tonconnect-manifest.json
    ├── package.json
    ├── svelte.config.js
    ├── vite.config.ts
    ├── tsconfig.json
    └── FRONTEND_README.md
```

## 🚀 Quick Start

### Step 1: Deploy Smart Contract

1. **Compile the Tolk contract**:

```bash
# Use TON compiler or Blueprint
tolk-compiler lottery.tolk -o lottery.fif
fift -s stdlib.fc lottery.fif -o lottery.boc
```

2. **Deploy to testnet** using Blueprint or ton-cli:

```bash
npx blueprint create
# Select "A simple contract (Tolk)"
# Copy lottery.tolk content
npx blueprint run
```

3. **Note the contract address** - you'll need it for the frontend.

### Step 2: Setup Frontend

```bash
cd lottery-frontend

# Install dependencies
npm install

# Configure contract address
# Edit src/lib/stores/lottery.ts:
# const LOTTERY_ADDRESS = 'EQD...' // Your deployed address

# Start development server
npm run dev
```

Visit `http://localhost:5173`

### Step 3: Deploy Frontend

```bash
# Build for production
npm run build

# Deploy to Vercel/Netlify
npm run preview  # Test production build locally
```

## 🔧 Configuration Checklist

### Frontend Configuration

- [ ] Update `LOTTERY_ADDRESS` in `src/lib/stores/lottery.ts`
- [ ] Update `manifestUrl` in `src/lib/stores/tonconnect.ts`
- [ ] Update `static/tonconnect-manifest.json` with your domain
- [ ] Add icon.png to static folder
- [ ] Test on testnet before mainnet deployment

### Contract Configuration

- [ ] Verify `ENTRY_FEE` in lottery.tolk (default: 1 TON)
- [ ] Verify `MIN_PARTICIPANTS` (default: 3)
- [ ] Verify `COMMIT_DEADLINE_SECONDS` (default: 3600 = 1 hour)
- [ ] Verify `REVEAL_DEADLINE_SECONDS` (default: 3600 = 1 hour)
- [ ] Verify `OWNER_FEE_PERCENT` (default: 5%)

## 🎮 Testing the System

### Local Testing (Testnet)

1. **Deploy contract to testnet**

```bash
# Use Blueprint or ton-cli
npx blueprint run --testnet
```

2. **Get testnet TON**

- Visit [TON Testnet Faucet](https://faucet.testnet.ton.org/)
- Get test TON for your wallet

3. **Test complete flow**:
   - Connect wallet ✅
   - Enter lottery ✅
   - Submit commitment ✅
   - Reveal secret ✅
   - Draw winner ✅
   - Claim prize ✅

### Testing Scenarios

#### Scenario 1: Happy Path (3 participants)

1. User A enters → Pays 1 TON
2. User B enters → Pays 1 TON
3. User C enters → Pays 1 TON → Phase changes to Commit
4. All users commit their hashes
5. All users reveal their secrets
6. Any user draws the winner
7. Winner claims prize (receives 2.85 TON, owner gets 0.15 TON)

#### Scenario 2: Partial Reveals

1. 3 users enter and commit
2. Only 2 users reveal
3. Wait for reveal deadline to pass
4. Draw winner (still works with 2+ reveals)
5. Winner claims prize

#### Scenario 3: Timeout

1. 3 users enter
2. Not all users commit before deadline
3. Owner triggers refund
4. All participants get 1 TON back

## 🎨 Frontend Customization

### Change Color Scheme

Edit `src/app.css`:

```css
:root {
	/* Neon Cyberpunk (default) */
	--neon-pink: #ff006e;
	--neon-cyan: #00f5ff;
	--neon-purple: #b042ff;
	--neon-green: #39ff14;
	--neon-gold: #ffd700;

	/* OR use your own palette */
	/* --primary: #your-color; */
}
```

### Change Fonts

Edit `src/app.html`:

```html
<!-- Replace Orbitron & Rajdhani with your fonts -->
<link href="https://fonts.googleapis.com/css2?family=YourFont&display=swap" rel="stylesheet" />
```

Update `src/app.css`:

```css
:root {
	--font-display: 'YourFont', sans-serif;
	--font-body: 'YourFont', sans-serif;
}
```

### Adjust Entry Fee Display

The entry fee is hardcoded in the UI. If you change it in the contract:

Edit `src/routes/+page.svelte`:

```svelte
<!-- Find and update all instances of "1 TON" --><p>Pay the entry fee of <strong>1 TON</strong></p>
```

## 🔒 Security Best Practices

### For Contract Deployment

1. **Test thoroughly on testnet** before mainnet
2. **Verify all parameters** before deployment
3. **Use a multisig wallet** as owner on mainnet
4. **Monitor contract state** regularly
5. **Have a contingency plan** for issues

### For Frontend Deployment

1. **Use HTTPS only** - required for wallets
2. **Verify contract address** before connecting
3. **Implement rate limiting** on API calls
4. **Add analytics** to track usage
5. **Monitor error rates** in production

### For Users

1. **Backup your secret** if clearing browser data
2. **Verify transactions** before signing
3. **Check contract address** matches official
4. **Use small amounts** when testing
5. **Don't share your secret** with anyone

## 📊 Monitoring & Analytics

### Contract Monitoring

Watch for:

- Unusual transaction patterns
- Failed transactions
- Phase transition delays
- Refund requests

### Frontend Monitoring

Track:

- User connections
- Transaction success rate
- Phase progression
- Error rates
- Secret storage failures

### Recommended Tools

- **TON Explorer**: Monitor contract transactions
- **Vercel Analytics**: Frontend performance
- **Sentry**: Error tracking
- **Google Analytics**: User behavior

## 🐛 Common Issues & Solutions

### Issue: "TonConnect not initialized"

**Solution**: Ensure `initTonConnect()` is called in `+layout.svelte` `onMount`

### Issue: "Secret not found" during reveal

**Solution**: User cleared browser data. Cannot recover. They cannot reveal their commitment.

### Issue: Transaction fails with exit code 101

**Solution**: Insufficient entry fee. User needs to send exactly 1 TON.

### Issue: Frontend not updating

**Solution**:

1. Check auto-refresh is enabled
2. Verify contract address
3. Check console for errors
4. Test manual refresh with `fetchLotteryState()`

### Issue: Commitment hash mismatch (exit code 302)

**Solution**: User trying to reveal with wrong secret. Make sure secret is stored correctly in localStorage.

## 📈 Scaling Considerations

### For High Traffic

1. **Use load balancer** for multiple frontend instances
2. **Cache contract state** with Redis
3. **Implement query batching** for get methods
4. **Consider CDN** for static assets
5. **Add rate limiting** on user actions

### For Multiple Lotteries

1. **Deploy factory contract** to create new lottery instances
2. **Track active lotteries** in frontend
3. **Allow users to browse** past lotteries
4. **Implement lottery archive** for history

## 🎯 Next Steps

### Enhancement Ideas

- [ ] Multi-lottery support
- [ ] Historical data & statistics
- [ ] Leaderboard for winners
- [ ] NFT rewards for participants
- [ ] Social sharing features
- [ ] Email/SMS notifications
- [ ] Mobile app (React Native)
- [ ] Admin dashboard
- [ ] Multi-language support
- [ ] Dark/light mode toggle

### Advanced Features

- [ ] Variable entry fees
- [ ] Tiered prize pools
- [ ] Recurring lotteries
- [ ] Team participation
- [ ] Referral system
- [ ] DAO governance
- [ ] Cross-chain bridge
- [ ] Integration with DEX

## 📚 Additional Resources

### TON Development

- [TON Docs](https://docs.ton.org)
- [Tolk Language Guide](https://docs.ton.org/languages/tolk/overview)
- [Blueprint Framework](https://github.com/ton-org/blueprint)

### Frontend Development

- [SvelteKit Docs](https://kit.svelte.dev)
- [TonConnect Docs](https://docs.ton.org/develop/dapps/ton-connect/overview)
- [TON SDK](https://github.com/ton-org/ton)

### Security

- [Smart Contract Security](https://docs.ton.org/develop/smart-contracts/security)
- [Randomness on TON](https://docs.ton.org/develop/smart-contracts/guidelines/random-number-generation)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - See LICENSE file for details

## 💬 Community & Support

- **Telegram**: [Join TON Dev Chat](https://t.me/tondev_eng)
- **Discord**: [TON Community](https://discord.gg/ton)
- **GitHub Issues**: Report bugs and request features

---

## 🎉 Success Checklist

Before going live, ensure:

- [x] Contract deployed and verified
- [x] Frontend deployed and accessible
- [x] TonConnect manifest publicly accessible
- [x] All tests passing
- [x] Error handling working
- [x] Mobile responsive
- [x] Analytics configured
- [x] Documentation updated
- [x] Security audit (for mainnet)
- [x] User testing completed

## ⚡ Quick Commands Reference

```bash
# Contract Development
tolk-compiler lottery.tolk -o lottery.fif
npx blueprint test

# Frontend Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Type checking

# Deployment
vercel deploy        # Deploy to Vercel
netlify deploy       # Deploy to Netlify
```

---

**Built with ♥ on TON Blockchain**

Happy building! 🚀
