"use client";

import { useState, useEffect } from "react";
import { getClient, getContractAddress } from "@/lib/genlayer-client";
import { Trophy, Medal, Award, Crown, Loader2 } from "lucide-react";

interface LeaderboardEntry {
  name: string;
  winnings: string;
  accuracy: string;
  address: string;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  async function loadLeaderboard() {
    try {
      const client = getClient();
      const contractAddress = getContractAddress();

      if (!contractAddress) {
        setLoading(false);
        return;
      }

      const result = await client.readContract({
        address: contractAddress as `0x${string}`,
        functionName: "get_leaderboard",
        args: [],
      });

      if (typeof result === "string") {
        setEntries(JSON.parse(result));
      }
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatGEN(wei: string) {
    return (parseInt(wei) / 10 ** 18).toFixed(2);
  }

  function getMedalIcon(index: number) {
    switch (index) {
      case 0:
        return <Crown className="w-6 h-6 text-amber-400" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 2:
        return <Award className="w-6 h-6 text-amber-700" />;
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold text-sm">
            {index + 1}
          </span>
        );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-gray-300">Top Predictors</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          <span className="gradient-text">Leaderboard</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Ranked by total winnings. Prove your prediction skills.
        </p>
      </div>

      {/* Leaderboard */}
      {entries.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            No Entries Yet
          </h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Place bets and win to appear on the leaderboard. Be the first!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top 3 Podium */}
          {entries.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 md:gap-6 mb-12">
              {/* 2nd Place */}
              <div className="glass-card rounded-2xl p-6 md:p-8 text-center order-2 md:order-1 group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Medal className="w-8 h-8 text-white" />
                </div>
                <div className="text-xl font-bold text-white mb-1">
                  {entries[1].name}
                </div>
                <div className="text-lg text-gray-300 font-semibold">
                  {formatGEN(entries[1].winnings)} GEN
                </div>
                <div className="text-xs text-gray-500 mt-2 font-mono">
                  {entries[1].address}
                </div>
              </div>

              {/* 1st Place */}
              <div className="glass-card rounded-2xl p-6 md:p-8 text-center order-1 md:order-2 border-amber-400/30 border-2 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-400/10 to-transparent" />
                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/30">
                    <Crown className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {entries[0].name}
                  </div>
                  <div className="text-xl text-amber-400 font-bold">
                    {formatGEN(entries[0].winnings)} GEN
                  </div>
                  <div className="text-xs text-gray-500 mt-2 font-mono">
                    {entries[0].address}
                  </div>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="glass-card rounded-2xl p-6 md:p-8 text-center order-3 group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-700 to-amber-800 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div className="text-xl font-bold text-white mb-1">
                  {entries[2].name}
                </div>
                <div className="text-lg text-gray-300 font-semibold">
                  {formatGEN(entries[2].winnings)} GEN
                </div>
                <div className="text-xs text-gray-500 mt-2 font-mono">
                  {entries[2].address}
                </div>
              </div>
            </div>
          )}

          {/* Full List */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-5 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="text-left py-5 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Predictor
                  </th>
                  <th className="text-right py-5 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Winnings
                  </th>
                  <th className="text-right py-5 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Accuracy
                  </th>
                  <th className="text-right py-5 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                    Address
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr
                    key={index}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                  >
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        {getMedalIcon(index)}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <span className="font-semibold text-white">
                        {entry.name}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-right">
                      <span className="text-teal-400 font-bold">
                        {formatGEN(entry.winnings)} GEN
                      </span>
                    </td>
                    <td className="py-5 px-6 text-right">
                      <span className="text-gray-300 font-medium">
                        {parseInt(entry.accuracy)}%
                      </span>
                    </td>
                    <td className="py-5 px-6 text-right hidden md:table-cell">
                      <span className="text-gray-500 text-sm font-mono">
                        {entry.address}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
