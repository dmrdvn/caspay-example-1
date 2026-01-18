'use client';

import { useState } from 'react';
import { useCasPay } from '../hooks/useCasPay';

interface NFT {
  id: string;
  value: string;
  name: string;
  price: number;
  image: string;
  creator: string;
  type: 'product' | 'subscription';
}

const nfts: NFT[] = [
  {
    id: 'nft_001',
    value: 'prod_mjygf8q3_96xutxw',
    name: 'Cosmic Dreams #001',
    price: 100,
    image: 'https://images.unsplash.com/photo-1634986666676-ec8fd927c23d?w=400&h=400&fit=crop',
    creator: 'ArtistOne',
    type: 'product'
  },
  {
    id: 'nft_002',
    value: 'prod_mk2rs18g_brza0dq',
    name: 'Digital Horizon #042',
    price: 5,
    image: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400&h=400&fit=crop',
    creator: 'CryptoCreator',
    type: 'product'
  },
  {
    id: 'nft_003',
    value: 'prod_mk4hh2q0_u6czh8a',
    name: 'Abstract Future #128',
    price: 10,
    image: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=400&h=400&fit=crop',
    creator: 'PixelMaster',
    type: 'product'
  },
   {
    id: 'nft_004',
    value: 'prod_mjygk41n_fue6t16',
    name: 'Abstract Future #128',
    price: 7,
    image: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=400&h=400&fit=crop',
    creator: 'PixelMaster',
    type: 'product'
  },
  {
    id: 'nft_005',
    value: 'plan_mjygw8ys_fmaacf8',
    name: 'Subscription 1',
    price: 300,
    image: 'https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=400&h=400&fit=crop',
    creator: 'NeonArtist',
    type: 'subscription'
  },
  {
    id: 'nft_006',
    value: 'plan_mk4hib7o_1ykemny',
    name: 'Subscription 2',
    price: 50,
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop',
    creator: 'MetaCreator',
    type: 'subscription'
  },
  {
    id: 'nft_007',
    value: 'plan_mjygxnvs_czt6h4z',
    name: 'Subscription 3',
    price: 10,
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop',
    creator: 'MetaCreator',
    type: 'subscription'
  }
];

export default function Home() {
  const caspay = useCasPay();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [connecting, setConnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<{success: boolean; hash?: string; error?: string} | null>(null);
  const [subscriptions, setSubscriptions] = useState<{[key: string]: boolean}>({});

  const network = process.env.NEXT_PUBLIC_CASPAY_NETWORK as 'testnet' | 'mainnet';

  const handleConnectWallet = async () => {
    if (walletConnected) {
      await caspay.wallet.disconnect();
      setWalletConnected(false);
      setWalletAddress('');
      return;
    }

    setConnecting(true);
    try {
      const address = await caspay.wallet.connect();
      if (address) {
        setWalletAddress(address);
        setWalletConnected(true);
        await checkSubscriptions(address);
      }
    } catch (error: any) {
      if (error.code === 'WALLET_NOT_FOUND') {
        if (confirm('Casper Wallet not found. Would you like to install it?')) {
          window.open('https://www.casperwallet.io/', '_blank');
        }
      } else {
        alert(error.message || 'Failed to connect wallet');
      }
    } finally {
      setConnecting(false);
    }
  };

  const checkSubscriptions = async (address: string) => {
    const plans = nfts.filter(n => n.type === 'subscription');
    const subsStatus: {[key: string]: boolean} = {};

    for (const plan of plans) {
      try {
        const result = await caspay.subscriptions.checkStatus({
          subscriberAddress: address,
          planId: plan.value
        });
        
        subsStatus[plan.value] = result.isActive || false;
      } catch (error: any) {
        subsStatus[plan.value] = false;
      }
    }

    setSubscriptions(subsStatus);
  };

  const handlePurchase = async (nft: NFT) => {
    setPurchasing(nft.id);

    try {
      const isSubscription = nft.type === 'subscription';
      
      const result = await caspay.payments.makePayment({
        ...(isSubscription 
          ? { subscriptionPlanId: nft.value } 
          : { productId: nft.value }
        ),
        amount: nft.price
      });

      if (result.success) {
        const address = await caspay.wallet.getAddress();
        if (address) {
          setWalletAddress(address);
          setWalletConnected(true);
          
          if (nft.type === 'subscription') {
            await checkSubscriptions(address);
          }
        }
        setModalData({ success: true, hash: result.transactionHash });
        setShowModal(true);
      } else {
        setModalData({ success: false, error: result.message || result.error });
        setShowModal(true);
      }
    } catch (error: any) {
      if (error.code === 'WALLET_NOT_FOUND') {
        if (confirm('Casper Wallet not found. Would you like to install it?')) {
          window.open('https://www.casperwallet.io/', '_blank');
        }
      } else if (error.code === 'TRANSFER_REJECTED') {
        setModalData({ success: false, error: 'Transaction was cancelled by user' });
        setShowModal(true);
      } else if (error.code === 'INVALID_API_KEY') {
        setModalData({ success: false, error: 'Invalid API key. Please check your configuration.' });
        setShowModal(true);
      } else if (error.code === 'RECORDING_FAILED') {
        setModalData({ 
          success: false, 
          error: error.error || 'Payment recording failed',
          hash: error.transactionHash 
        });
        setShowModal(true);
      } else {
        setModalData({ success: false, error: error.error || error.message || 'Purchase failed' });
        setShowModal(true);
      }
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="border-b border-white/10 backdrop-blur-sm bg-black/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">NFT Gallery</h1>
                <p className="text-xs text-purple-300">Powered by CasPay</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {walletConnected && walletAddress && (
                <>
                  <div className="bg-green-500/20 border border-green-500/30 rounded-full px-4 py-2 flex items-center gap-2">
                    <span className="text-green-300 text-sm font-mono">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </span>
                    <span className="text-xs text-green-400/70 border-l border-green-500/30 pl-2">
                      {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
                    </span>
                  </div>
                 
                  {network === 'testnet' && (
                    <a
                      href="https://testnet.cspr.live/tools/faucet"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-300 hover:text-purple-200 text-sm font-medium transition-colors flex items-center gap-1"
                      title="Get free testnet tokens"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Faucet
                    </a>
                  )}
                </>
              )}
              
              <button
                onClick={handleConnectWallet}
                disabled={connecting}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed text-sm"
              >
                {connecting ? 'Connecting...' : walletConnected ? 'Disconnect' : 'Connect Wallet'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Exclusive NFT Collection
          </h2>
          <p className="text-lg text-purple-300 max-w-2xl mx-auto">
            Purchase unique digital art with Casper blockchain. Secure, fast, and transparent.
          </p>
        </div>

        <div className="mb-12">
          <h3 className="text-2xl font-bold text-white mb-6">Some Awesome NFT's</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {nfts.filter(n => n.type === 'product').map((nft) => (
              <div
                key={nft.id}
                className="group bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all duration-300  "
              >
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                <div className="p-4">
                  <div className="mb-3">
                    <h3 className="text-white font-semibold text-lg mb-1 truncate">{nft.name}</h3>
                    <p className="text-purple-300 text-sm">by {nft.creator}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-gray-400 text-xs">Price</p>
                      <p className="text-white font-bold text-xl">{nft.price} CSPR</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchase(nft)}
                    disabled={purchasing === nft.id}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                  >
                    {purchasing === nft.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Purchase Now'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-white mb-6">Subscription Plans</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {nfts.filter(n => n.type === 'subscription').map((nft) => {
              const isSubscribed = subscriptions[nft.value] || false;
              
              return (
                <div
                  key={nft.id}
                  className="group bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all duration-300  "
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {isSubscribed && (
                      <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                        ✓ Subscribed
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="mb-3">
                      <h3 className="text-white font-semibold text-lg mb-1 truncate">{nft.name}</h3>
                      <p className="text-purple-300 text-sm">by {nft.creator}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-gray-400 text-xs">Price / Month</p>
                        <p className="text-white font-bold text-xl">{nft.price} CSPR</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePurchase(nft)}
                      disabled={purchasing === nft.id || isSubscribed}
                      className={`w-full font-semibold py-3 px-4 rounded-xl transition-all duration-200 ${
                        isSubscribed
                          ? 'bg-green-500/20 border-2 border-green-500/50 text-green-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 text-white disabled:cursor-not-allowed'
                      }`}
                    >
                      {isSubscribed ? (
                        'Already Subscribed'
                      ) : purchasing === nft.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        'Subscribe Now'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-6 py-3">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-white text-sm font-medium">Secured by Casper Blockchain</span>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">© 2026 NFT Gallery Sample Project | CasPay</p>
            <div className="flex items-center gap-6">
              <a href="https://caspay.link/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">CasPay Dashboard</a>
              <a href="https://docs.caspay.link/" className="text-gray-400 hover:text-white transition-colors text-sm">Documentation</a>
            </div>
          </div>
        </div>
      </footer>

      {showModal && modalData && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl ${
                modalData.success 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {modalData.success ? '✓' : '✕'}
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">
                {modalData.success ? 'Payment Successful!' : 'Payment Failed'}
              </h2>

              <p className="text-purple-300 mb-6">
                {modalData.success 
                  ? 'Your transaction has been submitted to the blockchain.' 
                  : modalData.error || 'An error occurred during the transaction.'}
              </p>

              <div className="bg-white/5 rounded-xl p-4 mb-6 text-left space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-gray-400 text-sm">Status</span>
                  <span className={`font-semibold text-sm ${
                    modalData.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {modalData.success ? 'Confirmed' : 'Failed'}
                  </span>
                </div>

                {modalData.success && modalData.hash && (
                  <>
                    <div className="flex justify-between items-center pb-3 border-b border-white/10">
                      <span className="text-gray-400 text-sm">Transaction Hash</span>
                      <a 
                        href={`https://${network === 'mainnet' ? '' : 'testnet.'}cspr.live/deploy/${modalData.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 text-sm font-mono"
                      >
                        {modalData.hash.slice(0, 8)}...{modalData.hash.slice(-8)}
                      </a>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Network</span>
                      <span className="text-white text-sm font-semibold">
                        {network === 'mainnet' ? 'Casper Mainnet' : 'Casper Testnet'}
                      </span>
                    </div>
                  </>
                )}

                {!modalData.success && (
                  <div className="flex justify-between items-start">
                    <span className="text-gray-400 text-sm">Error</span>
                    <span className="text-red-400 text-sm text-right max-w-[200px] break-words">
                      {modalData.error || 'Unknown error'}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
