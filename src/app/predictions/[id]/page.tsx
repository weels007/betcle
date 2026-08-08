"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getClient, getContractAddress } from "@/lib/genlayer-client";
import { useWallet } from "@/lib/WalletContext";
import { toast } from "sonner";
import {
  ArrowLeft,
  Clock,
  Users,
  Coins,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Brain,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface Prediction {
  id: string;
  question: string;
  category: string;
  resolution_url: string;
  deadline: string;
  creator: string;
  resolved: boolean;
  status: string;
  result: string;
  analysis: string;
  total_yes: string;
  total_no: string;
  total_bets: string;
}

interface UserBet {
  id: string;
  prediction_id: string;
  amount: string;
  choice: string;
  claimed: boolean;
}

export default function PredictionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const { address, provider, connectWallet } = useWallet();
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [betAmount, setBetAmount] = useState("");
  const [betChoice, setBetChoice] = useState<"yes" | "no">("yes");
  const [isBetting, setIsBetting] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [consensusStatus, setConsensusStatus] = useState("");

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadPrediction();
    if (address) {
      checkUserBet();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [id, address]);

  async function checkUserBet() {
    if (!address || !id) return;

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
        const allBets: UserBet[] = JSON.parse(betsResult);
        // Aggregate ALL of this user's bets on this prediction — a user can
        // hold multiple bets (including on both sides), and every contract-
        // valid winning claim must be surfaced.
        const myBets = allBets.filter((bet) => bet.prediction_id === id);
        if (mountedRef.current) setUserBets(myBets);
      }
    } catch (error) {
      console.error("Failed to check user bet:", error);
    }
  }

  async function fetchPrediction(): Promise<Prediction | null> {
    try {
      const contractAddress = getContractAddress();
      if (!contractAddress) return null;

      const client = getClient();
      const result = await client.readContract({
        address: contractAddress as `0x${string}`,
        functionName: "get_prediction",
        args: [id],
      });

      if (typeof result === "string") {
        return JSON.parse(result);
      }
      if (typeof result === "object" && result !== null) {
        return result as unknown as Prediction;
      }
      return null;
    } catch (error) {
      console.error("Failed to load prediction:", error);
      return null;
    }
  }

  async function loadPrediction() {
    const pred = await fetchPrediction();
    if (mountedRef.current) {
      if (pred) setPrediction(pred);
      setLoading(false);
    }
  }

  async function placeBet() {
    if (!betAmount || parseFloat(betAmount) <= 0) {
      toast.error("Please enter a valid bet amount");
      return;
    }

    // Auto-connect wallet if not connected
    if (!address) {
      toast.info("Connecting wallet...");
      const connected = await connectWallet();
      if (!connected) return;
    }

    setIsBetting(true);
    try {
      const client = getClient(address as `0x${string}`, provider);
      const contractAddress = getContractAddress();

      const txHash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: "place_bet",
        args: [id, betChoice],
        value: BigInt(Math.floor(parseFloat(betAmount) * 10 ** 18)),
      });

      toast.success("Bet placed! Waiting for confirmation...");

      await client.waitForTransactionReceipt({
        hash: txHash,
      });

      toast.success("Bet placed successfully!");
      setBetAmount("");
      loadPrediction();
    } catch (error: any) {
      console.error("Failed to place bet:", error);
      toast.error(error.message || "Failed to place bet");
    } finally {
      setIsBetting(false);
    }
  }

  async function resolvePrediction() {
    // Auto-connect wallet if not connected
    if (!address) {
      toast.info("Connecting wallet...");
      const connected = await connectWallet();
      if (!connected) return;
    }

    setIsResolving(true);
    setConsensusStatus("Submitting resolution transaction...");
    try {
      const client = getClient(address as `0x${string}`, provider);
      const contractAddress = getContractAddress();

      const txHash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: "resolve_prediction",
        args: [id],
        value: BigInt(0),
      });

      toast.success("Resolution submitted! AI validators are analyzing...");
      setConsensusStatus("Waiting for AI consensus...");

      // AI consensus (web fetch + LLM + validator agreement) can take a
      // while, so poll the contract until the prediction is settled.
      const maxAttempts = 36; // ~3 minutes at 5s intervals
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        if (!mountedRef.current) return;

        const pred = await fetchPrediction();
        if (mountedRef.current && pred) setPrediction(pred);
        if (pred?.resolved) {
          if (pred.result === "inconclusive") {
            toast.info("Resolution inconclusive — all stakes are refundable.");
          } else {
            toast.success(`Prediction resolved: ${pred.result.toUpperCase()}!`);
          }
          return;
        }
      }

      toast.warning(
        "Consensus is still in progress. Please wait a moment and refresh."
      );
    } catch (error: any) {
      console.error("Failed to resolve:", error);
      toast.error(error.message || "Failed to resolve prediction");
    } finally {
      setIsResolving(false);
      setConsensusStatus("");
    }
  }

  async function claimRewards() {
    // Auto-connect wallet if not connected
    if (!address) {
      toast.info("Connecting wallet...");
      const connected = await connectWallet();
      if (!connected) return;
    }

    setIsClaiming(true);
    try {
      const client = getClient(address as `0x${string}`, provider);
      const contractAddress = getContractAddress();

      const txHash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: "claim_rewards",
        args: [id],
        value: BigInt(0),
      });

      toast.success("Claim transaction submitted...");

      // Only treat the claim as successful once the receipt is confirmed.
      // If confirmation throws, keep the action pending/failed and let the
      // on-chain state decide — never mark it successful blindly.
      try {
        await client.waitForTransactionReceipt({
          hash: txHash,
        });
      } catch (e) {
        console.error("Receipt wait failed for claim:", e);
        toast.error(
          "Could not confirm the claim. If it succeeded in your wallet, refresh to update."
        );
        await checkUserBet();
        return;
      }

      // Success: refresh the real on-chain state (all winning bets claimed).
      await checkUserBet();
      await loadPrediction();
      toast.success("Rewards claimed!");
    } catch (error: any) {
      console.error("Failed to claim:", error);
      toast.error(error.message || "Failed to claim rewards");
    } finally {
      setIsClaiming(false);
    }
  }

  async function refundBets() {
    // Auto-connect wallet if not connected
    if (!address) {
      toast.info("Connecting wallet...");
      const connected = await connectWallet();
      if (!connected) return;
    }

    setIsRefunding(true);
    try {
      const client = getClient(address as `0x${string}`, provider);
      const contractAddress = getContractAddress();

      const txHash = await client.writeContract({
        address: contractAddress as `0x${string}`,
        functionName: "refund_bets",
        args: [id],
        value: BigInt(0),
      });

      toast.success("Refund transaction submitted...");

      // Only treat the refund as successful once the receipt is confirmed.
      try {
        await client.waitForTransactionReceipt({
          hash: txHash,
        });
      } catch (e) {
        console.error("Receipt wait failed for refund:", e);
        toast.error(
          "Could not confirm the refund. If it succeeded in your wallet, refresh to update."
        );
        await checkUserBet();
        return;
      }

      // Success: refresh the real on-chain state (all bets refunded).
      await checkUserBet();
      await loadPrediction();
      toast.success("Stake refunded!");
    } catch (error: any) {
      console.error("Failed to refund:", error);
      toast.error(error.message || "Failed to refund stake");
    } finally {
      setIsRefunding(false);
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

  if (!prediction) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="glass-card rounded-3xl p-16 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Prediction Not Found</h2>
          <Link href="/predictions" className="btn-primary inline-flex items-center gap-2 mt-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Predictions
          </Link>
        </div>
      </div>
    );
  }

  const totalYes = parseInt(prediction.total_yes);
  const totalNo = parseInt(prediction.total_no);
  const total = totalYes + totalNo;
  const yesPercent = total > 0 ? (totalYes / total) * 100 : 50;
  const deadlinePassed = isDeadlinePassed(prediction.deadline);

  // Aggregate ALL of the connected user's bets on this prediction so that
  // every contract-valid winning claim is surfaced (a user can hold
  // multiple bets, including on both sides).
  const hasBet = userBets.length > 0;
  const unclaimedBets = userBets.filter((bet) => !bet.claimed);
  const hasUnclaimed = unclaimedBets.length > 0;
  const unclaimedWinning = unclaimedBets.filter(
    (bet) => prediction.resolved && bet.choice === prediction.result
  );
  const hasUnclaimedWinning = unclaimedWinning.length > 0;
  const hasWinningSideBet = userBets.some(
    (bet) => prediction.resolved && bet.choice === prediction.result
  );
  const unclaimedWinningCount = unclaimedWinning.length;
  const totalStakeWei = userBets.reduce(
    (sum, bet) => sum + parseInt(bet.amount || "0"),
    0
  );
  const yesStakeWei = userBets
    .filter((bet) => bet.choice === "yes")
    .reduce((sum, bet) => sum + parseInt(bet.amount || "0"), 0);
  const noStakeWei = userBets
    .filter((bet) => bet.choice === "no")
    .reduce((sum, bet) => sum + parseInt(bet.amount || "0"), 0);

  return (
    <div className="max-w-4xl mx-auto py-12">

      {/* Back Button */}
      <Link
        href="/predictions"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Predictions
      </Link>

      {/* Prediction Card */}
      <div className="glass-card rounded-3xl p-8 md:p-10 mb-8">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/20">
            {prediction.category}
          </span>
          {prediction.resolved && prediction.result === "inconclusive" ? (
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-500/20 text-gray-300">
              INCONCLUSIVE
            </span>
          ) : prediction.resolved ? (
            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              prediction.result === "yes"
                ? "bg-green-500/20 text-green-300"
                : "bg-red-500/20 text-red-300"
            }`}>
              {prediction.result === "yes" ? "YES" : "NO"} WINS
            </span>
          ) : deadlinePassed ? (
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300">
              Pending Resolution
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300">
              Active
            </span>
          )}
        </div>

        {/* Question */}
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-relaxed">
          {prediction.question}
        </h1>

        {/* Odds Display */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-center flex-1">
              <p className="text-3xl font-bold text-green-400">{yesPercent.toFixed(0)}%</p>
              <p className="text-sm text-gray-400">YES</p>
              <p className="text-xs text-gray-500">{formatGEN(prediction.total_yes)} GEN</p>
            </div>
            <div className="text-gray-500 text-lg font-bold">VS</div>
            <div className="text-center flex-1">
              <p className="text-3xl font-bold text-red-400">{(100 - yesPercent).toFixed(0)}%</p>
              <p className="text-sm text-gray-400">NO</p>
              <p className="text-xs text-gray-500">{formatGEN(prediction.total_no)} GEN</p>
            </div>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden flex">
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

        {/* Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass rounded-xl p-4 text-center">
            <Clock className="w-5 h-5 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Deadline</p>
            <p className="text-sm text-white font-medium">{formatDeadline(prediction.deadline)}</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <Users className="w-5 h-5 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Total Bets</p>
            <p className="text-sm text-white font-medium">{formatGEN(prediction.total_bets)} GEN</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <Coins className="w-5 h-5 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Total Pool</p>
            <p className="text-sm text-white font-medium">{formatGEN(String(total))} GEN</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <ExternalLink className="w-5 h-5 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Resolution Source</p>
            <a
              href={prediction.resolution_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-teal-400 hover:text-teal-300 truncate block"
            >
              {new URL(prediction.resolution_url).hostname}
            </a>
          </div>
        </div>

        {/* Analysis */}
        {prediction.resolved && prediction.analysis && (
          <div className="glass rounded-2xl p-6 mb-6 border-amber-500/30 border">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-amber-400" />
              <h3 className="text-lg font-bold text-white">AI Analysis</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">{prediction.analysis}</p>
          </div>
        )}
      </div>

      {/* Action Panel */}
      {!prediction.resolved &&
        !deadlinePassed &&
        address?.toLowerCase() === prediction.creator && (
          <div className="glass-card rounded-3xl p-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">
                You Created This Prediction
              </h2>
              <p className="text-gray-400">
                The creator controls the resolution source, so the contract
                prevents you from betting on your own prediction.
              </p>
            </div>
          </div>
        )}

      {/* Action Panel */}
      {!prediction.resolved &&
        !deadlinePassed &&
        address?.toLowerCase() !== prediction.creator && (
        <div className="glass-card rounded-3xl p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-400" />
            Place Your Bet
          </h2>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setBetChoice("yes")}
              disabled={isBetting}
              className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                betChoice === "yes"
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5"
              } ${isBetting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              YES
            </button>
            <button
              onClick={() => setBetChoice("no")}
              disabled={isBetting}
              className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                betChoice === "no"
                  ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5"
              } ${isBetting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              NO
            </button>
          </div>

          <div className="flex gap-4">
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="Amount in GEN"
              className="input-field flex-1 text-lg"
              step="0.01"
              min="0"
            />
            <button
              onClick={placeBet}
              disabled={isBetting}
              className="btn-primary px-8"
            >
              {isBetting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Place Bet"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Resolve Button (for any user after deadline) */}
      {!prediction.resolved && deadlinePassed && (
        <div className="glass-card rounded-3xl p-8">
          <div className="text-center">
            <Clock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Resolution Pending</h2>
            <p className="text-gray-400 mb-6">
              This prediction has passed its deadline and is waiting to be resolved.
            </p>
            <button
              onClick={resolvePrediction}
              disabled={isResolving}
              className="btn-accent"
            >
              {isResolving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Resolving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Resolve with AI
                </span>
              )}
            </button>
            {isResolving && consensusStatus && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-amber-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{consensusStatus}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inconclusive - Refund Button */}
      {prediction.resolved &&
        prediction.result === "inconclusive" &&
        hasBet &&
        hasUnclaimed && (
          <div className="glass-card rounded-3xl p-8 border border-gray-500/20">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">
                Inconclusive Resolution
              </h2>
              <p className="text-gray-400 mb-6">
                AI validators could not determine a definitive outcome, so all
                of your{" "}
                <span className="font-bold text-white">
                  {formatGEN(String(totalStakeWei))} GEN
                </span>{" "}
                is refundable in full.
                {yesStakeWei > 0 && ` (YES: ${formatGEN(String(yesStakeWei))})`}
                {noStakeWei > 0 && ` (NO: ${formatGEN(String(noStakeWei))})`}
              </p>
              <button
                onClick={refundBets}
                disabled={isRefunding}
                className="btn-accent"
              >
                {isRefunding ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Refunding...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Coins className="w-5 h-5" />
                    Refund My Stake
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

      {/* Inconclusive - Already Refunded */}
      {prediction.resolved &&
        prediction.result === "inconclusive" &&
        hasBet &&
        !hasUnclaimed && (
          <div className="glass-card rounded-3xl p-8">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-teal-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Stake Refunded</h2>
              <p className="text-gray-400">
                Your stake was refunded for this inconclusive prediction.
              </p>
            </div>
          </div>
        )}

      {/* Claim Button - shows while any winning bet remains unclaimed */}
      {prediction.resolved &&
        prediction.result !== "inconclusive" &&
        hasBet &&
        hasUnclaimedWinning && (
          <div className="glass-card rounded-3xl p-8">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Resolved: {prediction.result.toUpperCase()}</h2>
              <p className="text-gray-400 mb-6">
                You have{" "}
                <span className="font-bold text-green-400">
                  {unclaimedWinningCount}{" "}
                  {unclaimedWinningCount === 1 ? "winning bet" : "winning bets"}
                </span>{" "}
                still unclaimed
                {yesStakeWei > 0 && ` (YES: ${formatGEN(String(yesStakeWei))} GEN)`}
                {noStakeWei > 0 && ` (NO: ${formatGEN(String(noStakeWei))} GEN)`}.
              </p>
              <button
                onClick={claimRewards}
                disabled={isClaiming}
                className="btn-primary"
              >
                {isClaiming ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Claiming...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Coins className="w-5 h-5" />
                    Claim Rewards
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

      {/* Resolved - no more winning claims available */}
      {prediction.resolved &&
        prediction.result !== "inconclusive" &&
        hasBet &&
        !hasUnclaimedWinning && (
          <div className="glass-card rounded-3xl p-8">
            <div className="text-center">
              {hasWinningSideBet ? (
                <>
                  <CheckCircle className="w-12 h-12 text-teal-400 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-white mb-2">
                    Rewards Claimed!
                  </h2>
                  <p className="text-gray-400">
                    You claimed your rewards for this prediction.
                  </p>
                </>
              ) : (
                <>
                  <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-white mb-2">
                    Resolved: {prediction.result.toUpperCase()}
                  </h2>
                  <p className="text-gray-400">
                    You bet on the losing side — no rewards to claim.
                  </p>
                </>
              )}
            </div>
          </div>
        )}

      {/* No Bet Placed */}
      {prediction.resolved && !hasBet && (
        <div className="glass-card rounded-3xl p-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              {prediction.result === "inconclusive"
                ? "Inconclusive Resolution"
                : `Resolved: ${prediction.result.toUpperCase()}`}
            </h2>
            <p className="text-gray-400">
              You didn't place a bet on this prediction.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
