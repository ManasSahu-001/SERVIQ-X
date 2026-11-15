import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Bot,
  Play,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Cpu,
  Layers,
  Database,
  Globe,
  Mail,
  UserCheck,
  CheckCircle2,
  Clock,
  Code2,
  FileText,
  Activity,
  Maximize2,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const LandingWorkflow: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Workflow simulation state
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [selectedWorkflowScenario, setSelectedWorkflowScenario] = useState<'refund' | 'tracking' | 'escalation'>('refund');
  const [liveResolvedCount, setLiveResolvedCount] = useState<number>(12458);

  // Particle Orb Animation on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 500);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes
    const particleCount = 140;
    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      angle: number;
      speed: number;
      distance: number;
      color: string;
      alpha: number;
      elevation: number;
    }> = [];

    const colors = ['#00F0FF', '#7000FF', '#BD00FF', '#3B82F6', '#00E5FF'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: 0,
        y: 0,
        radius: Math.random() * 2 + 1,
        angle: Math.random() * Math.PI * 2,
        speed: 0.004 + Math.random() * 0.008,
        distance: 40 + Math.random() * 140,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.3 + Math.random() * 0.7,
        elevation: (Math.random() - 0.5) * 60,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Outer radial glow
      const bgGlow = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, width * 0.45);
      bgGlow.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
      bgGlow.addColorStop(0.35, 'rgba(112, 0, 255, 0.08)');
      bgGlow.addColorStop(0.7, 'rgba(189, 0, 255, 0.03)');
      bgGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, width * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Inner Core Glow
      const coreGlow = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 70);
      coreGlow.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      coreGlow.addColorStop(0.2, 'rgba(0, 240, 255, 0.7)');
      coreGlow.addColorStop(0.6, 'rgba(112, 0, 255, 0.3)');
      coreGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 70, 0, Math.PI * 2);
      ctx.fill();

      // Orbital Rings
      const rings = [
        { radiusX: 130, radiusY: 55, tilt: 0.35, color: 'rgba(0, 240, 255, 0.28)' },
        { radiusX: 110, radiusY: 45, tilt: -0.4, color: 'rgba(189, 0, 255, 0.32)' },
        { radiusX: 150, radiusY: 65, tilt: 0.1, color: 'rgba(59, 130, 246, 0.22)' },
        { radiusX: 85, radiusY: 35, tilt: 0.7, color: 'rgba(0, 229, 255, 0.35)' },
      ];

      rings.forEach((ring, idx) => {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(ring.tilt + Math.sin(time * 0.5 + idx) * 0.05);

        ctx.beginPath();
        ctx.ellipse(0, 0, ring.radiusX, ring.radiusY, 0, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 6]);
        ctx.lineDashOffset = -time * 15 * (idx % 2 === 0 ? 1 : -1);
        ctx.stroke();
        ctx.restore();
      });

      // Swirling energetic wave arcs
      for (let arcIdx = 0; arcIdx < 6; arcIdx++) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(time * 0.2 * (arcIdx % 2 === 0 ? 1 : -1) + (arcIdx * Math.PI) / 3);

        ctx.beginPath();
        const arcRadius = 75 + Math.sin(time + arcIdx) * 15;
        ctx.arc(0, 0, arcRadius, 0, Math.PI * 0.6);
        ctx.strokeStyle = arcIdx % 2 === 0 ? 'rgba(0, 240, 255, 0.45)' : 'rgba(189, 0, 255, 0.45)';
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.restore();
      }

      // Draw and connect particles
      particles.forEach((p, idx) => {
        p.angle += p.speed;
        const currentDist = p.distance + Math.sin(time * 2 + idx) * 8;
        p.x = centerX + Math.cos(p.angle) * currentDist;
        p.y = centerY + Math.sin(p.angle) * (currentDist * 0.6) + Math.sin(time + p.angle) * p.elevation;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;

        // Link close particles with gossamer filaments
        for (let j = idx + 1; j < particles.length; j += 4) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 42) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = 'rgba(0, 240, 255, ' + (1 - dist / 42) * 0.25 + ')';
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Step sequencer for the workflow graph
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev >= 4 ? 1 : prev + 1));
      if (Math.random() > 0.6) {
        setLiveResolvedCount((prev) => prev + 1);
      }
    }, 2800);
    return () => clearInterval(interval);
  }, [isSimulating]);

  return (
    <div className="min-h-screen bg-[#07070A] text-[#F3F4F6] selection:bg-[#00F0FF] selection:text-black font-sans overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 left-1/3 w-[700px] h-[400px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Top Cybernetic Nav Header */}
      <header className="sticky top-0 z-50 bg-[#0B0B10]/85 backdrop-blur-xl border-b border-[#1E1E2A]">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <NavLink to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00F0FF] via-[#7000FF] to-[#BD00FF] p-[1px] shadow-[0_0_20px_rgba(0,240,255,0.35)] group-hover:shadow-[0_0_28px_rgba(189,0,255,0.6)] transition-all">
                <div className="w-full h-full bg-[#0B0B10] rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5 text-[#00F0FF] group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-lg tracking-tight">SERVIQ-X</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-[#00F0FF] border border-cyan-500/30">
                    Agent Swarm
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono -mt-0.5">Autonomous Support Engine</span>
              </div>
            </NavLink>

            {/* Navigation links */}
            <nav className="hidden lg:flex items-center gap-1.5 pl-6 border-l border-[#1E1E2A]">
              <a
                href="#workflow"
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-[#151520] transition-colors"
              >
                Agent Canvas
              </a>
              <a
                href="#telemetry"
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-[#151520] transition-colors"
              >
                Live Operations
              </a>
              <NavLink
                to="/user"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#00F0FF] bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all flex items-center gap-1.5"
              >
                <span>Customer Portal</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
              </NavLink>
              <NavLink
                to="/inbox"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#FFB33F] bg-[#FFB33F]/10 hover:bg-[#FFB33F]/20 border border-[#FFB33F]/30 transition-all flex items-center gap-1.5"
              >
                <span>Agent Workspace (Priya)</span>
                <ExternalLink className="w-3 h-3" />
              </NavLink>
            </nav>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/25">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>SLA 99.98% Active</span>
            </div>

            <NavLink
              to="/login"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-[#151520] hover:bg-[#1C1C2A] border border-[#262638] transition-all"
            >
              Sign In
            </NavLink>

            <NavLink
              to="/inbox"
              className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#00F0FF] via-[#38BDF8] to-[#A855F7] hover:brightness-110 shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center gap-1.5"
            >
              <span>Launch Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>
        </div>
      </header>

      {/* Hero Section Banner */}
      <section className="relative pt-6 pb-4 px-4 sm:px-6 lg:px-8 border-b border-[#1A1A26]">
        <div className="max-w-[1520px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
              <Sparkles className="w-3 h-3 text-[#00F0FF]" />
              <span>Next-Gen Autonomous Agentic Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              AI Support Orchestration & Operational Canvas
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 max-w-3xl">
              End-to-end cognitive customer support: Ingest inquiries, classify intent, run vector policy retrieval,
              safely trigger refund limits, and smoothly hand off to human agents.
            </p>
          </div>

          {/* Quick Simulation Controller */}
          <div className="flex items-center gap-2 bg-[#101018] border border-[#242436] p-1.5 rounded-2xl shrink-0 self-start md:self-auto">
            <span className="text-[11px] font-mono text-gray-400 px-2">Scenario:</span>
            <button
              type="button"
              onClick={() => {
                setSelectedWorkflowScenario('refund');
                setActiveStep(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedWorkflowScenario === 'refund'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ₹1,200 Refund Dispute
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedWorkflowScenario('tracking');
                setActiveStep(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedWorkflowScenario === 'tracking'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Order Tracking
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedWorkflowScenario('escalation');
                setActiveStep(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedWorkflowScenario === 'escalation'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Human Handoff (Priya)
            </button>
          </div>
        </div>
      </section>

      {/* MAIN 3-PANEL DISPLAY MATCHING REFERENCE IMAGE */}
      <main className="max-w-[1520px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* ========================================================= */}
          {/* LEFT PANEL: 3D CYBERNETIC PARTICLE NEURAL SPHERE (45%)    */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 bg-[#0C0C12] border border-[#1E1E2C] rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-2xl min-h-[640px] group">
            {/* Top Floating Badge Bar */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] animate-ping" />
                <span className="font-mono text-xs text-[#00F0FF] tracking-wider uppercase font-semibold">
                  Cognitive Neural Core
                </span>
              </div>
              <div className="p-2 rounded-xl bg-[#141420] border border-[#252538] text-gray-400 hover:text-white transition-colors cursor-pointer">
                <Maximize2 className="w-4 h-4" />
              </div>
            </div>

            {/* Interactive HTML5 Canvas Particle Orb */}
            <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full h-full max-h-[460px] cursor-grab active:cursor-grabbing"
              />

              {/* Floating Hologram Telemetry Tags over Sphere */}
              <div className="absolute top-12 left-4 bg-[#10101C]/85 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-3 shadow-lg max-w-[190px] animate-pulse">
                <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">Semantic Vector</div>
                <div className="text-xs font-bold text-white mt-0.5">384-Dim Embeddings</div>
                <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Zero Hallucinations</span>
                </div>
              </div>

              <div className="absolute bottom-12 right-4 bg-[#10101C]/85 backdrop-blur-md border border-purple-500/30 rounded-2xl p-3 shadow-lg max-w-[200px]">
                <div className="text-[10px] font-mono text-purple-400 uppercase tracking-wider">Guardrails Active</div>
                <div className="text-xs font-bold text-white mt-0.5">₹2,000 Refund Limit</div>
                <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#00F0FF]" />
                  <span>Enforces Policy v14</span>
                </div>
              </div>
            </div>

            {/* Bottom Hero Narrative & Controls */}
            <div className="z-10 space-y-3 pt-4 border-t border-[#1C1C28]">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span>1,420 token stream / sec</span>
                </span>
                <span className="font-mono text-cyan-400">LangGraph.js Orchestrated</span>
              </div>
              <div className="flex items-center gap-3">
                <NavLink
                  to="/user"
                  className="flex-1 py-3 px-4 rounded-xl text-center text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-[#00F0FF] border border-cyan-500/40 transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                >
                  Open Customer Portal
                </NavLink>
                <NavLink
                  to="/inbox"
                  className="flex-1 py-3 px-4 rounded-xl text-center text-xs font-bold bg-[#FFB33F] hover:bg-[#F5A623] text-black transition-all shadow-[0_0_15px_rgba(255,179,63,0.3)]"
                >
                  Open Agent Desk
                </NavLink>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: WORKFLOW GRAPH (TOP) + OPERATIONS (BOTTOM)  */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            {/* TOP RIGHT: THE NODE-BASED AGENT WORKFLOW CANVAS */}
            <div
              id="workflow"
              className="bg-[#0C0C12] border border-[#1E1E2C] rounded-3xl p-6 relative overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Canvas Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E1E2C]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[#00F0FF]">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Multi-Agent Workflow Graph</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Active Simulation
                      </span>
                    </h2>
                    <p className="text-[11px] text-gray-400">Autonomous execution pipeline with LangGraph state transitions</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSimulating(!isSimulating)}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-[#161622] hover:bg-[#202030] text-gray-300 border border-[#2A2A3C] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3 h-3 text-[#00F0FF]" />
                    <span>{isSimulating ? 'Pause Flow' : 'Resume Flow'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="p-1.5 rounded-lg bg-[#161622] text-gray-400 hover:text-white border border-[#2A2A3C] transition-colors cursor-pointer"
                    title="Reset Simulation"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Node Graph Visualizer */}
              <div className="relative bg-[#08080E] border border-[#1A1A26] rounded-2xl p-6 min-h-[260px] overflow-x-auto flex items-center justify-center">
                {/* Cybernetic grid overlay */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(rgba(0, 240, 255, 0.4) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                />

                {/* SVG Connecting Bezier Cables */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  {/* Trigger to Agent Node */}
                  <path
                    d="M 120 130 C 160 130, 180 130, 220 130"
                    fill="none"
                    stroke={activeStep >= 1 ? '#00F0FF' : '#2A2A3C'}
                    strokeWidth="2.5"
                    strokeDasharray={activeStep === 1 ? '4 4' : 'none'}
                    className={activeStep === 1 ? 'animate-pulse' : ''}
                  />

                  {/* Agent Node to Code / API execution */}
                  <path
                    d="M 330 130 C 370 130, 390 130, 430 130"
                    fill="none"
                    stroke={activeStep >= 2 ? '#BD00FF' : '#2A2A3C'}
                    strokeWidth="2.5"
                  />

                  {/* Code Node to Tools branches */}
                  {/* Top branch to Webhook */}
                  <path
                    d="M 530 120 C 560 100, 580 80, 620 70"
                    fill="none"
                    stroke={activeStep >= 3 ? '#00F0FF' : '#2A2A3C'}
                    strokeWidth="2"
                  />

                  {/* Bottom branch to Customer Dispatch */}
                  <path
                    d="M 530 140 C 560 160, 580 180, 620 190"
                    fill="none"
                    stroke={activeStep >= 3 ? '#3B82F6' : '#2A2A3C'}
                    strokeWidth="2"
                  />

                  {/* Agent to Downward Sub-Tools */}
                  <path
                    d="M 275 160 C 275 190, 240 210, 210 230"
                    fill="none"
                    stroke={activeStep >= 2 ? '#FFB33F' : '#222230'}
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <path
                    d="M 275 160 C 275 190, 275 205, 275 230"
                    fill="none"
                    stroke={activeStep >= 2 ? '#FFB33F' : '#222230'}
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <path
                    d="M 275 160 C 275 190, 310 210, 340 230"
                    fill="none"
                    stroke={activeStep >= 2 ? '#FFB33F' : '#222230'}
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                </svg>

                {/* Nodes Container */}
                <div className="relative z-10 w-full flex items-center justify-between max-w-3xl gap-4">
                  {/* Node 1: Trigger / Play */}
                  <div
                    className={`flex flex-col items-center gap-1 transition-all ${
                      activeStep === 1 ? 'scale-105' : 'opacity-80'
                    }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
                        activeStep === 1
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                          : 'bg-[#12121C] border-[#2A2A3C] text-gray-500'
                      }`}
                    >
                      <Play className="w-6 h-6 fill-current" />
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">Webhook Trigger</span>
                  </div>

                  {/* Node 2: Central AI Agent Brain */}
                  <div
                    className={`flex flex-col items-center gap-1 transition-all ${
                      activeStep === 2 ? 'scale-105' : 'opacity-80'
                    }`}
                  >
                    <div
                      className={`px-5 py-3.5 rounded-2xl flex items-center gap-2.5 border transition-all ${
                        activeStep === 2
                          ? 'bg-[#1C1030] border-[#BD00FF] text-[#00F0FF] shadow-[0_0_25px_rgba(189,0,255,0.5)]'
                          : 'bg-[#12121C] border-[#2A2A3C] text-gray-300'
                      }`}
                    >
                      <Bot className="w-5 h-5 text-[#00F0FF]" />
                      <div className="text-left">
                        <div className="text-xs font-bold text-white tracking-wide">AI AGENT</div>
                        <div className="text-[9px] font-mono text-[#BD00FF]">Intent & Guardrails</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">Classify & Reason</span>
                  </div>

                  {/* Node 3: Code / API Execution */}
                  <div
                    className={`flex flex-col items-center gap-1 transition-all ${
                      activeStep === 3 ? 'scale-105' : 'opacity-80'
                    }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
                        activeStep === 3
                          ? 'bg-[#1A1A30] border-cyan-400 text-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                          : 'bg-[#12121C] border-[#2A2A3C] text-gray-500'
                      }`}
                    >
                      <Code2 className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">&lt;/&gt; Tool Exec</span>
                  </div>

                  {/* Output Node Branch 4: Top = Webhook / Bottom = Mail / Human */}
                  <div className="flex flex-col gap-6">
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                        activeStep === 4
                          ? 'bg-cyan-500/15 border-cyan-400 text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                          : 'bg-[#12121C] border-[#2A2A3C] text-gray-500'
                      }`}
                    >
                      <Globe className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-semibold">Web Chat & API</span>
                    </div>

                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                        activeStep === 4
                          ? 'bg-purple-500/15 border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                          : 'bg-[#12121C] border-[#2A2A3C] text-gray-500'
                      }`}
                    >
                      <Mail className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-semibold">WhatsApp & Priya</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step indicator description footer */}
              <div className="mt-3 pt-3 border-t border-[#1C1C28] flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00F0FF]" />
                  <span>
                    Current Stage: <strong className="text-white">
                      {activeStep === 1 && 'Customer message arrives via WhatsApp (Rohan Mehta, ₹1,200 deducted)'}
                      {activeStep === 2 && 'Intent classified as Billing · RAG retrieves Gateway Policy v6 & FAQ v14'}
                      {activeStep === 3 && 'Evaluating refund limit (₹1,200 < ₹2,000 threshold) · Handoff assigned'}
                      {activeStep === 4 && 'Dispatches Copilot recommendation to Priya · Notifies Rohan with SLA'}
                    </strong>
                  </span>
                </div>
                <span className="font-mono text-cyan-400">Step {activeStep} of 4</span>
              </div>
            </div>

            {/* ========================================================= */}
            {/* BOTTOM RIGHT: AI AGENT OPERATIONS COMMAND CENTER          */}
            {/* ========================================================= */}
            <div
              id="telemetry"
              className="bg-[#0C0C14] border border-[#1E1E2C] rounded-3xl p-6 shadow-2xl flex flex-col gap-5"
            >
              {/* Window Chrome & Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1E1E2C]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="pl-2 border-l border-[#242436]">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">AI Agent Operations</h3>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Live
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">Monitor, improve and scale your AI agents</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-400 px-3 py-1 rounded-lg bg-[#141420] border border-[#242436]">
                    Last 7 Days
                  </span>
                  <NavLink
                    to="/inbox"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-md flex items-center gap-1"
                  >
                    <span>+ New Agent</span>
                  </NavLink>
                </div>
              </div>

              {/* 4 Metric Telemetry Cards matching screenshot */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#12121E] border border-[#222234] rounded-2xl p-3.5 space-y-1">
                  <div className="text-[11px] text-gray-400">Conversations</div>
                  <div className="text-xl font-bold text-white font-mono">{liveResolvedCount.toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>+12.5%</span>
                  </div>
                </div>

                <div className="bg-[#12121E] border border-[#222234] rounded-2xl p-3.5 space-y-1">
                  <div className="text-[11px] text-gray-400">Resolution rate</div>
                  <div className="text-xl font-bold text-[#00F0FF] font-mono">93.6%</div>
                  <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>+5.4%</span>
                  </div>
                </div>

                <div className="bg-[#12121E] border border-[#222234] rounded-2xl p-3.5 space-y-1">
                  <div className="text-[11px] text-gray-400">Avg. handle time</div>
                  <div className="text-xl font-bold text-white font-mono">4m 32s</div>
                  <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>-8.2%</span>
                  </div>
                </div>

                <div className="bg-[#12121E] border border-[#222234] rounded-2xl p-3.5 space-y-1">
                  <div className="text-[11px] text-gray-400">Human handoffs</div>
                  <div className="text-xl font-bold text-[#FFB33F] font-mono">312</div>
                  <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>-15.1%</span>
                  </div>
                </div>
              </div>

              {/* 3-Column Operations Stream (matching image) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Live Conversation Stream */}
                <div className="bg-[#10101C] border border-[#1E1E2E] rounded-2xl p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">Live conversations</span>
                      <span className="text-[10px] font-mono text-emerald-400">12 online</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* Customer Card */}
                      <div className="p-2.5 rounded-xl bg-[#161624] border border-[#26263A] space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-white">Rohan Mehta</span>
                          <span className="text-[10px] font-mono text-cyan-400">#DP-4821</span>
                        </div>
                        <p className="text-gray-300 text-[11px] leading-relaxed">
                          "Bhai payment fail ho gaya lekin paisa kat gaya hai, ₹1,200. Order bhi nahi dikh raha."
                        </p>
                      </div>

                      {/* AI Response Card */}
                      <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[#00F0FF]">DeskPilot AI</span>
                          <span className="text-[10px] font-mono text-gray-400">Just now</span>
                        </div>
                        <p className="text-gray-300 text-[11px] leading-relaxed">
                          "Sorry Rohan, ye gateway delay ki wajah se hota hai. Reverses in 5–7 working days."
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1C1C2C] flex items-center justify-between">
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      Handoff suggested
                    </span>
                    <NavLink to="/inbox" className="text-[11px] text-[#00F0FF] hover:underline flex items-center gap-1">
                      <span>View in Priya's Inbox</span>
                      <ChevronRight className="w-3 h-3" />
                    </NavLink>
                  </div>
                </div>

                {/* 2. Knowledge Base & Docs Ingestion */}
                <div className="bg-[#10101C] border border-[#1E1E2E] rounded-2xl p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">Knowledge base</span>
                      <span className="text-[10px] font-mono text-gray-400">3 articles grounded</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-2 rounded-xl bg-[#161624] border border-[#242438] flex items-center justify-between">
                        <span className="text-gray-200 truncate">Payments FAQ · v14</span>
                        <span className="text-[10px] font-mono text-emerald-400">100%</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#161624] border border-[#242438] flex items-center justify-between">
                        <span className="text-gray-200 truncate">Gateway delays policy · v6</span>
                        <span className="text-[10px] font-mono text-emerald-400">100%</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#161624] border border-[#242438] flex items-center justify-between">
                        <span className="text-gray-200 truncate">Refund timelines · v9</span>
                        <span className="text-[10px] font-mono text-emerald-400">100%</span>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>Docs ingestion</span>
                        <span>3 completed</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#1C1C2C] overflow-hidden">
                        <div className="w-[94%] h-full bg-gradient-to-r from-cyan-400 to-purple-500" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1C1C2C] flex items-center justify-between text-[11px] text-gray-400">
                    <span>CRM & Gateway Sync</span>
                    <span className="text-emerald-400 font-mono">Connected</span>
                  </div>
                </div>

                {/* 3. Reasoning Pipeline & Activity */}
                <div className="bg-[#10101C] border border-[#1E1E2E] rounded-2xl p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">How the AI helps</span>
                      <span className="text-[10px] font-mono text-purple-400">4-Stage Pipeline</span>
                    </div>

                    {/* 4 Pipeline stages */}
                    <div className="grid grid-cols-4 gap-1 text-center py-2 border-y border-[#1C1C2C]">
                      <div className="space-y-1">
                        <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-[#00F0FF] mx-auto flex items-center justify-center text-[10px] font-bold">1</div>
                        <div className="text-[9px] text-gray-400">Incoming</div>
                      </div>
                      <div className="space-y-1">
                        <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 mx-auto flex items-center justify-center text-[10px] font-bold">2</div>
                        <div className="text-[9px] text-gray-400">Reasoning</div>
                      </div>
                      <div className="space-y-1">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center text-[10px] font-bold">3</div>
                        <div className="text-[9px] text-gray-400">Action</div>
                      </div>
                      <div className="space-y-1">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center text-[10px] font-bold">4</div>
                        <div className="text-[9px] text-gray-400">Result</div>
                      </div>
                    </div>

                    {/* Recent activity log */}
                    <div className="mt-3 space-y-1.5">
                      <div className="text-[10px] font-mono text-gray-400 uppercase">Recent Activity</div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-300">Refund approved ₹1,200</span>
                        <span className="text-emerald-400 font-mono text-[10px]">Completed</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-300">Ticket routed to Priya</span>
                        <span className="text-cyan-400 font-mono text-[10px]">P1 Assigned</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1C1C2C]">
                    <NavLink
                      to="/dashboard"
                      className="w-full py-2 rounded-xl text-center text-xs font-bold bg-[#181826] hover:bg-[#202032] text-white border border-[#2E2E42] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Open Operations Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </NavLink>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Bottom CTA Banner */}
      <section className="border-t border-[#1E1E2C] py-8 bg-[#09090E]">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00F0FF] to-[#BD00FF] p-[1px]">
              <div className="w-full h-full bg-[#0C0C14] rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 text-[#00F0FF]" />
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-white">Experience Autonomous Customer Operations</div>
              <div className="text-xs text-gray-400">Try the customer portal or support agent copilot desk with live mock data.</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NavLink
              to="/user"
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#00F0FF] bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all"
            >
              Customer Portal (/user)
            </NavLink>
            <NavLink
              to="/inbox"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-[#FFB33F] hover:bg-[#F5A623] shadow-[0_0_15px_rgba(255,179,63,0.3)] transition-all flex items-center gap-1.5"
            >
              <span>Agent Workspace (/inbox)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>
        </div>
      </section>
    </div>
  );
};
