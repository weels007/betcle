"use client";

import { useState } from "react";
import { getClient, getContractAddress } from "@/lib/genlayer-client";
import { Toaster, toast } from "sonner";
import { User, X, Loader2, Sparkles } from "lucide-react";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface RegisterPopupProps {
  address: string;
  onRegistered: () => void;
  onClose: () => void;
}

export function RegisterPopup({ address, onRegistered, onClose }: RegisterPopupProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerName, setRegisterName] = useState("");

  async function register() {
    if (!registerName.trim()) {
      toast.error("Please enter a name");
      return;
    }

    setIsRegistering(true);
    try {
      // Request accounts first to ensure wallet is connected
      if (window.ethereum) {
        await window.ethereum.request({ method: "eth_requestAccounts" });
      }

      const client = getClient(address as `0x${string}`);
      const contractAddress = getContractAddress();

      const txHash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: "register",
        args: [registerName],
        value: BigInt(0),
      });

      toast.success("Registering...");

      await client.waitForTransactionReceipt({
        hash: txHash,
      });

      toast.success("Registered successfully!");
      onRegistered();
    } catch (error: any) {
      console.error("Failed to register:", error);
      // Show more helpful error message
      if (error.message?.includes("not been authorized")) {
        toast.error("Transaction rejected. Please approve in your wallet.");
      } else {
        toast.error(error.message || "Failed to register");
      }
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative glass-card rounded-3xl p-8 max-w-md w-full animate-fade-in-up">
        <Toaster position="top-right" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-teal-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">
            Welcome to <span className="gradient-text">Betcle</span>!
          </h2>
          
          <p className="text-gray-400 mb-6">
            Create a username to start predicting and earning rewards
          </p>

          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
              placeholder="Enter your username"
              className="input-field flex-1"
              onKeyDown={(e) => e.key === "Enter" && register()}
            />
          </div>

          <button
            onClick={register}
            disabled={isRegistering || !registerName.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isRegistering ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Register Now
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 mt-4">
            Connected: {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        </div>
      </div>
    </div>
  );
}
