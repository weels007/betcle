"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getClient, getContractAddress } from "@/lib/genlayer-client";
import { RegisterPopup } from "@/components/RegisterPopup";
import { WalletSelector } from "@/components/WalletSelector";

interface WalletContextType {
  address: string | null;
  provider: any | null;
  userInfo: any | null;
  isRegistered: boolean;
  loading: boolean;
  connectWallet: () => Promise<boolean>;
  disconnectWallet: () => void;
  refreshUserData: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  provider: null,
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
  if (window.ethereum?.providers?.length > 1) return true;
  if (window.rabby && window.ethereum?.isMetaMask) return true;
  return false;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<any | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRegisterPopup, setShowRegisterPopup] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);

  const loadUserData = useCallback(async (addr: string) => {
    try {
      const client = getClient();
      const contractAddress = getContractAddress();

      console.log("[WalletContext] Contract address:", contractAddress);

      if (!contractAddress) {
        setLoading(false);
        return;
      }

      const infoResult = await client.readContract({
        address: contractAddress as `0x${string}`,
        functionName: "get_user_info",
        args: [addr],
      });

      console.log("[WalletContext] User info result:", infoResult);

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

  const connectWithProvider = useCallback(async (selectedProvider: any): Promise<boolean> => {
    try {
      const accounts = await selectedProvider.request({
        method: "eth_requestAccounts",
      });
      console.log("[WalletContext] Connected account:", accounts[0]);
      setAddress(accounts[0]);
      setProvider(selectedProvider);
      setLoading(false);

      // Show register popup immediately, hide later if already registered
      setShowRegisterPopup(true);

      // Switch to Studionet
      try {
        await selectedProvider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xF22F" }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            await selectedProvider.request({
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

      console.log("[WalletContext] Loading user data after connect...");
      // Check registration in background, hide popup if registered
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

    if (hasMultipleWallets()) {
      setShowWalletSelector(true);
      return false;
    }

    return connectWithProvider(window.ethereum);
  }, [connectWithProvider]);

  const handleWalletSelect = useCallback(async (selectedProvider: any) => {
    setShowWalletSelector(false);
    await connectWithProvider(selectedProvider);
  }, [connectWithProvider]);

  const disconnectWallet = useCallback(() => {
    setAddress(null);
    setProvider(null);
    setUserInfo(null);
    setShowRegisterPopup(false);
  }, []);

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
          setProvider(window.ethereum);
          setLoading(false);
          // Check registration in background
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
    <WalletContext.Provider value={{ address, provider, userInfo, isRegistered, loading, connectWallet, disconnectWallet, refreshUserData }}>
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
