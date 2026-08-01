"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getClient, getContractAddress } from "@/lib/genlayer-client";
import Link from "next/link";
import {
  Search,
  Clock,
  Users,
  Coins,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Plus,
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

function PredictionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get("category");

  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    categoryFilter || "all"
  );

  const categories = [
    "all",
    "crypto",
    "sports",
    "politics",
    "entertainment",
    "tech",
    "science",
    "other",
  ];

  useEffect(() => {
    loadPredictions();
  }, []);

  async function loadPredictions() {
    try {
      const contractAddress = getContractAddress();

      if (!contractAddress) {
        setLoading(false);
        return;
      }

      const client = getClient();
      const totalResult = await client.readContract({
        address: contractAddress as `0x${string}`,
        functionName: "get_total_predictions",
        args: [],
      });

      const total = typeof totalResult === "bigint"
        ? Number(totalResult)
        : parseInt(totalResult as string);

      console.log("Total predictions on-chain:", total);

      const loaded: Prediction[] = [];

      for (let i = 0; i < total; i++) {
        try {
          const result = await client.readContract({
            address: contractAddress as `0x${string}`,
            functionName: "get_prediction",
            args: [String(i)],
          });

          if (typeof result === "string") {
            loaded.push(JSON.parse(result));
          } else if (typeof result === "object" && result !== null) {
            loaded.push(result as unknown as Prediction);
          }
        } catch (e) {
          console.error(`Failed to load prediction ${i}:`, e);
        }
      }

      console.log("Loaded predictions:", loaded.length);
      setPredictions(loaded.reverse());
    } catch (error) {
      console.error("Failed to load predictions:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatDeadline(timestamp: string) {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString();
  }

  function formatGEN(wei: string) {
    return (parseInt(wei) / 10 ** 18).toFixed(2);
  }

  function isDeadlinePassed(timestamp: string) {
    return Date.now() / 1000 > parseInt(timestamp);
  }

  const filteredPredictions = predictions.filter((p) => {
    const matchesSearch =
      p.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span className="text-sm text-gray-300">
              {categoryFilter
                ? `${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)}`
                : "All"}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            {categoryFilter
              ? `${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)} Predictions`
              : "All Predictions"}
          </h1>
        </div>
        <Link href="/create" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Prediction
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-6 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search predictions..."
            className="input-field pl-12"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                selectedCategory === cat
                  ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Predictions Grid */}
      {filteredPredictions.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-teal-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            No Predictions Found
          </h2>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            {predictions.length === 0
              ? "Be the first to create a prediction!"
              : "Try adjusting your filters"}
          </p>
          {predictions.length === 0 && (
            <Link href="/create" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create First Prediction
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPredictions.map((pred) => {
            const totalYes = parseInt(pred.total_yes);
            const totalNo = parseInt(pred.total_no);
            const total = totalYes + totalNo;
            const yesPercent = total > 0 ? (totalYes / total) * 100 : 50;
            const deadlinePassed = isDeadlinePassed(pred.deadline);

            return (
              <Link
                key={pred.id}
                href={`/predictions/${pred.id}`}
                className="glass-card rounded-2xl p-6 group"
              >
                <div className="space-y-4">
                  {/* Category & Status */}
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/20">
                      {pred.category}
                    </span>
                    <div className="flex items-center gap-2">
                      {pred.resolved ? (
                        pred.result === "yes" ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )
                      ) : deadlinePassed ? (
                        <Clock className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="text-xs text-gray-400 font-medium">
                        {pred.resolved
                          ? pred.result.toUpperCase()
                          : deadlinePassed
                            ? "Pending"
                            : "Active"}
                      </span>
                    </div>
                  </div>

                  {/* Question */}
                  <h3 className="text-lg font-bold text-white line-clamp-2 group-hover:text-teal-400 transition-colors leading-relaxed">
                    {pred.question}
                  </h3>

                  {/* Odds Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>YES {yesPercent.toFixed(0)}%</span>
                      <span>NO {(100 - yesPercent).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${yesPercent}%` }}
                      />
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-rose-500 transition-all duration-500"
                        style={{ width: `${100 - yesPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-white/5">
                    <span className="flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5" />
                      {formatGEN(pred.total_bets)} GEN
                    </span>
                    <span>{formatDeadline(pred.deadline)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PredictionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        </div>
      }
    >
      <PredictionsContent />
    </Suspense>
  );
}
