import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { settingsService } from '../services/settingsService';
import { AgentSettings } from '../types';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  Settings as SettingsIcon,
  Building,
  Bot,
  Users,
  Palette,
  User,
  Save,
  RotateCcw,
  CheckCircle2,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'general' | 'aiAgent' | 'humanSupport' | 'appearance' | 'account'>('general');
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const data = await settingsService.getSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      await settingsService.updateSettings(settings);
      success('Settings updated successfully!');
    } catch {
      error('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    const data = await settingsService.getSettings();
    setSettings(data);
    success('Changes discarded.');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading || !settings) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-xs text-gray-500">Loading settings...</div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Building },
    { id: 'aiAgent', label: 'AI Agent', icon: Bot },
    { id: 'humanSupport', label: 'Human Support', icon: Users },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'account', label: 'Account', icon: User },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-[#FFB33F]" />
              Platform Settings
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Configure your business identity, AI agent behavior, and human handover preferences.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSaving}
              onClick={handleSave}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save Changes
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#292932] overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-[#FFB33F] text-[#FFB33F] bg-[#191920]'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="bg-[#14141B] border border-[#292932] rounded-2xl p-6 shadow-xl space-y-6 text-xs">
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white">Company Information</h3>
              <div className="space-y-3.5 max-w-xl">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Company Name</label>
                  <input
                    type="text"
                    value={settings.general.companyName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, companyName: e.target.value },
                      })
                    }
                    className="w-full bg-[#191920] border border-[#292932] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FFB33F]"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Website</label>
                  <input
                    type="url"
                    value={settings.general.website}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, website: e.target.value },
                      })
                    }
                    className="w-full bg-[#191920] border border-[#292932] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FFB33F]"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Business Description</label>
                  <textarea
                    rows={4}
                    value={settings.general.businessDescription}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, businessDescription: e.target.value },
                      })
                    }
                    className="w-full bg-[#191920] border border-[#292932] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FFB33F]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI AGENT */}
          {activeTab === 'aiAgent' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white">AI Agent Parameters</h3>
              <div className="space-y-3.5 max-w-xl">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Agent Name</label>
                  <input
                    type="text"
                    value={settings.aiAgent.agentName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        aiAgent: { ...settings.aiAgent, agentName: e.target.value },
                      })
                    }
                    className="w-full bg-[#191920] border border-[#292932] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FFB33F]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Default Language</label>
                    <select
                      value={settings.aiAgent.language}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          aiAgent: { ...settings.aiAgent, language: e.target.value as any },
                        })
                      }
                      className="w-full bg-[#191920] border border-[#292932] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FFB33F]"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Hinglish">Hinglish</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold block mb-1">Tone & Voice</label>
                    <select
                      value={settings.aiAgent.tone}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          aiAgent: { ...settings.aiAgent, tone: e.target.value as any },
                        })
                      }
                      className="w-full bg-[#191920] border border-[#292932] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FFB33F]"
                    >
                      <option value="Friendly">Friendly</option>
                      <option value="Professional">Professional</option>
                      <option value="Formal">Formal</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#191920] border border-[#292932] flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block">Automatic AI Responses</span>
                    <span className="text-[11px] text-gray-400">
                      Instantly answer customer inquiries when knowledge base confidence is high
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        aiAgent: { ...settings.aiAgent, autoResponse: !settings.aiAgent.autoResponse },
                      })
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      settings.aiAgent.autoResponse ? 'bg-[#FFB33F]' : 'bg-[#292932]'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-transform ${
                        settings.aiAgent.autoResponse ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HUMAN SUPPORT */}
          {activeTab === 'humanSupport' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white">Human Support Handover & Hours</h3>
              <div className="space-y-3.5 max-w-xl">
                <div className="p-4 rounded-xl bg-[#191920] border border-[#292932] flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block">Enable Human Handover</span>
                    <span className="text-[11px] text-gray-400">
                      Allows agents to take over conversations and pauses AI autopilot
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        humanSupport: {
                          ...settings.humanSupport,
                          enableHandover: !settings.humanSupport.enableHandover,
                        },
                      })
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      settings.humanSupport.enableHandover ? 'bg-[#FFB33F]' : 'bg-[#292932]'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-transform ${
                        settings.humanSupport.enableHandover ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Support Hours</label>
                  <input
                    type="text"
                    value={settings.humanSupport.supportHours}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        humanSupport: { ...settings.humanSupport, supportHours: e.target.value },
                      })
                    }
                    className="w-full bg-[#191920] border border-[#292932] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FFB33F]"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-semibold block mb-1.5">Escalation Triggers</label>
                  <div className="space-y-2">
                    {settings.humanSupport.escalationTriggers.map((trig, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-[#191920] border border-[#292932] flex items-center gap-2 text-gray-300"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FFB33F] shrink-0" />
                        <span>{trig}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white">Appearance & Branding</h3>
              <div className="space-y-3.5 max-w-xl">
                <div>
                  <label className="text-gray-300 font-semibold block mb-1">Primary Brand Accent</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.appearance.brandColor}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appearance: { ...settings.appearance, brandColor: e.target.value },
                        })
                      }
                      className="w-10 h-10 rounded-lg bg-transparent border border-[#292932] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.appearance.brandColor}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appearance: { ...settings.appearance, brandColor: e.target.value },
                        })
                      }
                      className="w-32 bg-[#191920] border border-[#292932] rounded-xl px-3 py-2 text-white font-mono text-xs"
                    />
                    <span className="text-gray-400 text-[11px]">DeskPilot Amber Accent</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#191920] border border-[#292932]">
                  <span className="font-semibold text-white block mb-1">Live Widget Preview Color</span>
                  <div className="flex items-center gap-3 mt-2">
                    <div
                      className="px-4 py-2 rounded-xl text-black font-bold text-xs"
                      style={{ backgroundColor: settings.appearance.brandColor }}
                    >
                      DeskPilot Assistant
                    </div>
                    <span className="text-gray-400 text-[11px]">Widget Primary Button</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ACCOUNT */}
          {activeTab === 'account' && (
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-white">Account & Profile</h3>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#191920] border border-[#292932] max-w-xl">
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={user?.fullName || 'User'}
                  className="w-14 h-14 rounded-full object-cover border border-[#292932]"
                />
                <div>
                  <div className="text-sm font-bold text-white">{user?.fullName || 'Rahul Sharma'}</div>
                  <div className="text-gray-400">{user?.email || 'rahul@deskpilot.ai'}</div>
                  <div className="text-[11px] text-[#FFB33F] mt-1 font-semibold">{user?.role || 'Support Lead'} • {user?.companyName}</div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleLogout}
                  leftIcon={<LogOut className="w-3.5 h-3.5" />}
                >
                  Log Out of DeskPilot
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
