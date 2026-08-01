<div align="center">

# ⚡ Betcle

### AI-Powered Prediction Market on GenLayer

**Predict anything. Bet with GEN. Resolved by AI.**

[![GenLayer](https://img.shields.io/badge/Built%20on-GenLayer-6366f1?style=for-the-badge&logo=genlayer)](https://genlayer.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

</div>

## 🔮 What is Betcle?

Betcle is a **decentralized prediction market** built on [GenLayer](https://genlayer.com) — the first Intelligent Blockchain where smart contracts can think, reason, and access the internet.

Unlike traditional prediction markets that rely on centralized oracles, Betcle uses **AI-powered validators** to resolve predictions by analyzing real-world data from any URL. No trust required. No intermediaries. Just code and consensus.

> **Predict the future. Earn from your insight.**

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎯 **Create Predictions** | Post any YES/NO question with a source URL and deadline |
| 💰 **Bet with GEN** | Wager on outcomes using GenLayer's native token |
| 🤖 **AI Resolution** | GenLayer validators fetch web data + LLM to determine outcomes |
| 🏆 **Leaderboard** | Rankings based on total winnings and accuracy |
| 💸 **Withdraw** | Cash out your winnings directly to your wallet |
| 📊 **Multi-Category** | Crypto, Sports, Politics, Entertainment, Tech, Science |
| 🔍 **Explore** | Browse and filter predictions by category |
| 📱 **Responsive** | Beautiful UI on desktop and mobile |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    BETCLE FRONTEND                       │
│                  (Next.js + React + TS)                  │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              GENLAYER SDK (genlayer-js)                  │
│           Read/Write Contracts • Wallet Connect          │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│           BETCLE CONTRACT (Python Intelligent Contract)  │
│                                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │  Predictions │ │    Bets     │ │   Leaderboard   │   │
│  │   & Users    │ │   Storage   │ │   & Rewards     │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                 GENLAYER NETWORK                         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │            OPTIMISTIC DEMOCRACY                   │   │
│  │   Validators run different LLMs independently     │   │
│  │   → Consensus via Equivalence Principle           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │Validator │ │Validator │ │Validator │ │Validator │   │
│  │  (LLM 1) │ │  (LLM 2) │ │  (LLM 3) │ │  (LLM 4) │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 📜 Smart Contract

### Deployed on Studionet

```
Address: 0x8cb16c5a055b4830154799Ec64549F51fc74A6C7
Network: Studionet (Chain ID: 61999)
RPC: https://studio.genlayer.com/api
```

### Contract Methods

#### User Methods

```python
register(name: str) -> str
```
Register a new account with a username.

#### Prediction Methods

```python
create_prediction(question: str, category: str, resolution_url: str, deadline: u256) -> str
```
Create a new prediction with a YES/NO question, category, resolution source, and deadline.

```python
place_bet(prediction_id: str, choice: str) -> None [payable]
```
Place a bet on a prediction. Send GEN as value. Choice must be `"yes"` or `"no"`.

```python
resolve_prediction(prediction_id: str) -> str
```
Trigger AI resolution. GenLayer validators fetch the URL and use LLM to determine the outcome.

```python
claim_rewards(prediction_id: str) -> str
```
Claim winnings from a resolved prediction. Proportional payout based on winning pool.

```python
withdraw(amount: u256) -> str
```
Withdraw your balance to your wallet.

#### View Methods

```python
get_prediction(prediction_id: str) -> str          # Get prediction details
get_user_info(address: str) -> str                  # Get user stats
get_user_balance(address: str) -> u256              # Get withdrawable balance
get_user_bets(address: str) -> str                  # Get user's bet history
get_leaderboard() -> str                            # Get top predictors
get_total_predictions() -> u256                     # Total predictions count
get_total_bets() -> u256                            # Total bets count
get_total_users() -> u256                           # Total users count
get_categories() -> str                             # List of categories
get_platform_fee() -> u256                          # Platform fee (2%)
update_leaderboard(address: str) -> str             # Update leaderboard entry
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [MetaMask](https://metamask.io) browser extension
- GEN tokens ([Faucet](https://testnet-faucet.genlayer.foundation))

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/betcle.git
cd betcle

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env and add your contract address

# Run development server
npm run dev
```

### Setup MetaMask

1. Open MetaMask → Settings → Networks → Add Network
2. Add Studionet:

| Field | Value |
|-------|-------|
| Network Name | Studionet |
| RPC URL | https://studio.genlayer.com/api |
| Chain ID | 61999 |
| Currency Symbol | GEN |
| Block Explorer | https://explorer-studio.genlayer.com |

3. Get GEN from the faucet (💧 button in Studionet)

---

## 🎮 How It Works

### 1. Create a Prediction

```
Question: "Will Bitcoin reach $150k by end of 2026?"
Category: crypto
Resolution URL: https://coingecko.com/en/coins/bitcoin
Deadline: 2026-12-31 23:59:59
```

### 2. Place Bets

Users bet YES or NO with GEN tokens. The betting pool grows until the deadline.

### 3. AI Resolves

After the deadline, anyone can trigger resolution. GenLayer validators:
1. Fetch the resolution URL
2. Use LLM to analyze the data
3. Reach consensus via Equivalence Principle
4. Determine the outcome (YES/NO)

### 4. Claim Rewards

Winners claim proportional rewards from the pool (minus 2% platform fee).

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS, custom glass-morphism design |
| **SDK** | genlayer-js v1.1.8 |
| **Contract** | Python (GenLayer Intelligent Contract) |
| **Network** | GenLayer Studionet |
| **Wallet** | MetaMask (EVM compatible) |

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/betcle.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Import your repository
   - Configure environment variables:
     ```
     NEXT_PUBLIC_CONTRACT_ADDRESS=0x8cb16c5a055b4830154799Ec64549F51fc74A6C7
     NEXT_PUBLIC_NETWORK=studionet
     ```
   - Click "Deploy"

3. **Done!** Your app is live at `https://your-project.vercel.app`

### Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/betcle.git
cd betcle

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔧 Contract Deployment

The smart contract is deployed on GenLayer Studionet:

```
Contract Address: 0x8cb16c5a055b4830154799Ec64549F51fc74A6C7
Network: Studionet (Chain ID: 61999)
RPC: https://studio.genlayer.com/api
Explorer: https://explorer-studio.genlayer.com
```

To deploy your own contract:
1. Install GenLayer Studio
2. Deploy `contracts/betcle.py`
3. Update `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env`

---

## 📁 Project Structure

```
betcle/
├── contracts/
│   └── betcle.py                 # GenLayer Intelligent Contract
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Global styles
│   │   ├── page.tsx              # Home page
│   │   ├── create/
│   │   │   └── page.tsx          # Create prediction
│   │   ├── predictions/
│   │   │   ├── page.tsx          # Browse predictions
│   │   │   └── [id]/page.tsx     # Prediction detail + betting
│   │   ├── leaderboard/
│   │   │   └── page.tsx          # Rankings
│   │   └── profile/
│   │       └── page.tsx          # Profile + withdraw
│   ├── components/
│   │   ├── Header.tsx            # Navigation
│   │   └── ConnectWallet.tsx     # MetaMask integration
│   └── lib/
│       └── genlayer-client.ts    # GenLayer SDK config
├── .env.example
├── package.json
├── tailwind.config.js
└── README.md
```

---

## 🧪 Testing on Studionet

1. Go to [studio.genlayer.com](https://studio.genlayer.com)
2. Deploy `contracts/betcle.py`
3. Copy contract address
4. Update `.env` with the address
5. Run `npm run dev`
6. Connect MetaMask to Studionet
7. Get GEN from faucet
8. Test the full flow!

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ on [GenLayer](https://genlayer.com)**

*The Intelligent Blockchain*

</div>
