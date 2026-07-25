"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getClient, getContractAddress } from "@/lib/genlayer-client";
import { RegisterPopup } from "@/components/RegisterPopup";
import { WalletSelector } from "@/components/WalletSelector";

interface WalletContextType {
  address: string | null;
  userInfo: any | null;
  isRegistered: boolean;
  loading: boolean;
  connectWallet: () => Promise<boolean>;
  disconnectWallet: () => void;
  refreshUserData: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  userInfo: null,
  isRegistered: false,
  loading: true,
  connectWallet: async () => false,
  disconnectWallet: () => {},
  refreshUserData: async () => {},
});

export function useWallet() {
  return useContext(WalletContext);
}

function hasMultipleWallets(): boolean {
  if (typeof window === "undefined") return false;
  
  // Check for providers array
  if (window.ethereum?.providers?.length > 1) return true;
  
  // Check if Rabby is installed alongside MetaMask
  if (window.rabby && window.ethereum?.isMetaMask) return true;
  
  // Check if Coinbase is installed alongside MetaMask
  if (window.ethereum?.isCoinbaseWallet && window.ethereum?.isMetaMask) return true;
  
  return false;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRegisterPopup, setShowRegisterPopup] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);

  const loadUserData = useCallback(async (addr: string) => {
    try {
      const client = getClient();
      const contractAddress = getContractAddress();

      if (!contractAddress) {
        setLoading(false);
        return;
      }

      const infoResult = await client.readContract({
        address: contractAddress as `0x${string}`,
        functionName: "get_user_info",
        args: [addr],
      });

      if (typeof infoResult === "string" && infoResult !== "not found" && infoResult !== "") {
        setUserInfo(JSON.parse(infoResult));
        setShowRegisterPopup(false);
      } else {
        setUserInfo(null);
        setShowRegisterPopup(true);
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
      setUserInfo(null);
      setShowRegisterPopup(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    if (address) {
      await loadUserData(address);
    }
  }, [address, loadUserData]);

  const disconnectWallet = useCallback(() => {
    setAddress(null);
    setUserInfo(null);
    setShowRegisterPopup(false);
  }, []);

  const connectWithProvider = useCallback(async (provider: any): Promise<boolean> => {
    try {
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });
      setAddress(accounts[0]);

      // Switch to Studionet
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xF22F" }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            await provider.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0xF22F",
                  chainName: "Studionet",
                  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
                  rpcUrls: ["https://studio.genlayer.com/api"],
                  blockExplorerUrls: ["https://explorer-studio.genlayer.com"],
                },
              ],
            });
          } catch (addError: any) {
            console.log("Network exists or wallet doesn't support adding chains");
          }
        }
      }

      await loadUserData(accounts[0]);
      return true;
    } catch (error) {
      console.error("Failed to connect:", error);
      return false;
    }
  }, [loadUserData]);

  const connectWallet = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") {
      alert("Please open in a browser with a wallet extension");
      return false;
    }

    if (!window.ethereum) {
      alert("Please install an EVM wallet like MetaMask, Rabby, or Coinbase Wallet");
      return false;
    }

    // Always show selector if multiple wallets detected
    if (hasMultipleWallets()) {
      setShowWalletSelector(true);
      return false;
    }

    // Single provider, connect directly
    return connectWithProvider(window.ethereum);
  }, [connectWithProvider]);

  const handleWalletSelect = useCallback(async (provider: any) => {
    setShowWalletSelector(false);
    await connectWithProvider(provider);
  }, [connectWithProvider]);

  useEffect(() => {
    const checkExistingWallet = async () => {
      if (typeof window === "undefined" || !window.ethereum) {
        setLoading(false);
        return;
      }

      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          await loadUserData(accounts[0]);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking wallet:", error);
        setLoading(false);
      }
    };

    checkExistingWallet();
  }, [loadUserData]);

  const isRegistered = userInfo !== null;

  return (
    <WalletContext.Provider value={{ address, userInfo, isRegistered, loading, connectWallet, disconnectWallet, refreshUserData }}>
      {children}
      {showWalletSelector && (
        <WalletSelector
          onSelect={handleWalletSelect}
          onClose={() => setShowWalletSelector(false)}
        />
      )}
      {showRegisterPopup && address && (
        <RegisterPopup
          address={address}
          onRegistered={() => {
            setShowRegisterPopup(false);
            loadUserData(address);
          }}
          onClose={() => setShowRegisterPopup(false)}
        />
      )}
    </WalletContext.Provider>
  );
}
