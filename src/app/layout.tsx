import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { WalletProvider } from "@/lib/WalletContext";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Betcle - AI-Powered Prediction Market",
  description:
    "Decentralized prediction market powered by AI consensus on GenLayer. Predict anything, bet with GEN, resolved by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#030712] antialiased">
        {/* Animated Background */}
        <div className="animated-bg" />
        <div className="grid-pattern" />
        
        {/* Floating Particles */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${15 + Math.random() * 10}s`,
              }}
            />
          ))}
        </div>

        <WalletProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                zIndex: 9999,
              },
            }}
          />
          <Header />
          <main className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}
