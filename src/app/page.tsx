"use client";

import Link from "next/link";
import { 
  Brain, Zap, Shield, Globe, TrendingUp, Target, 
  ArrowRight, ChevronRight, Sparkles, Lock, Users,
  BarChart3, Coins, Clock, CheckCircle
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Create",
    description: "Post any YES/NO prediction with a source URL and deadline",
    icon: Target,
    color: "from-teal-500 to-cyan-500",
  },
  {
    number: "02",
    title: "Bet",
    description: "Wager GEN tokens on outcomes you believe in",
    icon: Coins,
    color: "from-cyan-500 to-blue-500",
  },
  {
    number: "03",
    title: "AI Resolves",
    description: "Decentralized AI validators analyze real-world data",
    icon: Brain,
    color: "from-blue-500 to-indigo-500",
  },
  {
    number: "04",
    title: "Win",
    description: "Claim proportional rewards from the winning pool",
    icon: TrendingUp,
    color: "from-amber-500 to-orange-500",
  },
];

const features = [
  {
    icon: Brain,
    title: "AI-Powered Resolution",
    description:
      "No centralized oracles. GenLayer validators use diverse LLMs to analyze web data and reach consensus on outcomes.",
    color: "from-teal-500 to-cyan-500",
  },
  {
    icon: Shield,
    title: "Trustless Consensus",
    description:
      "Optimistic Democracy ensures no single entity controls the outcome. Validators independently verify results.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Globe,
    title: "Any URL, Any Data",
    description:
      "Resolutions can use any public webpage as source. No whitelisted oracles needed.",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: Zap,
    title: "Instant Settlement",
    description:
      "Results are finalized on-chain. Winners claim rewards directly to their wallet.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Lock,
    title: "Non-Deterministic Security",
    description:
      "Each validator runs different LLMs independently. Greyboxing defeats prompt injection attacks.",
    color: "from-teal-500 to-emerald-500",
  },
  {
    icon: Users,
    title: "Community Driven",
    description:
      "Anyone can create predictions. The community decides what matters.",
    color: "from-cyan-500 to-teal-500",
  },
];

const stats = [
  { value: "0", label: "Predictions Created", icon: Target },
  { value: "0", label: "Total Bets Placed", icon: BarChart3 },
  { value: "0", label: "GEN Wagered", icon: Coins },
  { value: "0", label: "Active Predictors", icon: Users },
];

const useCases = [
  {
    category: "Crypto",
    examples: ["Will ETH hit $5k?", "BTC ETF approval?"],
    emoji: "₿",
  },
  {
    category: "Sports",
    examples: ["World Cup winner?", "NBA Finals MVP?"],
    emoji: "⚽",
  },
  {
    category: "Politics",
    examples: ["Election outcomes?", "Policy decisions?"],
    emoji: "🏛️",
  },
  {
    category: "Tech",
    examples: ["AI milestones?", "Product launches?"],
    emoji: "💻",
  },
];

export default function HomePage() {
  return (
    <div className="relative">
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative min-h-[90vh] flex items-center justify-center py-20">
        {/* Hero Orbs */}
        <div className="hero-orb w-[500px] h-[500px] bg-teal-500/30 top-1/4 -left-64" />
        <div className="hero-orb w-[400px] h-[400px] bg-cyan-500/20 top-1/3 right-0" style={{ animationDelay: "2s" }} />
        <div className="hero-orb w-[300px] h-[300px] bg-amber-500/20 bottom-1/4 left-1/4" style={{ animationDelay: "4s" }} />

        <div className="text-center max-w-5xl mx-auto relative z-10">
          {/* Badge */}
          <div className="animate-slide-up inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span className="text-sm text-gray-300">Powered by GenLayer AI Consensus</span>
          </div>

          {/* Title */}
          <h1 className="animate-slide-up text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight">
            <span className="text-white">Predict</span>
            <br />
            <span className="gradient-text">The Future</span>
          </h1>

          {/* Subtitle */}
          <p className="animate-slide-up-delayed text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            The first AI-powered prediction market where{" "}
            <span className="text-white font-semibold">decentralized AI validators</span>{" "}
            resolve outcomes by analyzing real-world data. No oracles. No trust.
            Just code and consensus.
          </p>

          {/* CTA */}
          <div className="animate-slide-up-delayed-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/predictions" className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
              Explore Predictions
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/create" className="btn-secondary flex items-center gap-2 text-lg px-8 py-4">
              Create Prediction
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Stats */}
          <div className="animate-fade-in grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-10 border-t border-white/5">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Icon className="w-5 h-5 text-teal-400" />
                  </div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="section-container">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-gray-300">Simple Process</span>
          </div>
          <h2 className="section-title">
            How <span className="gradient-text">Betcle</span> Works
          </h2>
          <p className="section-subtitle">
            From prediction to payout in four simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Connection Line */}
          <div className="hidden md:block absolute top-24 left-[12.5%] right-[12.5%] h-[2px] bg-gradient-to-r from-teal-500 via-cyan-500 to-amber-500 opacity-30" />
          
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative">
                <div className="feature-card text-center relative z-10">
                  {/* Step Number */}
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-5 text-white font-bold text-lg`}>
                    {step.number}
                  </div>
                  <div className="feature-icon mx-auto bg-gradient-to-br ${step.color}">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ==================== FEATURES ==================== */}
      <section className="section-container">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Shield className="w-4 h-4 text-teal-400" />
            <span className="text-sm text-gray-300">Why Betcle</span>
          </div>
          <h2 className="section-title">
            Built for <span className="gradient-text-alt">Trust</span>
          </h2>
          <p className="section-subtitle">
            Powered by GenLayer&apos;s revolutionary Optimistic Democracy consensus
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="feature-card group">
                <div className={`feature-icon bg-gradient-to-br ${feature.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-teal-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ==================== GENLAYER INTEGRATION ==================== */}
      <section className="section-container">
        <div className="glass-card rounded-3xl p-8 md:p-16 relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full filter blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-[100px]" />
          
          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/20 border border-teal-500/30 mb-6">
                <Brain className="w-4 h-4 text-teal-400" />
                <span className="text-sm text-teal-300">AI-Native Blockchain</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Powered by{" "}
                <span className="gradient-text">GenLayer</span>
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                Betcle runs on GenLayer — the first Intelligent Blockchain where smart contracts can 
                access the internet, call LLMs, and reach consensus on subjective decisions. 
                No centralized oracles needed.
              </p>
              <div className="space-y-4">
                {[
                  "Validators run different AI models independently",
                  "Equivalence Principle ensures fair consensus",
                  "Greyboxing defeats prompt injection attacks",
                  "Results settled on Ethereum L2",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-teal-400 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              {/* Mock Contract Card */}
              <div className="glass-strong rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-teal-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="ml-auto text-xs text-gray-500">betcle.py</span>
                </div>
                <div className="font-mono text-sm space-y-2 text-gray-300">
                  <p><span className="text-amber-400">def</span> <span className="text-teal-400">leader_fn</span>:</p>
                  <p className="pl-4">response = <span className="text-green-400">gl.nondet.web.request</span>(url)</p>
                  <p className="pl-4">result = <span className="text-green-400">gl.nondet.exec_prompt</span>(</p>
                  <p className="pl-8">prompt, <span className="text-cyan-400">response_format</span>=<span className="text-orange-400">&quot;json&quot;</span></p>
                  <p className="pl-4">)</p>
                  <p className="pl-4"><span className="text-amber-400">return</span> result</p>
                  <p className="mt-4"><span className="text-amber-400">def</span> <span className="text-teal-400">validator_fn</span>(leader_result):</p>
                  <p className="pl-4"><span className="text-gray-500"># Independent verification</span></p>
                  <p className="pl-4">validator_data = <span className="text-teal-400">leader_fn</span>()</p>
                  <p className="pl-4"><span className="text-amber-400">return</span> compare(leader_result, validator_data)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== USE CASES ==================== */}
      <section className="section-container">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-gray-300">Endless Possibilities</span>
          </div>
          <h2 className="section-title">
            Predict <span className="gradient-text-alt">Anything</span>
          </h2>
          <p className="section-subtitle">
            From crypto prices to world events, if it has a resolution source, you can bet on it
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {useCases.map((useCase) => (
            <div key={useCase.category} className="feature-card text-center group">
              <div className="text-5xl mb-4">{useCase.emoji}</div>
              <h3 className="text-xl font-bold text-white mb-3">{useCase.category}</h3>
              <ul className="space-y-2">
                {useCase.examples.map((example) => (
                  <li key={example} className="text-gray-400 text-sm">
                    &quot;{example}&quot;
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== CTA SECTION ==================== */}
      <section className="section-container pb-32">
        <div className="relative glass-card rounded-3xl p-12 md:p-20 text-center overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-teal-500/20 to-transparent rounded-full filter blur-[120px]" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Ready to Test Your{" "}
              <span className="gradient-text">Predictions</span>?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              Join the future of prediction markets. Powered by AI. Secured by consensus.
              Built on GenLayer.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/create" className="btn-accent flex items-center gap-2 text-lg px-10 py-5">
                Start Predicting Now
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="border-t border-white/5 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 via-cyan-500 to-amber-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Betcle</span>
          </div>
          <p className="text-gray-500 text-sm">
            Built with AI consensus on GenLayer
          </p>
          <div className="flex items-center gap-6 text-gray-400 text-sm">
            <a href="https://genlayer.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              GenLayer
            </a>
            <a href="https://docs.genlayer.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              Docs
            </a>
            <a href="https://github.com/genlayerlabs" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
