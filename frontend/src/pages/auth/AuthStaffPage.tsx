import React, { useState } from 'react';
import { useAppState } from '../../context/AppStateContext';
import { User, UserRole } from '../../types/billing';
import { SEED_USERS } from '../../mocks/seedData';
import { Lock, Mail, UserCheck, Shield, KeyRound, Check, AlertCircle } from 'lucide-react';

export const AuthStaffPage: React.FC = () => {
  const { currentUser, switchRole } = useAppState();

  const [activeTab, setActiveTab] = useState<'staff' | 'login' | 'signup' | 'forgot'>('staff');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginMsg, setLoginMsg] = useState('');

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  // Signup form state with strict regex validation
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('Staff');
  const [signupErrors, setSignupErrors] = useState<string[]>([]);
  const [signupSuccess, setSignupSuccess] = useState('');

  const [staffList, setStaffList] = useState<User[]>(SEED_USERS);

  // TODO: [BACKEND_HOOK] - POST /api/v1/auth/login - Payload: { email, password } - Returns: Promise<{ user: User, token: string }>
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = staffList.find(u => u.email.toLowerCase() === loginEmail.toLowerCase());
    if (user) {
      switchRole(user.role);
      setLoginMsg(`Logged in successfully as ${user.name} (${user.role})!`);
    } else {
      setLoginMsg(`Authenticated session initiated for ${loginEmail}.`);
    }
  };

  // TODO: [BACKEND_HOOK] - POST /api/v1/auth/signup - Payload: { name, email, password, role } - Returns: Promise<{ user: User, token: string }>
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];

    // Strict regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail)) {
      errs.push('A valid enterprise email format is required.');
    }

    if (signupPass.length < 8) {
      errs.push('Password must be at least 8 characters long.');
    }
    if (!/[A-Z]/.test(signupPass)) {
      errs.push('Password must contain at least 1 uppercase letter.');
    }
    if (!/[0-9]/.test(signupPass)) {
      errs.push('Password must contain at least 1 numeric digit.');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(signupPass)) {
      errs.push('Password must contain at least 1 special character.');
    }

    if (errs.length > 0) {
      setSignupErrors(errs);
      setSignupSuccess('');
      return;
    }

    setSignupErrors([]);
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: signupName,
      email: signupEmail,
      role: signupRole,
      companyName: 'Brightloop Operations',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    };

    setStaffList([...staffList, newUser]);
    setSignupSuccess(`Account created for ${newUser.name} with role ${newUser.role}!`);
    setSignupName('');
    setSignupEmail('');
    setSignupPass('');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight font-mono">
          STAFF DIRECTORY &amp; ACCESS CONTROL
        </h1>
        <p className="text-xs text-zinc-400 font-mono mt-1">
          Identity governance, role assignments (RBAC), and authentication views
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#27272a] gap-6 text-xs font-mono">
        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'staff'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Staff Directory ({staffList.length})
        </button>
        <button
          onClick={() => setActiveTab('login')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'login'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          Auth Login View
        </button>
        <button
          onClick={() => setActiveTab('signup')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'signup'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          Provision Staff Account (Signup)
        </button>
        <button
          onClick={() => setActiveTab('forgot')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'forgot'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          Forgot Password
        </button>
      </div>

      {/* Staff Directory Tab */}
      {activeTab === 'staff' && (
        <div className="bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden font-mono text-xs">
          <table className="w-full text-left">
            <thead className="bg-[#18181b] text-zinc-400 border-b border-[#27272a]">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-zinc-300">
              {staffList.map(member => (
                <tr key={member.id} className="hover:bg-[#18181b]/50">
                  <td className="py-3 px-4 flex items-center gap-2.5">
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-7 h-7 rounded-full border border-zinc-700 object-cover"
                    />
                    <span className="font-sans font-medium text-white">{member.name}</span>
                  </td>
                  <td className="py-3 px-4 text-zinc-400">{member.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] border ${
                        member.role === 'Admin'
                          ? 'bg-purple-950 text-purple-300 border-purple-800'
                          : member.role === 'Staff'
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      }`}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-zinc-500">{member.companyName || 'Brightloop Corp'}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => switchRole(member.role)}
                      className="px-2.5 py-1 rounded bg-[#18181b] text-cyan-300 hover:bg-zinc-800 border border-zinc-700 text-[11px]"
                    >
                      Switch To This Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Login Tab */}
      {activeTab === 'login' && (
        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-6 max-w-md mx-auto space-y-4 font-mono text-xs">
          <div className="text-center pb-2">
            <h2 className="text-base font-bold text-white">Sign In to Brightloop</h2>
            <p className="text-[11px] text-zinc-400 mt-1">Direct single sign-on / token authentication</p>
          </div>

          {loginMsg && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-500/50 rounded text-emerald-300 text-[11px]">
              {loginMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="text-zinc-400">Email Address</label>
              <div className="relative mt-1">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  required
                  placeholder="alexandra.vance@brightloop.io"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-[#18181b] border border-[#27272a] rounded text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-zinc-400">Password</label>
              <div className="relative mt-1">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={loginPass}
                  onChange={e => setLoginPass(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-[#18181b] border border-[#27272a] rounded text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 rounded font-semibold transition-colors mt-2"
            >
              Authenticate &amp; Launch
            </button>
          </form>
        </div>
      )}

      {/* Signup Tab */}
      {activeTab === 'signup' && (
        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-6 max-w-md mx-auto space-y-4 font-mono text-xs">
          <div className="text-center pb-2">
            <h2 className="text-base font-bold text-white">Provision New Staff Profile</h2>
            <p className="text-[11px] text-zinc-400 mt-1">Requires strict password regex policy</p>
          </div>

          {signupSuccess && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-500/50 rounded text-emerald-300 text-[11px] flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              {signupSuccess}
            </div>
          )}

          {signupErrors.length > 0 && (
            <div className="p-3 bg-rose-950/50 border border-rose-500/50 rounded text-rose-300 text-[11px] space-y-1">
              {signupErrors.map((err, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-3">
            <div>
              <label className="text-zinc-400">Full Name</label>
              <input
                type="text"
                required
                placeholder="Devang Developer"
                value={signupName}
                onChange={e => setSignupName(e.target.value)}
                className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-white font-sans"
              />
            </div>

            <div>
              <label className="text-zinc-400">Email Address</label>
              <input
                type="email"
                required
                placeholder="devang@brightloop.io"
                value={signupEmail}
                onChange={e => setSignupEmail(e.target.value)}
                className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-white"
              />
            </div>

            <div>
              <label className="text-zinc-400">Password</label>
              <input
                type="password"
                required
                placeholder="Min 8 chars, 1 upper, 1 num, 1 special"
                value={signupPass}
                onChange={e => setSignupPass(e.target.value)}
                className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-white"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">Policy: &ge;8 chars, uppercase, digit, symbol.</span>
            </div>

            <div>
              <label className="text-zinc-400">Role Privilege</label>
              <select
                value={signupRole}
                onChange={e => setSignupRole(e.target.value as any)}
                className="w-full mt-1 p-2 bg-[#18181b] border border-[#27272a] rounded text-zinc-200"
              >
                <option value="Staff">Internal Staff</option>
                <option value="Admin">Administrator</option>
                <option value="Customer">Customer</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 rounded font-semibold transition-colors mt-2"
            >
              Create Staff Account
            </button>
          </form>
        </div>
      )}

      {/* Forgot Password Tab */}
      {activeTab === 'forgot' && (
        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-6 max-w-md mx-auto space-y-4 font-mono text-xs">
          <div className="text-center pb-2">
            <h2 className="text-base font-bold text-white">Reset Account Credentials</h2>
            <p className="text-[11px] text-zinc-400 mt-1">Receive secure one-time password reset token</p>
          </div>

          {forgotMsg ? (
            <div className="p-3 bg-emerald-950/50 border border-emerald-500/50 rounded text-emerald-300 text-[11px] flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              {forgotMsg}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // TODO: [BACKEND_HOOK] - POST /api/v1/auth/forgot-password - Payload: { email: forgotEmail } - Returns: Promise<{ sent: boolean }>
                setForgotMsg(`Password reset instructions dispatched to ${forgotEmail}. Check your enterprise inbox.`);
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-zinc-400">Registered Corporate Email</label>
                <div className="relative mt-1">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    required
                    placeholder="name@brightloop.io"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-[#18181b] border border-[#27272a] rounded text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 rounded font-semibold transition-colors mt-2"
              >
                Send Password Reset Token
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
