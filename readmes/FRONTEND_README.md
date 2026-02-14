# TON Lottery Frontend

A stunning cyberpunk-themed decentralized lottery frontend built with SvelteKit and TonConnect.

## 🎨 Design Philosophy

This frontend embraces a **Cyberpunk Casino** aesthetic featuring:

- **Neon color palette**: Pink, cyan, purple, green, and gold
- **Custom fonts**: Orbitron (display) and Rajdhani (body)
- **Glassmorphism**: Translucent cards with blur effects
- **Animated backgrounds**: Gradient shifts and scanlines
- **Glowing neon effects**: Text shadows and button interactions
- **Smooth transitions**: Phase changes and countdown animations

The design is intentionally **bold and distinctive**, avoiding generic AI aesthetics.

## 🚀 Features

### Wallet Integration

- ✅ TonConnect wallet connection
- ✅ Automatic wallet state management
- ✅ Transaction signing with TonConnect UI

### Phase-Based UI

- ✅ **Entry Phase**: Join lottery with visual participant grid
- ✅ **Commit Phase**: Auto-generate and submit commitment hash
- ✅ **Reveal Phase**: Reveal secret with countdown timer
- ✅ **Complete Phase**: Winner announcement and prize claiming

### Real-Time Updates

- ✅ Auto-refresh lottery state every 10 seconds
- ✅ Live participant count
- ✅ Commitment and reveal progress bars
- ✅ Prize pool display with shimmer animation
- ✅ Countdown timers with urgency states

### Security Features

- ✅ Local secret storage in browser localStorage
- ✅ Automatic commitment hash generation
- ✅ Warning messages for secret preservation
- ✅ Error handling with user-friendly messages

### Responsive Design

- ✅ Mobile-first approach
- ✅ Tablet and desktop optimized
- ✅ Touch-friendly buttons
- ✅ Adaptive grid layouts

## 📦 Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd lottery-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the app.

## ⚙️ Configuration

### 1. Update Contract Address

Edit `src/lib/stores/lottery.ts`:

```typescript
const LOTTERY_ADDRESS = 'EQD...'; // Replace with your deployed contract address
```

### 2. Update TonConnect Manifest

Edit `static/tonconnect-manifest.json`:

```json
{
	"url": "https://your-actual-domain.com",
	"name": "TON Lottery",
	"iconUrl": "https://your-actual-domain.com/icon.png"
}
```

### 3. Update Manifest URL

Edit `src/lib/stores/tonconnect.ts`:

```typescript
tonConnectUI = new TonConnectUI({
	manifestUrl: 'https://your-actual-domain.com/tonconnect-manifest.json'
});
```

## 🏗️ Project Structure

```
lottery-frontend/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── CountdownTimer.svelte   # Countdown timer component
│   │   │   ├── ParticipantDisplay.svelte # Participant grid
│   │   │   └── PhaseIndicator.svelte   # Phase badge and timeline
│   │   ├── stores/
│   │   │   ├── lottery.ts              # Lottery state management
│   │   │   └── tonconnect.ts           # TonConnect wallet integration
│   │   └── lottery-contract.ts         # Contract wrapper
│   ├── routes/
│   │   ├── +layout.svelte              # Main layout with header
│   │   └── +page.svelte                # Main lottery page
│   ├── app.css                         # Global styles
│   └── app.html                        # HTML template
├── static/
│   └── tonconnect-manifest.json        # TonConnect configuration
└── package.json
```

## 🎯 Usage Flow

### For Users

1. **Connect Wallet**
   - Click "Connect Wallet" in header
   - Choose wallet (Tonkeeper, Tonhub, etc.)
   - Approve connection

2. **Enter Lottery**
   - Click "Enter Lottery (1 TON)"
   - Confirm transaction in wallet
   - Wait for minimum participants

3. **Commit Phase**
   - Click "Submit Commitment"
   - Secret is auto-generated and saved locally
   - **Important**: Don't clear browser data!
   - Wait for all participants to commit

4. **Reveal Phase**
   - Click "Reveal Secret"
   - Your saved secret is automatically used
   - Wait for deadline or all reveals

5. **Winner Determined**
   - Anyone can click "Draw Winner"
   - Winner is displayed
   - Winner claims prize

### Developer Testing

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run type checking
npm run check
```

## 🎨 Customization

### Colors

Edit CSS variables in `src/app.css`:

```css
:root {
	--neon-pink: #ff006e;
	--neon-cyan: #00f5ff;
	--neon-purple: #b042ff;
	--neon-green: #39ff14;
	--neon-gold: #ffd700;

	/* Customize to your preference */
}
```

### Fonts

Replace Google Fonts in `src/app.html`:

```html
<link
	href="https://fonts.googleapis.com/css2?family=YourFont:wght@400;700&display=swap"
	rel="stylesheet"
/>
```

Update CSS variables:

```css
:root {
	--font-display: 'YourDisplayFont', sans-serif;
	--font-body: 'YourBodyFont', sans-serif;
}
```

### Animation Speed

Adjust animation durations in component styles:

```css
animation: pulse 2s ease-in-out infinite; /* Change 2s to your preference */
```

## 🔧 Technical Details

### State Management

The app uses Svelte stores for state management:

- **tonconnect.ts**: Wallet connection state
- **lottery.ts**: Lottery contract state and actions

### Contract Interaction

All contract interactions use the TonConnect `sendTransaction` method:

```typescript
await tonConnectUI.sendTransaction({
	validUntil: Math.floor(Date.now() / 1000) + 600,
	messages: [
		{
			address: contract.address.toString(),
			amount: '1000000000', // 1 TON
			payload: encodedMessage
		}
	]
});
```

### Secret Management

Secrets are:

1. Generated using `crypto.getRandomValues()`
2. Stored in `localStorage` as hex string
3. Retrieved for reveal phase
4. Cleared after claiming prize

⚠️ **Users should backup their secret** if they clear browser data.

## 🌐 Deployment

### Vercel (Recommended)

```bash
npm run build
# Deploy .svelte-kit/build to Vercel
```

### Netlify

```bash
npm run build
# Deploy .svelte-kit/build to Netlify
```

### Static Hosting

```bash
npm run build
# Serve .svelte-kit/build with any static host
```

## 🔒 Security Notes

1. **Secret Storage**: Secrets stored in `localStorage` are vulnerable if user's device is compromised
2. **Contract Address**: Always verify you're interacting with the correct contract
3. **Transaction Limits**: Set appropriate gas limits for transactions
4. **Error Handling**: All transactions wrapped in try-catch blocks

## 📱 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## 🎭 Component Breakdown

### PhaseIndicator

- Shows current phase with icon and color
- Displays phase timeline
- Animates phase transitions

### ParticipantDisplay

- Shows participant count vs minimum
- Circular progress ring
- Grid of participant dots
- Highlights current user

### CountdownTimer

- Real-time countdown
- Hours:Minutes:Seconds format
- Urgent state (last 5 minutes)
- Expired state

## 🐛 Troubleshooting

### "TonConnect not initialized"

- Ensure `initTonConnect()` is called in `+layout.svelte`
- Check manifest URL is accessible

### "Secret not found"

- User cleared browser data
- Check `localStorage` in DevTools
- Cannot recover - user cannot reveal

### Transaction Failed

- Check wallet balance
- Verify contract address
- Check network connection
- Review console errors

### State Not Updating

- Check auto-refresh is running
- Verify contract address
- Test with manual refresh
- Check console for errors

## 📄 License

MIT License - Feel free to use and modify!

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📞 Support

- GitHub Issues: [your-repo-url/issues]
- Telegram: [your-telegram]
- Discord: [your-discord]

## 🙏 Acknowledgments

- TON Blockchain team
- TonConnect developers
- Svelte/SvelteKit team
- Orbitron & Rajdhani font creators

---

Built with ♥ for the TON community
