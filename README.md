# CasPay NFT Gallery Sample

A Next.js sample project demonstrating CasPay SDK integration for accepting payments on the Casper blockchain.

## Features

- NFT marketplace with product and subscription support
- Casper Wallet integration
- One-time purchases and recurring subscriptions
- Real-time subscription status tracking
- Network detection (Mainnet/Testnet)
- Responsive UI with Tailwind CSS

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- CasPay SDK
- Tailwind CSS

## Prerequisites

- Node.js 18+ or Bun
- Casper Wallet extension
- CasPay account

## Installation

```bash
npm install
```

## Configuration

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Get your credentials from [CasPay Dashboard](https://caspay.link/dashboard)

3. Update `.env` with your credentials:

```env
NEXT_PUBLIC_CASPAY_API_KEY=your_api_key_here
NEXT_PUBLIC_CASPAY_MERCHANT_ID=your_merchant_id_here
NEXT_PUBLIC_CASPAY_WALLET_ADDRESS=your_wallet_address_here
NEXT_PUBLIC_CASPAY_NETWORK=testnet
```

For mainnet, set:
```env
NEXT_PUBLIC_CASPAY_NETWORK=mainnet
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Build

```bash
npm run build
npm start
```

## Project Structure

```
sample/
├── app/
│   ├── page.tsx          # Main NFT gallery page
│   └── layout.tsx        # Root layout
├── hooks/
│   └── useCasPay.ts      # CasPay SDK singleton hook
├── .env.example          # Environment variables template
└── package.json
```

## Key Integration Points

### Initialize CasPay SDK

```typescript
import { useCasPay } from '../hooks/useCasPay';

const caspay = useCasPay();
```

### Connect Wallet

```typescript
const address = await caspay.wallet.connect();
```

### Make Payment

```typescript
const result = await caspay.payments.makePayment({
  productId: 'prod_xxx',
  amount: 100
});
```

### Subscribe

```typescript
const result = await caspay.payments.makePayment({
  subscriptionPlanId: 'plan_xxx',
  amount: 50
});
```

### Check Subscription Status

```typescript
const status = await caspay.subscriptions.checkStatus({
  subscriberAddress: address,
  planId: 'plan_xxx',
  network: 'testnet' // or 'mainnet'
});
```

## Documentation

- [CasPay Documentation](https://docs.caspay.link)
- [CasPay SDK](https://www.npmjs.com/package/@caspay/sdk)
- [Casper Network](https://casper.network)

## License

MIT
