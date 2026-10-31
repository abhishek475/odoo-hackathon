import React from 'react';
import { SubscriptionStatus } from '../../types/billing';
import { Check, Pause, Play, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StateMachineStepperProps {
  currentStatus: SubscriptionStatus;
  onTransition?: (newStatus: SubscriptionStatus, note?: string) => void;
  allowMutations?: boolean;
}

const PRIMARY_STEPS: SubscriptionStatus[] = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'];

export const StateMachineStepper: React.FC<StateMachineStepperProps> = ({
  currentStatus,
  onTransition,
  allowMutations = false,
}) => {
  const currentIndex = PRIMARY_STEPS.indexOf(currentStatus as any);
  const isPaused = currentStatus === 'Paused';

  return (
    <div className="bg-[#121215] border border-[#27272a] rounded-xl p-4 my-3">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs uppercase tracking-wider font-mono text-zinc-400">
          Subscription State Machine
        </span>
        {isPaused && (
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800 flex items-center gap-1.5">
            <Pause className="w-3 h-3" /> State Suspended (Paused)
          </span>
        )}
      </div>

      <div className="flex items-center justify-between relative">
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] bg-zinc-800 -z-0" />

        {PRIMARY_STEPS.map((step, idx) => {
          const isPassed = !isPaused && currentIndex > idx;
          const isCurrent = !isPaused && currentStatus === step;

          return (
            <div key={step} className="flex flex-col items-center relative z-10">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs border transition-colors',
                  isCurrent && 'bg-cyan-950 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(103,232,249,0.25)]',
                  isPassed && 'bg-emerald-950 text-emerald-400 border-emerald-600',
                  !isCurrent && !isPassed && 'bg-[#18181b] text-zinc-500 border-zinc-700'
                )}
              >
                {isPassed ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span
                className={cn(
                  'text-xs font-mono mt-2',
                  isCurrent ? 'text-cyan-300 font-semibold' : 'text-zinc-400'
                )}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>

      {allowMutations && onTransition && (
        <div className="mt-5 pt-3 border-t border-[#27272a] flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-500 mr-2">Available Actions:</span>

          {currentStatus === 'Draft' && (
            <button
              onClick={() => onTransition('Quotation', 'Generated quotation for customer review')}
              className="px-3 py-1 bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800 rounded text-xs font-mono transition-colors"
            >
              Send Quotation →
            </button>
          )}

          {currentStatus === 'Quotation' && (
            <button
              onClick={() => onTransition('Confirmed', 'Customer confirmed quotation terms')}
              className="px-3 py-1 bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-800 rounded text-xs font-mono transition-colors"
            >
              Mark Confirmed →
            </button>
          )}

          {currentStatus === 'Confirmed' && (
            <button
              onClick={() => onTransition('Active', 'Provisioned cluster and activated billing')}
              className="px-3 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800 rounded text-xs font-mono transition-colors"
            >
              Activate Subscription →
            </button>
          )}

          {currentStatus === 'Active' && (
            <>
              <button
                onClick={() => onTransition('Paused', 'Requested temporary pause')}
                className="px-3 py-1 bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800 rounded text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                <Pause className="w-3 h-3" /> Pause Service
              </button>
              <button
                onClick={() => onTransition('Closed', 'Subscription closed per customer request')}
                className="px-3 py-1 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800 rounded text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                <XCircle className="w-3 h-3" /> Close Subscription
              </button>
            </>
          )}

          {currentStatus === 'Paused' && (
            <button
              onClick={() => onTransition('Active', 'Resumed subscription service')}
              className="px-3 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800 rounded text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3 h-3" /> Resume Subscription
            </button>
          )}

          {currentStatus === 'Closed' && (
            <span className="text-xs text-zinc-500 italic flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-zinc-600" /> Terminal state — modifications locked
            </span>
          )}
        </div>
      )}
    </div>
  );
};
