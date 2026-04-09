const dotenv = require("dotenv");

dotenv.config();

const COST_PER_SIGNAL = 0.01;
const MIN_REQUIRED_BALANCE = 0.05;
const STREAM_INTERVAL_MS = 5000;
const COST_PER_SIGNAL_CENTS = 1;
const MIN_REQUIRED_BALANCE_CENTS = 5;

const SELLER_SECRET_KEY = process.env.SELLER_SECRET_KEY || "DEMO_SELLER_KEY";
const BUYER_SECRET_KEY = process.env.BUYER_SECRET_KEY || "DEMO_BUYER_KEY";
const SIGNAL_TAG = process.env.SIGNAL_TAG || "logistics_alert";
const BUYER_STARTING_BALANCE = Number.parseFloat(process.env.BUYER_STARTING_BALANCE || "0.50");

const DEMO_SIGNALS = [
  {
    type: "logistics_alert",
    message: "Port congestion detected: Rotterdam ETA +48h",
    severity: "HIGH",
  },
  {
    type: "logistics_alert",
    message: "Fuel surcharge spike: Asia-EU corridor +12%",
    severity: "MEDIUM",
  },
  {
    type: "logistics_alert",
    message: "Weather delay: Gulf of Mexico shipping lanes closed",
    severity: "HIGH",
  },
  {
    type: "logistics_alert",
    message: "New optimal route: Suez -> Cape of Good Hope saves 3 days",
    severity: "LOW",
  },
];

function formatAmount(amount) {
  return amount.toFixed(2);
}

function toCents(amount) {
  return Math.round(amount * 100);
}

function validateStartingBalance(value) {
  if (!Number.isFinite(value) || value < 0) {
    return 0.5;
  }
  return value;
}

class SimulatedMppChannel {
  constructor({ sellerSecretKey, buyerSecretKey, startingBalance, signalTag }) {
    this.sellerSecretKey = sellerSecretKey;
    this.buyerSecretKey = buyerSecretKey;
    this.balance = validateStartingBalance(startingBalance);
    this.balanceCents = toCents(this.balance);
    this.signalTag = signalTag;
    this.signalIndex = 0;
    this.deliveredCount = 0;
    this.totalPaid = 0;
    this.timer = null;
    this.closed = false;
  }

  open() {
    // TODO: Replace with real @stellar/mpp-sdk channel-open call when package is available.
    console.log("=== THE SIGNALER — MPP STREAMING FEED ===");
    console.log("Opening payment channel...");
    console.log("Channel open. Streaming logistics_alert signals.");
    console.log("Cost per signal: 0.01 USDC");
    console.log("");
  }

  nextSignal() {
    const idx = this.signalIndex % DEMO_SIGNALS.length;
    this.signalIndex += 1;
    return DEMO_SIGNALS[idx];
  }

  emitSignal() {
    if (this.balanceCents < MIN_REQUIRED_BALANCE_CENTS) {
      console.log("Balance depleted. Closing channel gracefully.");
      this.close();
      return;
    }

    // TODO: Replace with real @stellar/mpp-sdk micropayment settle/commit call.
    this.balanceCents = Math.max(0, this.balanceCents - COST_PER_SIGNAL_CENTS);
    this.balance = this.balanceCents / 100;
    this.totalPaid += COST_PER_SIGNAL;

    const signal = this.nextSignal();
    this.deliveredCount += 1;

    console.log(`[SIGNAL #${this.deliveredCount}] type: ${signal.type} | severity: ${signal.severity}`);
    console.log(`  message : ${signal.message}`);
    console.log(`  cost    : -${formatAmount(COST_PER_SIGNAL)} USDC`);
    console.log(`  balance : ${formatAmount(this.balance)} USDC remaining`);
    console.log("");
  }

  start() {
    this.timer = setInterval(() => {
      this.emitSignal();
    }, STREAM_INTERVAL_MS);
  }

  close() {
    if (this.closed) {
      return;
    }

    this.closed = true;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    // TODO: Replace with real @stellar/mpp-sdk channel close/finalize call.
    console.log("=== SESSION SUMMARY ===");
    console.log(`Signals delivered : ${this.deliveredCount}`);
    console.log(`Total paid        : ${formatAmount(this.totalPaid)} USDC`);
    console.log("Channel closed    : OK");
    console.log("=======================");
  }
}

function main() {
  const channel = new SimulatedMppChannel({
    sellerSecretKey: SELLER_SECRET_KEY,
    buyerSecretKey: BUYER_SECRET_KEY,
    startingBalance: BUYER_STARTING_BALANCE,
    signalTag: SIGNAL_TAG,
  });

  channel.open();
  channel.start();

  const shutdown = () => {
    channel.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();
