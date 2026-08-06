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
| 🛡️ **Full Lifecycle** | Deadline enforced on-chain: betting closes at deadline, resolution only after |
| ↩️ **Inconclusive Refunds** | If AI can't determine an outcome, every bettor is refunded in full |
| 🏆 **Leaderboard** | Rankings based on total winnings and accuracy |
| 💸 **Withdraw** | Cash out your winnings directly to your wallet |
| 🔐 **Multi-Wallet** | Support MetaMask, Rabby, Coinbase Wallet, and more |
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
Address: 0x673d1C55F451aBbAeBcE6E79af17f1d5b01c271c
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
Create a new prediction with a YES/NO question, category, resolution source, and deadline. The deadline must be in the future.

```python
place_bet(prediction_id: str, choice: str) -> None [payable]
```
Place a bet on a prediction. Send GEN as value. Choice must be `"yes"` or `"no"`. Betting is rejected after the deadline.

```python
resolve_prediction(prediction_id: str) -> str
```
Trigger AI resolution. GenLayer validators fetch the URL and use LLM to determine the outcome. Only callable after the deadline. If the AI cannot produce a definitive answer (or nobody bet on the winning side), the prediction is marked `inconclusive` and all bets become refundable.

```python
claim_rewards(prediction_id: str) -> str
```
Claim winnings from a resolved prediction. Proportional payout based on winning pool. The 2% platform fee is accrued exactly **once per prediction** and only when a real winning claim is paid out.

```python
refund_bets(prediction_id: str) -> str
```
Refund your full stake when a prediction settles as `inconclusive`. No fee is taken on refunds.

```python
withdraw(amount: u256) -> str
```
Withdraw your balance to your wallet.

#### Admin Methods

```python
withdraw_fee(amount: u256) -> str
```
Admin only. Withdraw platform fees to wallet.

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
get_platform_fee_balance() -> u256                  # Accumulated platform fees
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- EVM wallet (MetaMask, Rabby, Coinbase Wallet, etc.)
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

The contract enforces this lifecycle on-chain: bets are rejected after the
deadline and resolution is rejected before it. If the AI cannot reach a
definitive outcome — or nobody bet on the winning side — the prediction is
settled as `inconclusive` so every bettor can be refunded.

### 4. Claim Rewards (or Refund)

Winners claim proportional rewards from the pool (minus 2% platform fee). The
fee is accrued exactly once per prediction and only when a real winning claim
is paid out, so repeated or invalid claims can never inflate the
admin-withdrawable fee balance. Inconclusive predictions let every bettor
refund their full stake instead.

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
     NEXT_PUBLIC_CONTRACT_ADDRESS=0x673d1C55F451aBbAeBcE6E79af17f1d5b01c271c
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
Contract Address: 0x673d1C55F451aBbAeBcE6E79af17f1d5b01c271c
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
├── tests/
│   ├── conftest.py               # Windows workaround for gltest direct mode
│   └── test_betcle.py            # Fund-conservation + lifecycle tests
├── requirements.txt              # genlayer-test, genvm-linter, pytest
├── gltest.config.yaml            # Test network configuration
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
│   │   ├── instant-resolve/
│   │   │   └── page.tsx          # Instant resolve (testing)
│   │   ├── leaderboard/
│   │   │   └── page.tsx          # Rankings
│   │   └── profile/
│   │       └── page.tsx          # Profile + withdraw + admin
│   ├── components/
│   │   ├── Header.tsx            # Navigation + disconnect
│   │   ├── WalletSelector.tsx    # Multi-wallet selection
│   │   └── RegisterPopup.tsx     # Username registration
│   └── lib/
│       ├── genlayer-client.ts    # GenLayer SDK config
│       └── WalletContext.tsx     # Global wallet state
├── .env.example
├── .env.production              # Vercel config
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

## 🧪 Testing

The contract ships with a direct-mode test suite (`genlayer-test`) that runs in-memory in milliseconds — no Docker or network required.

```bash
# Python 3.12+ recommended
pip install -r requirements.txt

# Run all tests
pytest tests/ -v
```

The suite verifies:

- **Fee integrity** — the 2% platform fee is accrued exactly once per prediction and only when a real winning claim is paid out; repeated or invalid claims never inflate the admin-withdrawable fee balance.
- **Lifecycle enforcement** — creation requires a future deadline, betting is blocked after the deadline, resolution is blocked before it, and resolution requires at least one bet.
- **Inconclusive refunds** — if AI resolution fails, or nobody bet on the winning side, the prediction settles as `inconclusive` and every bettor can refund their full stake (no fee).
- **Fund conservation** — YES wins, NO wins, partial claims, and refunds never pay out more than the total pool (fee + winners + dust ≤ pool).

You can also lint the contract:

```bash
genvm-lint check contracts/betcle.py
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ on [GenLayer](https://genlayer.com)**

*The Intelligent Blockchain*

</div>
