import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

const RPC = "https://studio.genlayer.com/api";
const STUDIONET_HEX = "0xf22f"; // 61999

let clientInstance: ReturnType<typeof createClient> | null = null;

export function getClient(address?: `0x${string}`, provider?: any) {
  if (!address && clientInstance) {
    return clientInstance;
  }

  // Wrap provider to force legacy gasPrice=0 for zero-fee network
  const wrappedProvider = provider ? wrapProvider(provider) : undefined;

  clientInstance = createClient({
    chain: studionet,
    account: address,
    ...(wrappedProvider && { provider: wrappedProvider }),
  });

  return clientInstance;
}

function wrapProvider(provider: any) {
  if (!provider || provider.__glPatched) return provider;
  const orig = provider.request.bind(provider);
  provider.request = async (req: any) => {
    if (req?.method === "eth_sendTransaction" && Array.isArray(req.params) && req.params[0]) {
      const tx = { ...req.params[0] };
      tx.type = "0x0";
      tx.gasPrice = "0x0";
      delete tx.maxFeePerGas;
      delete tx.maxPriorityFeePerGas;
      if (!tx.gas) tx.gas = "0x100000";
      return orig({ method: "eth_sendTransaction", params: [tx] });
    }
    return orig(req);
  };
  provider.__glPatched = true;
  return provider;
}

export function getContractAddress() {
  return CONTRACT_ADDRESS;
}

export const CHAIN_CONFIG = {
  chainId: 61999,
  name: "Studionet",
  rpcUrl: RPC,
  currency: "GEN",
  explorerUrl: "https://explorer-studio.genlayer.com",
};
