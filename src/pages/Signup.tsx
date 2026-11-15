import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bot, User, Building, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { success, error: toastError } = useToast();

  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim() || !companyName.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (!email.includes('@')) {
      setErrorMessage('Please provide a valid work email.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    const res = await signup(fullName, companyName, email, password);
    setIsLoading(false);

    if (res.success) {
      success('Account created! Let us configure your AI support agent.');
      navigate('/onboarding');
    } else {
      setErrorMessage(res.error || 'Failed to create account.');
      toastError(res.error || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0F] flex flex-col items-center justify-center p-6 selection:bg-[#FFB33F] selection:text-black">
      {/* Brand logo */}
      <NavLink to="/" className="flex items-center gap-2.5 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFB33F] to-[#E59312] flex items-center justify-center shadow-[0_0_20px_rgba(255,179,63,0.35)]">
          <Bot className="w-6 h-6 text-black" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-white text-xl tracking-tight">DeskPilot</span>
          <span className="text-[10px] uppercase font-bold bg-[#FFB33F]/20 text-[#FFB33F] px-1.5 py-0.5 rounded border border-[#FFB33F]/30">
            AI
          </span>
        </div>
      </NavLink>

      {/* Signup Card */}
      <div className="w-full max-w-md bg-[#14141B] border border-[#292932] rounded-2xl p-8 shadow-2xl relative">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">Create your DeskPilot account</h1>
          <p className="text-xs text-gray-400 mt-1">
            Put your customer support on autopilot in under 3 minutes.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Rahul Sharma"
                required
                className="w-full bg-[#191920] border border-[#292932] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FFB33F] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Company Name
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme SaaS Corp"
                required
                className="w-full bg-[#191920] border border-[#292932] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FFB33F] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@acme.com"
                required
                className="w-full bg-[#191920] border border-[#292932] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FFB33F] transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-300">Password</label>
              <span className="text-[11px] text-gray-500">Min 6 characters</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#191920] border border-[#292932] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FFB33F] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Onboarding
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-[#292932] text-center text-xs text-gray-400">
          Already have an account?{' '}
          <NavLink to="/login" className="font-semibold text-[#FFB33F] hover:underline">
            Sign in
          </NavLink>
        </div>
      </div>
    </div>
  );
};
