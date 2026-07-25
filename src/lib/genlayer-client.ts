import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

let clientInstance: ReturnType<typeof createClient> | null = null;

export function getClient(address?: `0x${string}`) {
  if (clientInstance && !address) {
    return clientInstance;
  }

  clientInstance = createClient({
    chain: studionet,
    account: address,
  });

  return clientInstance;
}

export function getContractAddress() {
  return CONTRACT_ADDRESS;
}

export const CHAIN_CONFIG = {
  chainId: 61999,
  name: "Studionet",
  rpcUrl: "https://studio.genlayer.com/api",
  currency: "GEN",
  explorerUrl: "https://explorer-studio.genlayer.com",
};

export async function ensureCorrectChain() {
  if (typeof window === "undefined" || !window.ethereum) return;

  try {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    const currentChainId = parseInt(chainId, 16);

    if (currentChainId !== CHAIN_CONFIG.chainId) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${CHAIN_CONFIG.chainId.toString(16)}` }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${CHAIN_CONFIG.chainId.toString(16)}`,
                  chainName: "Studionet",
                  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
                  rpcUrls: [CHAIN_CONFIG.rpcUrl],
                  blockExplorerUrls: [CHAIN_CONFIG.explorerUrl],
                },
              ],
            });
          } catch (addError: any) {
            console.log("Network exists or wallet doesn't support adding chains");
          }
        } else {
          console.log("Chain switch cancelled or failed");
        }
      }
    }
  } catch (error) {
    console.error("Error checking chain:", error);
  }
}
