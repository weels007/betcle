"use client";

import { useState, useEffect } from "react";
import { getClient, getContractAddress } from "@/lib/genlayer-client";
import { useWallet } from "@/lib/WalletContext";
import { Toaster, toast } from "sonner";
import {
  Zap,
  Clock,
  Users,
  Coins,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface Prediction {
  id: string;
  question: string;
  category: string;
  resolution_url: string;
  deadline: string;
  creator: string;
  resolved: boolean;
  result: string;
  analysis: string;
  total_yes: string;
  total_no: string;
  total_bets: string;
}

export default function InstantResolvePage() {
  const { address, connectWallet } = useWallet();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    loadPredictions();
  }, []);

  async function loadPredictions() {
    try {
      const client = getClient();
      const contractAddress = getContractAddress();

      if (!contractAddress) {
        setLoading(false);
        return;
      }

      const totalResult = await client.readContract({
        address: contractAddress as `0x${string}`,
        functionName: "get_total_predictions",
        args: [],
      });

      const total = parseInt(totalResult as string);
      const loaded: Prediction[] = [];

      for (let i = 0; i < total; i++) {
        try {
          const result = await client.readContract({
            address: contractAddress as `0x${string}`,
            functionName: "get_prediction",
            args: [String(i)],
          });

          if (typeof result === "string") {
            const pred = JSON.parse(result);
            // Only show unresolved predictions with bets
            if (!pred.resolved && parseInt(pred.total_bets) > 0) {
              loaded.push(pred);
            }
          }
        } catch (e) {
          console.error(`Failed to load prediction ${i}:`, e);
        }
      }

      setPredictions(loaded);
    } catch (error) {
      console.error("Failed to load predictions:", error);
    } finally {
      setLoading(false);
    }
  }

  async function instantResolve(predictionId: string) {
    if (!address) {
      toast.info("Connecting wallet...");
      const connected = await connectWallet();
      if (!connected) return;
    }

    setResolvingId(predictionId);
    try {
      const client = getClient(address as `0x${string}`);
      const contractAddress = getContractAddress();

      toast.info("Resolving prediction with AI...");

      const txHash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: "instant_resolve",
        args: [predictionId],
        value: BigInt(0),
      });

      toast.success("Transaction sent! AI consensus in progress...");

      // Don't wait for receipt - AI consensus can take time
      // Just refresh after a delay
      setTimeout(() => {
        loadPredictions();
      }, 5000);

      toast.success("Prediction resolved! Refreshing...");
      loadPredictions();
    } catch (error: any) {
      console.error("Failed to resolve:", error);
      toast.error(error.message || "Failed to resolve prediction");
    } finally {
      setResolvingId(null);
    }
  }

  function formatGEN(wei: string) {
    return (parseInt(wei) / 10 ** 18).toFixed(2);
  }

  function formatDeadline(timestamp: string) {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString();
  }

  function isDeadlinePassed(timestamp: string) {
    return Date.now() / 1000 > parseInt(timestamp);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-gray-300">Instant Resolve</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          <span className="gradient-text">Instant Resolve</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Resolve predictions immediately using AI consensus. Even before deadline!
        </p>
      </div>

      {/* Predictions List */}
      {predictions.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            All Clear!
          </h2>
          <p className="text-gray-400 max-w-md mx-auto">
            No unresolved predictions with bets. Create some predictions and place bets first!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {predictions.map((pred) => {
            const totalYes = parseInt(pred.total_yes);
            const totalNo = parseInt(pred.total_no);
            const total = totalYes + totalNo;
            const yesPercent = total > 0 ? (totalYes / total) * 100 : 50;
            const deadlinePassed = isDeadlinePassed(pred.deadline);
            const isResolving = resolvingId === pred.id;

            return (
              <div
                key={pred.id}
                className="glass-card rounded-2xl p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/20">
                        {pred.category}
                      </span>
                      {deadlinePassed ? (
                        <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300">
                          Past Deadline
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300">
                          Active
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white mb-3">
                      {pred.question}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        {formatGEN(pred.total_bets)} GEN bet
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {formatDeadline(pred.deadline)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ExternalLink className="w-4 h-4" />
                        {new URL(pred.resolution_url).hostname}
                      </span>
                    </div>

                    {/* Odds */}
                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>YES {yesPercent.toFixed(0)}%</span>
                          <span>NO {(100 - yesPercent).toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                            style={{ width: `${yesPercent}%` }}
                          />
                          <div
                            className="h-full bg-gradient-to-r from-red-500 to-rose-500"
                            style={{ width: `${100 - yesPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resolve Button */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => instantResolve(pred.id)}
                      disabled={isResolving}
                      className={`btn-accent flex items-center gap-2 ${
                        isResolving ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {isResolving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Resolving...
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5" />
                          Instant Resolve
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
