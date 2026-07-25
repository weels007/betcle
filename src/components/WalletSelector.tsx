"use client";

import { useState } from "react";
import { X, Wallet } from "lucide-react";

declare global {
  interface Window {
    ethereum?: any;
    rabby?: any;
  }
}

interface WalletOption {
  name: string;
  icon: string;
  provider: any;
}

interface WalletSelectorProps {
  onSelect: (provider: any) => void;
  onClose: () => void;
}

function getAvailableWallets(): WalletOption[] {
  if (typeof window === "undefined") return [];

  const wallets: WalletOption[] = [];

  // Check for multiple providers (EIP-6963 or array)
  if (window.ethereum?.providers?.length) {
    // Multiple providers detected
    for (const provider of window.ethereum.providers) {
      if (provider.isMetaMask) {
        wallets.push({ name: "MetaMask", icon: "🦊", provider });
      } else if (provider.isRabby) {
        wallets.push({ name: "Rabby", icon: "🐰", provider });
      } else {
        wallets.push({ name: "Wallet", icon: "💳", provider });
      }
    }
  } else if (window.ethereum) {
    // Single provider
    if (window.ethereum.isMetaMask) {
      wallets.push({ name: "MetaMask", icon: "🦊", provider: window.ethereum });
    } else {
      wallets.push({ name: "Browser Wallet", icon: "💳", provider: window.ethereum });
    }
  }

  // Check for Rabby specifically (sometimes injected separately)
  if (window.rabby && !wallets.find(w => w.name === "Rabby")) {
    wallets.push({ name: "Rabby", icon: "🐰", provider: window.rabby });
  }

  // Check for Coinbase Wallet
  if (window.ethereum?.isCoinbaseWallet && !wallets.find(w => w.name === "Coinbase")) {
    wallets.push({ name: "Coinbase Wallet", icon: "🔵", provider: window.ethereum });
  }

  return wallets;
}

export function WalletSelector({ onSelect, onClose }: WalletSelectorProps) {
  const [wallets] = useState<WalletOption[]>(getAvailableWallets());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative glass-card rounded-3xl p-6 max-w-sm w-full animate-fade-in-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-1">Connect Wallet</h2>
        <p className="text-gray-400 text-sm mb-6">Choose a wallet to connect</p>

        {wallets.length === 0 ? (
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No wallets found</p>
            <p className="text-gray-500 text-sm mt-1">Install MetaMask, Rabby, or Coinbase Wallet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {wallets.map((wallet) => (
              <button
                key={wallet.name}
                onClick={() => onSelect(wallet.provider)}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-teal-500/50 transition-all duration-300"
              >
                <span className="text-2xl">{wallet.icon}</span>
                <span className="text-white font-medium">{wallet.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
