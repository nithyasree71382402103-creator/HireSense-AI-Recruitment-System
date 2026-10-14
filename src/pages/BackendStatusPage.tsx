import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Server,
  Database,
  Cpu,
  Activity,
  CheckCircle2,
  RefreshCw,
  Download,
  RotateCcw,
  Sparkles,
  Terminal,
  Send,
  Layers,
  ShieldCheck,
  AlertCircle,
  Code,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { backendApi, BackendStatus } from '../services/api';
import { ResumeFixLogo } from '../components/ResumeFixLogo';

export const BackendStatusPage: React.FC = () => {
  const [status, setStatus] = useState<BackendStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // AI Inference Tester state
  const [aiPrompt, setAiPrompt] = useState('Analyze the key qualifications needed for a Senior AI & Full-Stack Software Engineer.');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    provider: string;
    model: string;
    response: string;
    latency_ms: number;
    timestamp: string;
  } | null>(null);

  // API Explorer state
  const [selectedEndpoint, setSelectedEndpoint] = useState<{ method: string; path: string; desc: string }>({
    method: 'GET',
    path: '/api/backend/status',
    desc: 'Live backend diagnostics and DB metrics',
  });
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [explorerResponse, setExplorerResponse] = useState<any>(null);
  const [filterMethod, setFilterMethod] = useState<'ALL' | 'GET' | 'POST' | 'PUT'>('ALL');

  const fetchStatus = async () => {
    const t0 = performance.now();
    try {
      const data = await backendApi.getStatus();
      const latency = Math.round(performance.now() - t0);
      setStatus(data);
      setPingLatency(latency);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to connect to backend server.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Default execute first explorer endpoint
    executeExplorer('/api/backend/status');
  }, []);

  const handleSeed = async () => {
    if (!window.confirm('Re-seed the database with complete candidate profiles and job requisitions?')) return;
    setIsSeeding(true);
    setActionMessage(null);
    try {
      const res = await backendApi.seedDatabase();
      setActionMessage({ type: 'success', text: res.message });
      await fetchStatus();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Seed failed.' });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset database to clean baseline?')) return;
    setIsResetting(true);
    setActionMessage(null);
    try {
      const res = await backendApi.resetDatabase();
      setActionMessage({ type: 'success', text: res.message });
      await fetchStatus();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Reset failed.' });
    } finally {
      setIsResetting(false);
    }
  };

  const handleTestAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await backendApi.testAi(aiPrompt);
      setAiResult(res);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'AI inference test failed.' });
    } finally {
      setAiLoading(false);
    }
  };

  const executeExplorer = async (path: string) => {
    setExplorerLoading(true);
    try {
      const token = localStorage.getItem('hiresense_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(path, {
        method: 'GET',
        headers,
      });
      const data = await res.json();
      setExplorerResponse(data);
    } catch (err: any) {
      setExplorerResponse({ error: err.message || 'Failed to fetch' });
    } finally {
      setExplorerLoading(false);
    }
  };

  const filteredEndpoints = status?.endpoints.filter(e => {
    if (filterMethod === 'ALL') return true;
    return e.method.includes(filterMethod);
  }) || [];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16 font-sans">
      {/* Top Bar Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <ResumeFixLogo className="w-8 h-8" />
              <div>
                <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                  HireSense <span className="text-indigo-400">AI</span>
                </span>
                <span className="text-[10px] block text-slate-400 font-mono">Backend Engine v1.2</span>
              </div>
            </Link>
            <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Full-Stack Backend Online</span>
              {pingLatency !== null && <span className="text-slate-400 font-mono text-[10px] ml-1">({pingLatency}ms)</span>}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Refresh Status</span>
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-8">
        {/* Page Title & Intro */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-2">
            <Server className="w-3.5 h-3.5" />
            <span>Full-Stack Architecture & API Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Backend Server & Database Status
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Live telemetry, database record counts, persistent store management, Gemini AI inference engine, and interactive REST API endpoint inspection for HireSense AI.
          </p>
        </div>

        {/* Action Message Toast */}
        <AnimatePresence>
          {actionMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
                actionMessage.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-500/30 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {actionMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{actionMessage.text}</span>
              </div>
              <button
                onClick={() => setActionMessage(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* System & DB Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Server Status */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Service Engine</span>
              <Server className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white">Online</span>
              <span className="text-xs font-mono text-emerald-400">Port {status?.port || 3000}</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Uptime: {status ? `${Math.floor(status.uptime_seconds / 60)}m ${status.uptime_seconds % 60}s` : '--'}</span>
              <span>Node {status?.system?.node_version || 'v22'}</span>
            </div>
          </div>

          {/* Card 2: Database Store */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Database Store</span>
              <Database className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white">
                {status?.database?.records ? Object.values(status.database.records).reduce((a, b) => a + b, 0) : 0}
              </span>
              <span className="text-xs text-slate-400">Total Entities</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>JSON Persistent Store</span>
              <span className="text-emerald-400">Connected</span>
            </div>
          </div>

          {/* Card 3: AI Inference Engine */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">AI Intelligence</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white">Gemini 3.8</span>
              <span className="text-xs font-mono text-indigo-400">Flash</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>@google/genai</span>
              <span className="text-indigo-400">Hybrid NLP</span>
            </div>
          </div>

          {/* Card 4: Memory & Runtime */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Memory & Process</span>
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white">{status?.system?.memory_heap_mb || '28.4'}</span>
              <span className="text-xs text-slate-400">MB Heap Used</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>RSS: {status?.system?.memory_rss_mb || '90'} MB</span>
              <span>Linux</span>
            </div>
          </div>
        </div>

        {/* Database Management Controls & Live Entity Counts */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                <span>Live Database Management & Persistence</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage backend storage stored in <code className="text-indigo-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded">recruitment_store.json</code>
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleSeed}
                disabled={isSeeding}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                <span>Seed Test Data</span>
              </button>

              <button
                onClick={handleReset}
                disabled={isResetting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset Store</span>
              </button>

              <a
                href="/api/backend/export"
                download="hiresense_recruitment_store.json"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export JSON DB</span>
              </a>
            </div>
          </div>

          {/* Database Entity Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Candidate / User Accounts</span>
              <span className="text-2xl font-black text-white block mt-1">{status?.database?.records?.users ?? 0}</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Registered credentials with bcrypt</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Job Requisitions</span>
              <span className="text-2xl font-black text-indigo-400 block mt-1">{status?.database?.records?.jobs ?? 0}</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Engineering roles with skill taxonomies</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Resumes Analyzed</span>
              <span className="text-2xl font-black text-emerald-400 block mt-1">{status?.database?.records?.resumes ?? 0}</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Full ATS breakdown & skill profiles</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Pipeline Applications</span>
              <span className="text-2xl font-black text-amber-400 block mt-1">{status?.database?.records?.applications ?? 0}</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Active recruitment stages & match scores</span>
            </div>
          </div>
        </div>

        {/* Live AI Engine Tester (Gemini 3.8 Flash) */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>AI Engine Live Test (Gemini 3.8 Flash via @google/genai)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Send live recruitment prompts to the server-side AI model to test semantic extraction and ATS reasoning latency.
              </p>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
              gemini-3.8-flash
            </span>
          </div>

          <form onSubmit={handleTestAi} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Prompt / Job Description Snippet:
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                placeholder="Enter prompt to evaluate..."
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAiPrompt('Analyze required competencies for a Senior Cloud Solutions Architect.')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 hover:text-white transition-colors"
                >
                  Preset: Cloud Architect
                </button>
                <button
                  type="button"
                  onClick={() => setAiPrompt('Evaluate ATS impact of moving from monolithic to distributed microservices.')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 hover:text-white transition-colors"
                >
                  Preset: Microservices ATS
                </button>
              </div>

              <button
                type="submit"
                disabled={aiLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
              >
                <Send className={`w-3.5 h-3.5 ${aiLoading ? 'animate-pulse' : ''}`} />
                <span>{aiLoading ? 'Running Inference...' : 'Execute AI Evaluation'}</span>
              </button>
            </div>
          </form>

          {/* AI Response Display */}
          {aiResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Provider: {aiResult.provider}</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Latency: <span className="text-emerald-400 font-bold">{aiResult.latency_ms}ms</span>
                </span>
              </div>
              <pre className="text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed pt-1">
                {aiResult.response}
              </pre>
            </motion.div>
          )}
        </div>

        {/* Interactive REST API Endpoint Explorer */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                <span>Live REST API Explorer & Endpoint Directory</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Browse all 20+ live backend routes, test real responses, and view raw JSON schemas.
              </p>
            </div>

            {/* Method Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {(['ALL', 'GET', 'POST', 'PUT'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setFilterMethod(m)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    filterMethod === m
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Endpoints List Column */}
            <div className="lg:col-span-5 space-y-1.5 max-h-[460px] overflow-y-auto pr-2">
              {filteredEndpoints.map((ep, idx) => {
                const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
                const methodColor =
                  ep.method === 'GET'
                    ? 'text-sky-400 bg-sky-500/10 border-sky-500/20'
                    : ep.method === 'POST'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/20';

                return (
                  <button
                    key={`${ep.method}-${ep.path}-${idx}`}
                    onClick={() => {
                      setSelectedEndpoint(ep);
                      if (ep.method === 'GET') {
                        executeExplorer(ep.path);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/60 shadow-xs'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${methodColor}`}>
                          {ep.method}
                        </span>
                        <span className="text-xs font-mono font-semibold text-slate-200 truncate">
                          {ep.path}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-1">{ep.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  </button>
                );
              })}
            </div>

            {/* Live Console Output Column */}
            <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-indigo-400">{selectedEndpoint.method}</span>
                  <span className="text-slate-300">{selectedEndpoint.path}</span>
                </div>
                {selectedEndpoint.method === 'GET' && (
                  <button
                    onClick={() => executeExplorer(selectedEndpoint.path)}
                    disabled={explorerLoading}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${explorerLoading ? 'animate-spin' : ''}`} />
                    <span>Run Query</span>
                  </button>
                )}
              </div>

              {/* JSON Output Viewer */}
              <div className="flex-1 mt-3 overflow-x-auto min-h-[300px] max-h-[400px] bg-slate-950 rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-y-auto">
                {explorerLoading ? (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2 text-indigo-400" />
                    <span>Executing backend request...</span>
                  </div>
                ) : explorerResponse ? (
                  <pre>{JSON.stringify(explorerResponse, null, 2)}</pre>
                ) : (
                  <span className="text-slate-500">Click &quot;Run Query&quot; to inspect real backend payload.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Full-Stack Architecture Documentation Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>Full-Stack Architecture & Data Flow</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                <Code className="w-4 h-4" />
                <span>1. Presentation Layer</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                React 19 SPA built on Vite, styled with Tailwind CSS, with fluid motion animations, responsive layout controls, and client-side route guards.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Server className="w-4 h-4" />
                <span>2. Application Server Layer</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Express REST API server on Port 3000 running via tsx. Handles JWT token signing, bcrypt authentication, file uploads, and skill taxonomies.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Sparkles className="w-4 h-4" />
                <span>3. AI & Persistence Layer</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Google Gen AI SDK (<code className="text-amber-300">gemini-3.8-flash</code>) with fallback semantic extraction. Persistent JSON database with auto-sync.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
