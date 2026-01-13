'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWeb3 } from '../../contexts/Web3Context';

export default function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { account, isConnected, connectWallet, disconnectWallet } = useWeb3();

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Marketplace', href: '/marketplace' },
    { name: 'AMM', href: '/trade/amm' },
    { name: 'Green Credits', href: '/green-credits' },
    { name: 'Onboarding', href: '/onboarding' },
    { name: 'Verification', href: '/verification' }
  ];

  const isActive = (href) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <nav className="fixed top-0 z-50 w-full border-b border-gray-800 bg-[#0b0f14]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Brand */}
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight text-gray-100"
          >
            Green<span className="text-emerald-400">Xchange</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-base font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-emerald-400'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {item.name}
              </Link>
            ))}

            {/* Wallet */}
            {isConnected ? (
              <div className="flex items-center space-x-4">
                <div className="px-4 py-2 rounded-md bg-gray-900 border border-gray-700 text-sm font-mono text-gray-300">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </div>
                <button
                  onClick={disconnectWallet}
                  className="text-base text-gray-400 hover:text-gray-200 transition"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="px-5 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-base font-medium text-white transition"
              >
                Connect Wallet
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-gray-300 text-base"
          >
            Menu
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-800 bg-[#0b0f14]">
            <div className="px-6 py-5 space-y-5">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block text-base font-medium ${
                    isActive(item.href)
                      ? 'text-emerald-400'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              <div className="pt-5 border-t border-gray-800">
                {isConnected ? (
                  <button
                    onClick={() => {
                      disconnectWallet();
                      setMobileOpen(false);
                    }}
                    className="w-full text-left text-base text-gray-400 hover:text-gray-200"
                  >
                    Disconnect Wallet
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      connectWallet();
                      setMobileOpen(false);
                    }}
                    className="w-full px-5 py-3 rounded-md bg-emerald-600 text-white text-base font-medium"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-16" />
    </>
  );
}
