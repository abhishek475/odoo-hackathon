import React from 'react';
import { useAppState } from '../../context/AppStateContext';
import { UserRole } from '../../types/billing';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface ProtectedRouteGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallbackMessage?: string;
}

export const ProtectedRouteGuard: React.FC<ProtectedRouteGuardProps> = ({
  allowedRoles,
  children,
  fallbackMessage = 'This module requires elevated role permissions.',
}) => {
  const { currentRole, switchRole } = useAppState();

  const isAuthorized = allowedRoles.includes(currentRole);

  if (!isAuthorized) {
    return (
      <div className="bg-[#121215] border border-amber-900/40 rounded-xl p-8 max-w-lg mx-auto text-center font-mono space-y-4 my-12">
        <div className="w-12 h-12 rounded-full bg-amber-950 border border-amber-800 text-amber-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Demo workspace role
          </h2>
          <p className="text-xs text-zinc-400 mt-1">{fallbackMessage}</p>
        </div>

        <div className="text-[11px] text-zinc-500 bg-[#18181b] p-3 rounded border border-zinc-800">
          Demo role (navigation only): <strong className="text-zinc-300">{currentRole}</strong>
          <br />
          Allowed Roles: <strong className="text-cyan-300">{allowedRoles.join(', ')}</strong>
        </div>

        <div className="pt-2">
          <button
            onClick={() => switchRole(allowedRoles[0])}
            className="px-4 py-2 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-600 hover:bg-cyan-900 text-xs font-semibold flex items-center gap-2 mx-auto transition-colors"
          >
            <span>Switch Role to {allowedRoles[0]}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
