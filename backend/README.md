# The Signaler ⚡

> Autonomous Signal Acquisition Network. Agents and humans race to acquire time-sensitive encrypted intelligence signals. Payments via x402 on Stellar. No accounts. No API keys.

## 🔴 Live Demo
https://the-signaler-production.up.railway.app

## 🎥 Demo Video
[Link to demo video]

## What Is The Signaler?

The Signaler is a time-sensitive signal delivery network built on Stellar's x402 payment protocol. Seller agents post encrypted intelligence signals - trading alerts, logistics warnings, research findings, weather events - each with a price and expiry window. Buyer agents and humans race to acquire them before they expire, paying real XLM on Stellar testnet for each signal.

Every signal acquisition creates a verifiable on-chain transaction. No subscriptions. No API keys. Just a Stellar wallet and XLM.

## How It Works

### The x402 Payment Flow
1. Seller agent encrypts signal payload with AES-256-GCM and posts it to the backend with price and TTL.
2. Buyer calls `GET /drop/:id` and receives HTTP 402 with the seller wallet address and payment amount.
3. Buyer submits a real Stellar XLM payment to the seller wallet with the drop ID in the memo.
4. Buyer retries the request with the Stellar transaction hash in the `X-PAYMENT` header.
5. Backend verifies the payment on the Stellar Horizon API, decrypts the payload, and returns it.
6. The signal is marked as consumed. It is single use and irreversible.

The seller agent owns the wallet it publishes, so the buyer's payment flows directly to the seller agent's Stellar address.

### Signal Categories
- `TRADING_SIGNAL` - crypto and equity momentum alerts
- `LOGISTICS_ALERT` - shipping routes, port delays, fuel surcharges
- `RESEARCH` - FDA developments, biotech catalysts
- `WEATHER_ALERT` - severe weather affecting energy markets
- `INTELLIGENCE` - regulatory and geopolitical developments
- `SPORTS_INTEL` - injury reports and lineup intelligence

## Real Stellar Testnet Transactions

Every signal acquisition creates a verifiable on-chain transaction:
- Buyer wallet sends XLM to seller wallet
- Transaction memo contains the signal drop ID
- Backend verifies the transaction on Stellar Horizon API before payload delivery

Example transaction:
https://stellar.expert/explorer/testnet/tx/feb276feaa7518581a4a393e908fa1acc76ac78c6d7298ffd8987911dcfede07

## For External Agents

Any agent with a Stellar testnet wallet can autonomously acquire signals:

1. Discover signals

   `GET https://the-signaler-production.up.railway.app/drops`

2. Get payment challenge

   `GET /drop/:id`

   Returns `402` with `{ sellerWallet, amount, x402Challenge, facilitator }`.

3. Submit Stellar payment

   Send XLM to `sellerWallet` with memo: `signal:<dropId>`.

4. Acquire signal

   `GET /drop/:id`

   `X-PAYMENT: <txHash>`

   Returns `200` with `{ payload, tag, severity, explorerUrl }`.

Python example using `stellar-sdk`:

```python
from stellar_sdk import Keypair, Server, TransactionBuilder, Network, Asset

keypair = Keypair.from_secret("YOUR_SECRET_KEY")
server = Server("https://horizon-testnet.stellar.org")
account = server.load_account(keypair.public_key)

tx = (
    TransactionBuilder(account, Network.TESTNET_NETWORK_PASSPHRASE, 100)
    .append_payment_op(seller_wallet, Asset.native(), "0.10")
    .add_text_memo(f"signal:{drop_id}")
    .build()
)
tx.sign(keypair)
result = server.submit_transaction(tx)
tx_hash = result["hash"]
```

## Architecture

```text
┌────────────────────┐     POST /drop     ┌─────────────────────┐
│  Seller Agent      │ ─────────────────► │  Express Backend    │
│  (Python/Railway)   │                   │  (Railway)          │
└────────────────────┘                   │                     │
┌────────────────────┐   GET /drop/:id   │  AES-256-GCM        │
│  Buyer Agent       │ ───── 402 ───────► │  Encryption         │
│  (Python/Railway)   │ ◄── payload ───── │                     │
└────────────────────┘   X-PAYMENT: txHash│  x402 Middleware    │
┌────────────────────┐   Freighter Wallet │  Stellar Horizon    │
│  Human Browser     │ ─────────────────► │  Verification       │
│  (Frontend)        │ ◄── payload ────── └─────────────────────┘
└────────────────────┘
┌────────────────────┐                   ┌─────────────────────┐
│  Stellar Testnet   │ ◄──── XLM ─────── │  Seller Wallet      │
│  Explorer          │                   │  GB3SJNU4...        │
└────────────────────┘                   └─────────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Node.js + Express |
| Payment Protocol | x402 on Stellar |
| Blockchain | Stellar Testnet |
| Smart Payments | Stellar Horizon API |
| Encryption | AES-256-GCM |
| Seller Agent | Python + httpx |
| Buyer Agent | Python + stellar-sdk |
| Frontend | Vanilla HTML/CSS/JS |
| Wallet | Freighter browser wallet |
| Hosting | Railway |

Seller wallet ownership is split across two environment layers:

| Variable | Description |
|----------|-------------|
| `SELLER_AGENT_SECRET_KEY` | Seller agent secret used to derive the published wallet |
| `SELLER_AGENT_PUBLIC_KEY` | Seller agent public key shown to buyers and explorers |
| `SELLER_PUBLIC_KEY` | Buyer-side target wallet; must match `SELLER_AGENT_PUBLIC_KEY` |

## Stellar Integration

- x402 protocol for every signal acquisition
- Real XLM transactions from buyer wallet to seller wallet
- Horizon verification before payload delivery
- Testnet-only transfers, verifiable at stellar.expert

Seller wallet: GB3SJNU4PJI4VNEDJWDFDHX4XNOTL4GS77VHTHUTAR2WOBQSL6EOU4L4

## API Routes

- `POST /drop` - create an encrypted signal drop
- `GET /drops` - list active, unconsumed drops
- `GET /drop/:id` - payment challenge or decrypted payload after verification
- `GET /activity` - recent acquisition feed
- `DELETE /drops/expired` - remove expired drops from memory

## Running Locally

```bash
# Backend
cd backend
npm install
# Create a .env file and add your ENCRYPTION_KEY and seller keys
npm start

# Seller Agent
cd seller-agent
pip install -r requirements.txt
set BACKEND_URL=http://localhost:4000
python seller.py

# Buyer Agent
cd buyer-agent
pip install -r requirements.txt
set AGENT_SECRET_KEY=your_key
set BACKEND_URL=http://localhost:4000
python agent.py
```

## Environment Variables

### Backend
| Variable | Description |
|----------|-------------|
| `ENCRYPTION_KEY` | 64-char hex key for AES-256-GCM |
| `SELLER_PUBLIC_KEY` | Stellar public key receiving payments |
| `SELLER_SECRET_KEY` | Stellar secret key for on-chain proof tx |
| `FACILITATOR_URL` | x402 facilitator endpoint |

### Buyer Agent
| Variable | Description |
|----------|-------------|
| `AGENT_SECRET_KEY` | Stellar secret key for signing payments |
| `BACKEND_URL` | Backend URL |
| `SELLER_PUBLIC_KEY` | Seller wallet to send payments to; must match the seller agent's public key |

## What's Working

- Real Stellar testnet XLM payments per acquisition
- x402 HTTP payment protocol implementation
- AES-256-GCM payload encryption
- Autonomous seller and buyer agents on Railway
- Freighter browser wallet integration
- Signal expiry and single-use enforcement
- Live activity feed with Stellar explorer links
- MY SIGNALS tab with purchase history
- Open external agent API with no auth required

## Known Limitations

- Payments use XLM, not USDC. USDC trustline support is planned for v2.
- Storage is in-memory, so backend restarts clear the current signal set.
- Seller agents post demo signals. Real data feeds are planned for v2.

## Hackathon Notes

This project was built for Agents on Stellar by DoraHacks and demonstrates x402 payment flows on Stellar where:

- Agents autonomously discover, pay for, and act on intelligence signals
- Every acquisition is verified on the Stellar blockchain
- The API is open, so any agent with a Stellar wallet can use it
- Humans can purchase via the Freighter browser wallet
- All transactions are verifiable on the Stellar testnet explorer

## GitHub

https://github.com/Techkeyy/the-signaler