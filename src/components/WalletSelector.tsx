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
  const seen = new Set<string>();

  // Check window.ethereum.providers array (EIP-6963 or multi-wallet)
  if (window.ethereum?.providers?.length) {
    for (const provider of window.ethereum.providers) {
      if (provider.isMetaMask && !seen.has("MetaMask")) {
        wallets.push({ name: "MetaMask", icon: "🦊", provider });
        seen.add("MetaMask");
      } else if (provider.isRabby && !seen.has("Rabby")) {
        wallets.push({ name: "Rabby", icon: "🐰", provider });
        seen.add("Rabby");
      } else if (provider.isCoinbaseWallet && !seen.has("Coinbase")) {
        wallets.push({ name: "Coinbase Wallet", icon: "🔵", provider });
        seen.add("Coinbase");
      }
    }
  }

  // Check main window.ethereum
  if (window.ethereum) {
    if (window.ethereum.isMetaMask && !seen.has("MetaMask")) {
      wallets.push({ name: "MetaMask", icon: "🦊", provider: window.ethereum });
      seen.add("MetaMask");
    } else if (window.ethereum.isRabby && !seen.has("Rabby")) {
      wallets.push({ name: "Rabby", icon: "🐰", provider: window.ethereum });
      seen.add("Rabby");
    } else if (window.ethereum.isCoinbaseWallet && !seen.has("Coinbase")) {
      wallets.push({ name: "Coinbase Wallet", icon: "🔵", provider: window.ethereum });
      seen.add("Coinbase");
    } else if (!seen.has("Browser Wallet")) {
      wallets.push({ name: "Browser Wallet", icon: "💳", provider: window.ethereum });
      seen.add("Browser Wallet");
    }
  }

  // Check Rabby separately (sometimes injected as window.rabby)
  if (window.rabby && !seen.has("Rabby")) {
    wallets.push({ name: "Rabby", icon: "🐰", provider: window.rabby });
    seen.add("Rabby");
  }

  // If only MetaMask detected, still show it
  if (wallets.length === 0 && window.ethereum) {
    wallets.push({ name: "MetaMask", icon: "🦊", provider: window.ethereum });
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
