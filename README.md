# Darts Scorer 🎯

A beautiful and interactive React web application for scoring darts games. Play solo, with friends, or against AI opponents!

## Features

### Game Types
- **501/301**: Classic darts - race to zero with optional double-in/double-out rules
- **Cricket**: Close numbers 15-20 and bullseye with Standard, Cut-throat, or No-score variants

### Game Setup Wizard
- Select game type and configure rules
- Choose "best of" legs (1, 3, 5, 7, etc.)
- Add human players (registered or guest)
- Add AI bots with adjustable difficulty (1-10)

### Interactive Dartboard
- Full SVG dartboard with all 82 scoring segments
- **Exaggerated doubles and triples** for easier touch/click targeting
- Click/tap to register throws, separate Miss button
- **Fullscreen mode** for easier aiming on touch devices
- Visual markers for AI throws

### Smart Features
- **Checkout Calculator**: Automatically shows the path to finish when score ≤170
- **Preferred Double**: Set your favorite finishing double (D20, D16, etc.) and the app calculates the best path
- **Turn Tracking**: Visual display of current turn with dart-by-dart breakdown
- **Undo**: Made a mistake? Undo your last throw

### AI Opponents
- **Disc-based accuracy simulation**: AI targets a segment, and the actual hit is a random point within an accuracy disc
- **10 difficulty levels**: From Beginner (large disc, scattered throws) to Professional (small disc, precise throws)
- **Debug slider**: Globally calibrate AI difficulty with a multiplier (0.5x - 2.0x)

### User Accounts
- Create local user profiles with custom avatar colors
- Track statistics per player
- Guest play option for quick games

### Statistics & History
- Complete game history with replay details
- Per-player statistics:
  - Games played/won, win rate
  - Average per dart and per turn
  - Highest turn and checkout
  - Doubles and triples hit

## Tech Stack

- **Next.js 15** with App Router
- **React 19** + **TypeScript**
- **Tailwind CSS v4** for styling
- **Zustand** for state management
- **localStorage** for persistence

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

This app is ready to deploy to Vercel. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## Usage

1. **Launch the app** and you'll see the home screen
2. Click **New Game** to start the setup wizard
3. **Select game type** (501, 301, or Cricket)
4. **Configure rules** (double-in/out for X01, variant for Cricket)
5. **Choose match format** (best of X legs)
6. **Add players** - registered users, guests, or AI bots
7. **Play!** Click the dartboard to register throws

### During a Game
- Click on the dartboard segment you hit in real life
- Click **MISS** if you missed the board
- Use the **Undo** button if you made an input mistake
- Click the **fullscreen icon** to enlarge the dartboard
- **Next Player** button appears after 3 darts

### AI Difficulty Calibration
Access **Settings** from the home screen to adjust the global AI accuracy multiplier. This affects all difficulty levels proportionally.

## License

MIT
