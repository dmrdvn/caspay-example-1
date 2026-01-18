import { useRef } from 'react';
import CasPay from '@caspay/sdk';

export function useCasPay() {
  const caspayRef = useRef<any>(null);

  const getInstance = () => {
    if (!caspayRef.current) {
      caspayRef.current = new CasPay({
        apiKey: process.env.NEXT_PUBLIC_CASPAY_API_KEY!,
        merchantId: process.env.NEXT_PUBLIC_CASPAY_MERCHANT_ID!,
        walletAddress: process.env.NEXT_PUBLIC_CASPAY_WALLET_ADDRESS!,
        network: process.env.NEXT_PUBLIC_CASPAY_NETWORK as 'testnet' | 'mainnet'
      });
    }
    return caspayRef.current;
  };

  return getInstance();
}
