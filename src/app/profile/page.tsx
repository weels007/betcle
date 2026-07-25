"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getClient, getContractAddress } from "@/lib/genlayer-client";
import { useWallet } from "@/lib/WalletContext";
import { Toaster, toast } from "sonner";
import {
  User,
  Wallet,
  TrendingUp,
  Target,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Sparkles,
  Coins,
  BarChart3,
} from "lucide-react";

interface UserBet {
  id: string;
  prediction_id: string;
  amount: string;
  choice: string;
  claimed: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const { address, provider, userInfo, isRegistered, loading, connectWallet, refreshUserData } = useWallet();
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  useEffect(() => {
    if (address) {
      loadUserBets();
    }
  }, [address]);

  async function loadUserBets() {
    if (!address) return;

    try {
      const client = getClient();
      const contractAddress = getContractAddress();

      if (!contractAddress) return;

      const betsResult = await client.readContract({
        address: contractAddress as `0x${string}`,
        functionName: "get_user_bets",
        args: [address],
      });

      if (typeof betsResult === "string" && betsResult !== "") {
        setUserBets(JSON.parse(betsResult));
      }
    } catch (error) {
      console.error("Failed to load bets:", error);
    }
  }

  async function withdraw() {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!address) {
      toast.info("Connecting wallet...");
      const connected = await connectWallet();
      if (!connected) return;
    }

    setIsWithdrawing(true);
    try {
      const client = getClient(address as `0x${string}`, provider);
      const contractAddress = getContractAddress();

      const txHash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: "withdraw",
        args: [BigInt(Math.floor(parseFloat(withdrawAmount) * 10 ** 18))],
        value: BigInt(0),
      });

      toast.success("Withdrawing...");

      await client.waitForTransactionReceipt({
        hash: txHash,
      });

      toast.success("Withdrawal successful!");
      setWithdrawAmount("");
      refreshUserData();
      loadUserBets();
    } catch (error: any) {
      console.error("Failed to withdraw:", error);
      toast.error(error.message || "Failed to withdraw");
    } finally {
      setIsWithdrawing(false);
    }
  }

  function formatGEN(wei: string) {
    return (parseInt(wei) / 10 ** 18).toFixed(4);
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  // Not connected
  if (!address) {
    return (
      <div className="max-w-2xl mx-auto py-20">
        <div className="glass-card rounded-3xl p-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-10 h-10 text-teal-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Connect Your Wallet
          </h2>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            Connect your wallet to view your profile, place bets, and withdraw rewards
          </p>
          <button onClick={connectWallet} className="btn-primary">
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Main profile view
  return (
    <div className="max-w-6xl mx-auto py-12">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span className="text-sm text-gray-300">Profile</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          My <span className="gradient-text">Profile</span>
        </h1>
        <p className="text-gray-400 text-lg">
          {isRegistered && userInfo ? (
            <>Welcome back, <span className="text-teal-400 font-semibold">{userInfo.name}</span></>
          ) : (
            <>Connected: <span className="text-teal-400 font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span></>
          )}
        </p>
      </div>

      {/* Stats Grid */}
      {isRegistered && userInfo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="glass-card rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center mb-4">
              <Coins className="w-6 h-6 text-teal-400" />
            </div>
            <p className="text-2xl font-bold text-white">{formatGEN(userInfo.balance)}</p>
            <p className="text-sm text-gray-400">Balance (GEN)</p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-400">{formatGEN(userInfo.total_won)}</p>
            <p className="text-sm text-gray-400">Total Won</p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mb-4">
              <ArrowDownRight className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-400">{formatGEN(userInfo.total_lost)}</p>
            <p className="text-sm text-gray-400">Total Lost</p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-white">{parseInt(userInfo.total_bets)}</p>
            <p className="text-sm text-gray-400">Total Bets</p>
          </div>
        </div>
      )}

      {/* Withdraw Section */}
      {isRegistered && userInfo && (
        <div className="glass-card rounded-2xl p-6 mb-10">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-teal-400" />
            Withdraw to Wallet
          </h2>
          <div className="flex gap-4">
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Amount in GEN"
              className="input-field flex-1"
              step="0.01"
              min="0"
            />
            <button
              onClick={withdraw}
              disabled={isWithdrawing}
              className="btn-primary px-8"
            >
              {isWithdrawing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Withdraw"
              )}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">Available: {formatGEN(userInfo.balance)} GEN</p>
        </div>
      )}

      {/* Recent Bets */}
      {isRegistered && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-400" />
            Recent Bets
          </h2>

          {userBets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No bets yet. Start predicting!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userBets.slice(0, 10).map((bet) => (
                <div
                  key={bet.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        bet.choice === "yes" ? "bg-green-500/20" : "bg-red-500/20"
                      }`}
                    >
                      {bet.choice === "yes" ? (
                        <ArrowUpRight className="w-6 h-6 text-green-400" />
                      ) : (
                        <ArrowDownRight className="w-6 h-6 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">Bet on {bet.choice.toUpperCase()}</p>
                      <p className="text-sm text-gray-400">Prediction #{bet.prediction_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{formatGEN(bet.amount)} GEN</p>
                    {bet.claimed && <span className="text-xs text-green-400">Claimed</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
