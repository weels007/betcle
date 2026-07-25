"use client";

import { useState, useEffect } from "react";
import { Wallet, LogOut, Copy, Check } from "lucide-react";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function ConnectWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    if (typeof window === "undefined") return;
    if (!window.ethereum) return;

    try {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      }
    } catch (error) {
      console.error("Failed to check connection:", error);
    }
  }

  async function connect() {
    if (typeof window === "undefined") return;
    if (!window.ethereum) {
      alert("Please install MetaMask to connect");
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAddress(accounts[0]);

      // Try to switch to Studionet (ignore if already on correct network)
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xF22F" }],
        });
      } catch (switchError: any) {
        // -32603 = already have network with same RPC, just continue
        // 4902 = chain not added, try to add
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0xF22F",
                  chainName: "Studionet",
                  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
                  rpcUrls: ["https://studio.genlayer.com/api"],
                  blockExplorerUrls: [
                    "https://explorer-studio.genlayer.com",
                  ],
                },
              ],
            });
          } catch (addError: any) {
            // If still fails, user might already have GenLayer network with different chainId
            // Just continue - the RPC is the same
            console.log("Network already exists, continuing...");
          }
        }
        // For -32603 error (duplicate RPC), just continue
      }
    } catch (error) {
      console.error("Failed to connect:", error);
    } finally {
      setIsConnecting(false);
    }
  }

  async function disconnect() {
    setAddress(null);
  }

  async function copyAddress() {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function formatAddress(addr: string) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={copyAddress}
          className="flex items-center gap-2 glass-strong px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white transition-all duration-300 group"
        >
          {copied ? (
            <Check className="w-4 h-4 text-teal-400" />
          ) : (
            <Copy className="w-4 h-4 group-hover:text-teal-400 transition-colors" />
          )}
          <span className="hidden sm:inline font-mono">{formatAddress(address)}</span>
        </button>
        <button
          onClick={disconnect}
          className="p-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className="btn-primary flex items-center gap-2"
    >
      <Wallet className="w-4 h-4" />
      {isConnecting ? (
        <span className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Connecting...
        </span>
      ) : (
        "Connect Wallet"
      )}
    </button>
  );
}
