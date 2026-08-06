"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";
import { TrendingUp, Plus, Trophy, User, Menu, X, Wallet, LogOut, Copy, Check } from "lucide-react";
import { useWallet } from "@/lib/WalletContext";

const navItems = [
  { href: "/", label: "Home", icon: TrendingUp },
  { href: "/predictions", label: "Explore", icon: TrendingUp },
  { href: "/create", label: "Create", icon: Plus },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { address, connectWallet, disconnectWallet, loading } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleConnect() {
    setIsConnecting(true);
    await connectWallet();
    setIsConnecting(false);
  }

  async function copyAddress() {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function formatAddress(addr: string) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-white/5">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 via-cyan-500 to-amber-500 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <span className="text-white font-black text-xl">B</span>
              </div>
              <div className="absolute inset-0 w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 via-cyan-500 to-amber-500 blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black gradient-text">Betcle</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                    isActive
                      ? "text-white"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-white/5 rounded-xl border border-white/10" />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Wallet */}
          <div className="flex items-center gap-4">
            {address ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={copyAddress}
                  className="flex items-center gap-2 glass-strong px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white transition-all duration-300 group"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-teal-400" />
                  ) : (
                    <Copy className="w-4 h-4 group-hover:text-teal-400 transition-colors" />
                  )}
                  <span className="hidden sm:inline font-mono">{formatAddress(address)}</span>
                </button>
                <button
                  onClick={disconnectWallet}
                  className="p-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                  title="Disconnect"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isConnecting || loading}
                className="btn-primary flex items-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connecting...
                  </span>
                ) : (
                  "Connect Wallet"
                )}
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-white/5 animate-slide-up">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
