import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Bot,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Users,
  Database,
  CheckCircle2,
  Ticket,
  ChevronRight,
  MessageSquare,
  Clock,
  Layers,
  Flame,
} from 'lucide-react';
import { CustomerChatWidget } from '../components/chat/CustomerChatWidget';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [isDemoWidgetOpen, setIsDemoWidgetOpen] = useState(false);

  const features = [
    {
      title: 'AI-Powered Conversations',
      description:
        'Context-aware AI resolves complex customer queries in milliseconds across English, Hindi, and Hinglish with zero hallucinations.',
      icon: Bot,
      tag: 'Autonomous',
      accent: 'border-[#FFB33F]/30 bg-[#FFB33F]/5',
    },
    {
      title: 'Intelligent Knowledge Base',
      description:
        'Upload your PDFs, refund policies, FAQs, and product manuals. Our semantic vector engine references verified sources with confidence scores.',
      icon: Database,
      tag: 'RAG Retrieval',
      accent: 'border-blue-500/30 bg-blue-500/5',
    },
    {
      title: 'Automated Ticket Management',
      description:
        'Classify urgent billing disputes into P1 tickets instantly. Auto-assigns to human specialists with enriched conversation context.',
      icon: Ticket,
      tag: 'Auto-Triage',
      accent: 'border-emerald-500/30 bg-emerald-500/5',
    },
    {
      title: 'Seamless Human Handover',
      description:
        'One-click takeover gives human agents full conversation context while AI Copilot drafts suggested replies in the background.',
      icon: Users,
      tag: 'Hybrid Support',
      accent: 'border-purple-500/30 bg-purple-500/5',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Upload your knowledge base',
      description:
        'Drop your PDF manuals, refund rules, and API docs. DeskPilot indexes and chunks them into vector embeddings.',
    },
    {
      step: '02',
      title: 'Connect your customer support',
      description:
        'Embed our sleek live chat widget onto your store or SaaS platform with a single line of JavaScript.',
    },
    {
      step: '03',
      title: 'Let DeskPilot handle conversations',
      description:
        'Watch AI autopilot resolve up to 80% of customer tickets instantly while escalating sensitive issues cleanly.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-[#F5F5F5] flex flex-col selection:bg-[#FFB33F] selection:text-black">
      {/* 1. Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0B0B0F]/80 backdrop-blur-md border-b border-[#292932]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FFB33F] to-[#E59312] flex items-center justify-center shadow-[0_0_20px_rgba(255,179,63,0.35)]">
              <Bot className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-lg tracking-tight">DeskPilot</span>
                <span className="text-[10px] uppercase font-bold bg-[#FFB33F]/20 text-[#FFB33F] px-1.5 py-0.5 rounded border border-[#FFB33F]/30">
                  AI
                </span>
              </div>
            </div>
          </NavLink>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#product" className="hover:text-white transition-colors">
              Product
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a
              href="#demo"
              onClick={(e) => {
                e.preventDefault();
                setIsDemoWidgetOpen(true);
              }}
              className="text-[#FFB33F] hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Live Demo
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <NavLink
              to="/login"
              className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              Sign In
            </NavLink>
            <NavLink
              to="/signup"
              className="px-4 py-2 text-xs font-bold bg-[#FFB33F] hover:bg-[#F5A623] text-black rounded-lg shadow-[0_0_15px_rgba(255,179,63,0.3)] transition-all cursor-pointer"
            >
              Get Started Free
            </NavLink>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section id="product" className="relative pt-20 pb-28 overflow-hidden">

        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FFB33F]/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column: Heading & Value Prop */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#191920] border border-[#292932] text-xs text-gray-300">
              <span className="w-2 h-2 rounded-full bg-[#FFB33F] animate-pulse" />
              <span>Next-Gen Autonomous AI Support for SaaS & D2C</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
              Your Support Desk.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB33F] via-[#F5A623] to-[#FFD580]">
                On Autopilot.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#A1A1AA] max-w-xl leading-relaxed">
              Meet your autonomous AI support agent. Resolve repetitive queries, manage tickets, and give your customers instant support without increasing your team's workload.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <NavLink
                to="/signup"
                className="px-6 py-3.5 text-sm font-bold bg-[#FFB33F] hover:bg-[#F5A623] text-black rounded-xl shadow-[0_0_25px_rgba(255,179,63,0.35)] flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </NavLink>

              <NavLink
                to="/dashboard"
                className="px-6 py-3.5 text-sm font-semibold bg-[#191920] hover:bg-[#22222C] text-white rounded-xl border border-[#292932] flex items-center gap-2 transition-all"
              >
                <span>Explore Dashboard</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </NavLink>

              <button
                onClick={() => setIsDemoWidgetOpen(true)}
                className="px-5 py-3 text-xs font-semibold text-[#FFB33F] bg-[#FFB33F]/10 hover:bg-[#FFB33F]/20 rounded-xl border border-[#FFB33F]/30 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Test Live Chat Widget</span>
              </button>
            </div>

            {/* Social proof pills */}
            <div className="pt-6 flex flex-wrap items-center gap-6 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#FFB33F]" />
                <span>80% AI Resolution Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#FFB33F]" />
                <span>24s Avg Response Time</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#FFB33F]" />
                <span>Zero Training Setup</span>
              </div>
            </div>
          </div>

          {/* Right Column: Premium Dashboard Preview */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl bg-[#14141B] border border-[#292932] shadow-2xl p-4 overflow-hidden accent-glow">
              {/* Window Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#292932]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="text-[11px] font-mono text-gray-400">
                  DeskPilot Dashboard Preview
                </div>
                <span className="w-2 h-2 rounded-full bg-[#FFB33F] animate-pulse" />
              </div>

              {/* Mini metric bar */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-[#191920] p-2.5 rounded-lg border border-[#292932]">
                  <div className="text-[10px] text-gray-400">AI Resolved</div>
                  <div className="text-lg font-bold text-[#FFB33F]">78.4%</div>
                </div>
                <div className="bg-[#191920] p-2.5 rounded-lg border border-[#292932]">
                  <div className="text-[10px] text-gray-400">Active P1 Tickets</div>
                  <div className="text-lg font-bold text-rose-400">1 Urgent</div>
                </div>
              </div>

              {/* Simulated chat preview */}
              <div className="space-y-2.5 text-xs bg-[#0B0B0F] p-3 rounded-xl border border-[#292932]">
                <div className="bg-[#191920] p-2.5 rounded-lg border border-[#292932] max-w-[85%] text-gray-300">
                  "My payment was deducted for order ORD-1024 but no confirmation email."
                </div>
                <div className="bg-gradient-to-r from-[#211E16] to-[#1E1914] border border-[#FFB33F]/30 p-2.5 rounded-lg max-w-[90%] ml-auto text-white">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#FFB33F] font-bold mb-1">
                    <Bot className="w-3 h-3" />
                    <span>DeskPilot AI (96% Confidence)</span>
                  </div>
                  "I verified your payment ref HDFC891230. Your order is confirmed and ticket TCK-8821 has been created for your records."
                </div>
              </div>

              {/* Copilot suggested bar */}
              <div className="mt-3 p-2.5 rounded-xl bg-[#191920] border border-[#FFB33F]/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-gray-300">
                  <Sparkles className="w-3.5 h-3.5 text-[#FFB33F]" />
                  <span>AI Copilot: Verified refund policy cited</span>
                </div>
                <NavLink
                  to="/dashboard"
                  className="px-2.5 py-1 text-[11px] font-bold rounded bg-[#FFB33F] text-black hover:bg-[#F5A623]"
                >
                  Live View
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Section */}
      <section id="features" className="py-20 bg-[#14141B] border-y border-[#292932]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-widest text-[#FFB33F] font-bold mb-2">
              Enterprise Features
            </h2>
            <h3 className="text-3xl font-bold text-white tracking-tight">
              Built for Modern SaaS & D2C Brands
            </h3>
            <p className="text-sm text-gray-400 mt-3">
              Everything your customer support team needs to scale from 100 to 100,000 queries per day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-6 bg-[#191920] border border-[#292932] rounded-2xl hover:border-[#FFB33F]/40 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-[#0B0B0F] border border-[#292932] flex items-center justify-center group-hover:border-[#FFB33F]/50 transition-colors">
                        <Icon className="w-6 h-6 text-[#FFB33F]" />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/10">
                        {feat.tag}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white mb-2">{feat.title}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">{feat.description}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#292932] flex items-center text-xs font-semibold text-[#FFB33F] group-hover:translate-x-1 transition-transform">
                    <span>Learn more</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section id="how-it-works" className="py-24 bg-[#0B0B0F]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-widest text-[#FFB33F] font-bold mb-2">
              Simple 3-Step Setup
            </h2>
            <h3 className="text-3xl font-bold text-white tracking-tight">
              Ready in Under 5 Minutes
            </h3>
            <p className="text-sm text-gray-400 mt-3">
              No code required. Plug into your existing documents and start answering customer tickets immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((st, idx) => (
              <div
                key={idx}
                className="p-8 bg-[#14141B] border border-[#292932] rounded-2xl relative overflow-hidden group hover:border-gray-500 transition-colors"
              >
                <div className="text-5xl font-black text-[#292932] group-hover:text-[#FFB33F]/20 transition-colors mb-4 font-mono">
                  {st.step}
                </div>
                <h4 className="text-lg font-bold text-white mb-3">{st.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{st.description}</p>
              </div>
            ))}
          </div>

          {/* Banner CTA */}
          <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-[#191920] via-[#1C1814] to-[#191920] border border-[#FFB33F]/30 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h4 className="text-xl font-bold text-white">Experience DeskPilot in action</h4>
              <p className="text-xs text-gray-400">
                Test the customer chat widget or hop directly into the agent dashboard.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDemoWidgetOpen(true)}
                className="px-5 py-3 text-xs font-bold bg-[#FFB33F] text-black rounded-xl hover:bg-[#F5A623] cursor-pointer"
              >
                Open Live Chat Widget
              </button>
              <NavLink
                to="/dashboard"
                className="px-5 py-3 text-xs font-semibold bg-[#292932] text-white rounded-xl hover:bg-gray-700"
              >
                Go to Dashboard
              </NavLink>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="mt-auto bg-[#14141B] border-t border-[#292932] py-12 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FFB33F] flex items-center justify-center">
                <Bot className="w-4 h-4 text-black" />
              </div>
              <span className="font-bold text-white text-base">DeskPilot</span>
            </div>
            <p className="text-gray-500 leading-relaxed">
              The autonomous AI support desk for modern SaaS and D2C businesses.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-white mb-3">Product</h5>
            <ul className="space-y-2">
              <li>
                <NavLink to="/dashboard" className="hover:text-white transition-colors">
                  Agent Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/tickets" className="hover:text-white transition-colors">
                  Ticket Management
                </NavLink>
              </li>
              <li>
                <NavLink to="/knowledge-base" className="hover:text-white transition-colors">
                  Knowledge Base RAG
                </NavLink>
              </li>
              <li>
                <NavLink to="/analytics" className="hover:text-white transition-colors">
                  Analytics & Reports
                </NavLink>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white mb-3">Resources</h5>
            <ul className="space-y-2">
              <li>
                <NavLink to="/onboarding" className="hover:text-white transition-colors">
                  Setup Onboarding
                </NavLink>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  API Integration Guide
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white mb-3">Hackathon Demo</h5>
            <p className="text-gray-500 mb-3">
              Built with React, TypeScript, Tailwind CSS, and Gemini AI integration.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-[#FFB33F]">
              <span className="w-2 h-2 rounded-full bg-[#FFB33F] animate-pulse" />
              <span>Ready for Backend Integration</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 mt-8 border-t border-[#292932] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
          <div>© 2026 DeskPilot Technologies Inc. All rights reserved.</div>
          <div className="flex gap-4">
            <span className="hover:text-gray-300">Privacy Policy</span>
            <span className="hover:text-gray-300">Terms of Service</span>
            <span className="hover:text-gray-300">Security Whitepaper</span>
          </div>
        </div>
      </footer>

      {/* Floating Demo Customer Chat Widget */}
      <CustomerChatWidget
        isOpenExternally={isDemoWidgetOpen}
        onCloseExternal={() => setIsDemoWidgetOpen(false)}
      />
    </div>
  );
};
