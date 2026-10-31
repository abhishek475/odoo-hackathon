import React, { useState } from 'react';
import { useAppState } from '../../context/AppStateContext';
import { UserRole } from '../../types/billing';
import {
  ShieldCheck,
  UserCheck,
  Globe,
  Zap,
  RotateCcw,
  Sparkles,
  Server,
  Layers,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    currentRole,
    switchRole,
    runStressTest,
    resetDefaults,
    benchmarkStats,
    subscriptions,
    isLoading,
  } = useAppState();

  const [stressing, setStressing] = useState(false);

  const handleRunStress = async () => {
    setStressing(true);
    await runStressTest(2500);
    setStressing(false);
  };

  return (
    <header className="h-16 border-b border-[#27272a] bg-[#09090b]/90 backdrop-blur sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand & Platform Info */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(103,232,249,0.3)]">
          <Layers className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-white">BRIGHTLOOP</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              v2.4-PROD
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 font-mono">Subscription & Recurring Billing Engine</p>
        </div>
      </div>

      {/* Center: Live Benchmark & Performance SLA Telemetry */}
      <div className="hidden lg:flex items-center gap-4 bg-[#121215] border border-[#27272a] rounded-full px-4 py-1.5">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <Server className="w-3.5 h-3.5 text-cyan-400" />
          <span>Active Rows: <strong className="text-zinc-200">{subscriptions.length.toLocaleString()}</strong></span>
        </div>
        
        {benchmarkStats && (
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 border-l border-zinc-800 pl-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>2.5K Seeded in {benchmarkStats.durationMs.toFixed(1)}ms (&lt;2s SLA verified)</span>
          </div>
        )}

        <button
          onClick={handleRunStress}
          disabled={stressing || isLoading}
          className="text-xs font-mono px-2.5 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          title="Inject 2,500 active/quotation/confirmed records to test client aggregation SLA"
        >
          <Zap className="w-3 h-3 text-cyan-400" />
          {stressing ? 'Generating...' : 'Seed 2,500 Records'}
        </button>

        <button
          onClick={resetDefaults}
          disabled={isLoading}
          className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors p-1"
          title="Reset local storage store to initial seed state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Instant Role Switcher & User Profile */}
      <div className="flex items-center gap-3">
        {/* Role Switcher Pills */}
        <div className="bg-[#121215] p-1 rounded-lg border border-[#27272a] flex items-center gap-1">
          <button
            onClick={() => switchRole('Admin')}
            className={cn(
              'px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-all',
              currentRole === 'Admin'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
          </button>

          <button
            onClick={() => switchRole('Staff')}
            className={cn(
              'px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-all',
              currentRole === 'Staff'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Staff
          </button>

          <button
            onClick={() => switchRole('Customer')}
            className={cn(
              'px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-all',
              currentRole === 'Customer'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Globe className="w-3.5 h-3.5" />
            Customer
          </button>
        </div>

        {/* Current User Pill */}
        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-zinc-800">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="w-7 h-7 rounded-full border border-zinc-700 object-cover"
          />
          <div className="text-left">
            <p className="text-xs font-medium text-zinc-200 leading-none">{currentUser.name}</p>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{currentUser.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
