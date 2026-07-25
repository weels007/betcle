"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getClient, getContractAddress, ensureCorrectChain } from "@/lib/genlayer-client";
import { useWallet } from "@/lib/WalletContext";
import { Toaster, toast } from "sonner";
import { Plus, Link as LinkIcon, Calendar, Tag, Sparkles, ArrowRight, Wallet } from "lucide-react";

const categories = [
  "crypto",
  "sports",
  "politics",
  "entertainment",
  "tech",
  "science",
  "other",
];

export default function CreatePage() {
  const router = useRouter();
  const { address, connectWallet } = useWallet();
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("crypto");
  const [resolutionUrl, setResolutionUrl] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function formatAddress(addr: string) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!question || !resolutionUrl || !deadline) {
      toast.error("Please fill in all fields");
      return;
    }

    // Auto-connect wallet if not connected
    if (!address) {
      toast.info("Connecting wallet...");
      const connected = await connectWallet();
      if (!connected) return;
    }

    setIsSubmitting(true);
    try {
      await ensureCorrectChain();

      const client = getClient(address as `0x${string}`);
      const contractAddress = getContractAddress();

      if (!contractAddress) {
        toast.error("Contract address not configured");
        return;
      }

      const deadlineTimestamp = Math.floor(
        new Date(deadline).getTime() / 1000
      );

      const txHash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: "create_prediction",
        args: [question, category, resolutionUrl, BigInt(deadlineTimestamp)],
        value: BigInt(0),
      });

      toast.success("Transaction sent! Waiting for confirmation...");

      await client.waitForTransactionReceipt({
        hash: txHash,
      });

      toast.success("Prediction created successfully!");
      router.push("/predictions");
    } catch (error: any) {
      console.error("Failed to create prediction:", error);
      toast.error(error.message || "Failed to create prediction");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-12">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span className="text-sm text-gray-300">Create New</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          New <span className="gradient-text">Prediction</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Post a question for others to bet on. The outcome will be resolved by AI validators.
        </p>
      </div>

      {/* Form */}
      <div className="glass-card rounded-3xl p-8 md:p-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Question */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
                <Plus className="w-4 h-4 text-teal-400" />
              </div>
              Question
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Will Bitcoin reach $100k by end of 2026?"
              className="input-field text-lg"
              required
            />
            <p className="text-xs text-gray-500 pl-1">
              A clear, answerable question with a definitive YES/NO answer
            </p>
          </div>

          {/* Category */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Tag className="w-4 h-4 text-cyan-400" />
              </div>
              Category
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    category === cat
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5"
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Resolution URL */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <LinkIcon className="w-4 h-4 text-amber-400" />
              </div>
              Resolution URL
            </label>
            <input
              type="url"
              value={resolutionUrl}
              onChange={(e) => setResolutionUrl(e.target.value)}
              placeholder="https://coingecko.com/en/coins/bitcoin"
              className="input-field text-lg"
              required
            />
            <p className="text-xs text-gray-500 pl-1">
              A reliable source that AI validators will check to determine the outcome
            </p>
          </div>

          {/* Deadline */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-orange-400" />
              </div>
              Deadline
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input-field text-lg"
              required
            />
            <p className="text-xs text-gray-500 pl-1">
              No more bets after this time. Resolution can happen after deadline.
            </p>
          </div>

          {/* Wallet Status */}
          <div className="glass rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                address ? "bg-teal-500/20" : "bg-white/5"
              }`}>
                <Wallet className={`w-5 h-5 ${address ? "text-teal-400" : "text-gray-500"}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {address ? "Wallet Connected" : "Wallet Not Connected"}
                </p>
                {address ? (
                  <p className="text-xs text-gray-400 font-mono">{formatAddress(address)}</p>
                ) : (
                  <p className="text-xs text-gray-500">Click submit to connect automatically</p>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full flex items-center justify-center gap-3 text-lg py-5"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating Prediction...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {!address ? "Connect Wallet & Create" : "Create Prediction"}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
