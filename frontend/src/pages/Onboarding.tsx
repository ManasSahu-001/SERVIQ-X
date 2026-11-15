import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Building,
  UploadCloud,
  FileText,
  Sliders,
  Shield,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { useToast } from '../contexts/ToastContext';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Business Details
  const [companyName, setCompanyName] = useState('Acme SaaS Corp');
  const [website, setWebsite] = useState('https://acme.example.com');
  const [industry, setIndustry] = useState('B2B SaaS / Software');
  const [description, setDescription] = useState(
    'Cloud-native developer tooling and infrastructure orchestration platform.'
  );

  // Step 2: Knowledge Base
  const [uploadedFiles, setUploadedFiles] = useState<
    { name: string; size: string; status: 'ready' | 'uploading' }[]
  >([
    { name: 'DeskPilot_Refund_Policy_2026.pdf', size: '1.4 MB', status: 'ready' },
    { name: 'Payment_Gateway_Reconciliation_FAQ.txt', size: '124 KB', status: 'ready' },
  ]);
  const [isUploading, setIsUploading] = useState(false);

  // Step 3: AI Configuration
  const [agentName, setAgentName] = useState('DeskPilot AI');
  const [language, setLanguage] = useState<'English' | 'Hindi' | 'Hinglish'>('English');
  const [tone, setTone] = useState<'Friendly' | 'Professional' | 'Formal'>('Professional');
  const [autoResponse, setAutoResponse] = useState(true);

  // Step 4: Support Configuration
  const [enableHandover, setEnableHandover] = useState(true);
  const [supportHours, setSupportHours] = useState('9:00 AM - 8:00 PM IST (Mon-Sat)');
  const [handoverTriggers, setHandoverTriggers] = useState<string[]>([
    'Customer requests human agent',
    'Payment disputes or refund requests over ₹2,000',
    'Repeated negative sentiment or escalation keyword',
  ]);
  const [customTriggerInput, setCustomTriggerInput] = useState('');


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const valid = ['.pdf', '.txt'].some((ext) => file.name.toLowerCase().endsWith(ext));
      if (!valid) {
        error('Please upload PDF or TXT files only.');
        return;
      }

      setIsUploading(true);
      setTimeout(() => {
        setUploadedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            size: `${(file.size / 1024).toFixed(0)} KB`,
            status: 'ready',
          },
        ]);
        setIsUploading(false);
        success(`"${file.name}" indexed for onboarding!`);
      }, 500);
    }
  };

  const removeFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const stepsMeta = [
    { num: 1, title: 'Business Details', icon: Building },
    { num: 2, title: 'Knowledge Base', icon: UploadCloud },
    { num: 3, title: 'AI Configuration', icon: Sliders },
    { num: 4, title: 'Support Handover', icon: Shield },
    { num: 5, title: 'Ready', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-[#F5F5F5] flex flex-col items-center justify-center p-6 selection:bg-[#FFB33F] selection:text-black">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-xl bg-[#FFB33F] flex items-center justify-center shadow-[0_0_15px_rgba(255,179,63,0.3)]">
          <Bot className="w-5 h-5 text-black" />
        </div>
        <span className="font-bold text-white text-lg tracking-tight">DeskPilot Setup</span>
      </div>

      <div className="w-full max-w-2xl bg-[#14141B] border border-[#292932] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#292932]">
          {stepsMeta.map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div key={s.num} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isCurrent
                      ? 'bg-[#FFB33F] text-black shadow-[0_0_15px_rgba(255,179,63,0.3)]'
                      : 'bg-[#191920] text-gray-500 border border-[#292932]'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-[10px] hidden sm:block ${
                    isCurrent ? 'text-[#FFB33F] font-semibold' : 'text-gray-400'
                  }`}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* STEP 1: BUSINESS DETAILS */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Step 1: Business Details</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Tell DeskPilot about your company so responses are personalized.
              </p>
            </div>

            <div className="space-y-3.5 pt-2 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#191920] border border-[#292932] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FFB33F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Website URL</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full bg-[#191920] border border-[#292932] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FFB33F]"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Industry</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full bg-[#191920] border border-[#292932] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FFB33F]"
                  >
                    <option value="B2B SaaS / Software">B2B SaaS / Software</option>
                    <option value="D2C / E-commerce">D2C / E-commerce</option>
                    <option value="Fintech & Banking">Fintech & Banking</option>
                    <option value="EdTech">EdTech</option>
                    <option value="Healthcare">Healthcare</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Business Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#191920] border border-[#292932] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FFB33F]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: KNOWLEDGE BASE */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Step 2: Knowledge Base</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Upload your policy documents and FAQs so your AI agent knows your product rules.
              </p>
            </div>

            {/* Upload Box */}
            <label className="border-2 border-dashed border-[#292932] hover:border-[#FFB33F] rounded-2xl p-6 text-center block cursor-pointer bg-[#191920] transition-colors">
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <UploadCloud className="w-8 h-8 text-[#FFB33F] mx-auto mb-2" />
              <div className="text-xs font-semibold text-white">
                {isUploading ? 'Uploading and generating embeddings...' : 'Click to upload PDF or TXT documents'}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Refund policy, shipping terms, API guides</p>
            </label>

            {/* Uploaded documents list */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Indexed Documents ({uploadedFiles.length})
              </span>
              {uploadedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#191920] border border-[#292932] text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-[#FFB33F] shrink-0" />
                    <span className="text-white font-medium truncate">{file.name}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">({file.size})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-gray-500 hover:text-rose-400 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: AI CONFIGURATION */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Step 3: AI Configuration</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Customize how your autonomous agent talks to customers.
              </p>
            </div>

            <div className="space-y-3.5 pt-2 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Agent Name</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full bg-[#191920] border border-[#292932] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FFB33F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Preferred Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as any)}
                    className="w-full bg-[#191920] border border-[#292932] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FFB33F]"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Hinglish">Hinglish (Urban Conversational)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Communication Style</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as any)}
                    className="w-full bg-[#191920] border border-[#292932] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FFB33F]"
                  >
                    <option value="Friendly">Friendly & Empathetic</option>
                    <option value="Professional">Professional & Direct</option>
                    <option value="Formal">Formal & Enterprise</option>
                  </select>
                </div>
              </div>

              {/* Automatic responses toggle */}
              <div className="p-4 rounded-xl bg-[#191920] border border-[#292932] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Automatic Responses</span>
                  <span className="text-[11px] text-gray-400">
                    Allow AI to reply automatically when confidence exceeds 85%
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoResponse(!autoResponse)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    autoResponse ? 'bg-[#FFB33F]' : 'bg-[#292932]'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-transform ${
                      autoResponse ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SUPPORT CONFIGURATION */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Step 4: Support Configuration</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Define the guardrails for human agent escalations.
              </p>
            </div>

            <div className="space-y-3.5 pt-2 text-xs">
              {/* Handover toggle */}
              <div className="p-4 rounded-xl bg-[#191920] border border-[#292932] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Enable Human Handover</span>
                  <span className="text-[11px] text-gray-400">
                    Allow human agents to seamlessly take over tickets with one click
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableHandover(!enableHandover)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    enableHandover ? 'bg-[#FFB33F]' : 'bg-[#292932]'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-transform ${
                      enableHandover ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Business Support Hours</label>
                <input
                  type="text"
                  value={supportHours}
                  onChange={(e) => setSupportHours(e.target.value)}
                  className="w-full bg-[#191920] border border-[#292932] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FFB33F]"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1.5">
                  Escalation Triggers (Human Support Required When)
                </label>
                <div className="space-y-2 mb-3">
                  {handoverTriggers.map((trig, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-[#191920] border border-[#292932] flex items-center justify-between gap-2 text-gray-300"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#FFB33F] shrink-0" />
                        <span>{trig}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHandoverTriggers((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-gray-500 hover:text-rose-400 p-1 cursor-pointer"
                        title="Remove trigger"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new trigger input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add custom escalation rule (e.g. Chargeback threats)..."
                    value={customTriggerInput}
                    onChange={(e) => setCustomTriggerInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (customTriggerInput.trim()) {
                          setHandoverTriggers((prev) => [...prev, customTriggerInput.trim()]);
                          setCustomTriggerInput('');
                        }
                      }
                    }}
                    className="flex-1 bg-[#191920] border border-[#292932] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FFB33F]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customTriggerInput.trim()) {
                        setHandoverTriggers((prev) => [...prev, customTriggerInput.trim()]);
                        setCustomTriggerInput('');
                      }
                    }}
                    disabled={!customTriggerInput.trim()}
                    className="px-3 py-2 rounded-xl bg-[#191920] hover:bg-[#22222C] disabled:opacity-50 text-white font-semibold border border-[#292932] text-xs cursor-pointer"
                  >
                    Add Rule
                  </button>
                </div>
              </div>
            </div>
          </div>

        )}

        {/* FINAL STEP: READY */}
        {currentStep === 5 && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFB33F] to-[#E59312] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(255,179,63,0.4)]">
              <Sparkles className="w-8 h-8 text-black" />
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight">
              Your DeskPilot is ready!
            </h2>

            <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
              Your autonomous AI agent has been initialized for <strong>{companyName}</strong> with {uploadedFiles.length} indexed documents. You can now monitor live conversations, manage tickets, and inspect AI suggestions.
            </p>

            <div className="pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  success('Welcome to your DeskPilot workspace!');
                  navigate('/dashboard');
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Open Dashboard
              </Button>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        {currentStep < 5 && (
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#292932]">
            <Button
              variant="outline"
              size="sm"
              disabled={currentStep === 1}
              onClick={prevStep}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={nextStep}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {currentStep === 4 ? 'Complete Setup' : 'Next Step'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
