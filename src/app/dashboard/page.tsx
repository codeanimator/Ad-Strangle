"use client";

import React, { useState, useEffect } from 'react';
import { ViolationsTable, Violation } from '@/components/ViolationsTable';
import { Shield, Zap, Target, Activity, Loader2, Search, Crosshair, Radar } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

interface Discovery {
  id: string;
  assetName: string;
  targets: string[];
  status: string;
  timestamp: any;
}

export default function Dashboard() {
  const [inputValue, setInputValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [mode, setMode] = useState<'URL' | 'SND'>('URL'); // URL or Search & Destroy
  const [violations, setViolations] = useState<Violation[]>([]);
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    threats: 0,
    successRate: '98.2%',
    health: 'Optimal'
  });

  // Real-time Listener for Firestore (Violations)
  useEffect(() => {
    const vQuery = query(collection(db, 'violations'), orderBy('timestamp', 'desc'));
    const unsubscribeV = onSnapshot(vQuery, (snapshot) => {
      const vList: Violation[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Violation[];
      setViolations(vList);
      setStats(prev => ({
        ...prev,
        total: vList.length,
        threats: vList.filter(v => v.status === 'Escalated').length
      }));
    });

    // Real-time Listener for Discoveries
    const dQuery = query(collection(db, 'discoveries'), orderBy('timestamp', 'desc'));
    const unsubscribeD = onSnapshot(dQuery, (snapshot) => {
      const dList: Discovery[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Discovery[];
      setDiscoveries(dList);
    });

    return () => {
      unsubscribeV();
      unsubscribeD();
    };
  }, []);

  const startMission = async () => {
    if (!inputValue) return;
    setIsScanning(true);
    
    try {
      if (mode === 'URL') {
        // Prevent users from accidentally sending search terms to the URL scanner
        if (!inputValue.includes('.') && !inputValue.startsWith('http')) {
          alert("Invalid URL. Did you mean to use 'Search & Destroy' mode?");
          setIsScanning(false);
          return;
        }

        // Auto-format the URL
        const formattedUrl = inputValue.startsWith('http') ? inputValue : `https://${inputValue}`;
        
        await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUrl: formattedUrl }),
        });
      } else {
        await fetch('/api/search-and-destroy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assetName: inputValue }),
        });
      }
      setInputValue('');
    } catch (error) {
      console.error('Mission failed:', error);
      alert('Mission failed to launch. Check console for details.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white p-8 bg-grid">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight glow-text bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
              Telemetry Center
            </h1>
            <p className="text-gray-400 mt-1">Autonomous Revenue Diversion Monitoring</p>
          </div>
          
          <div className="flex flex-col gap-3 w-full md:w-auto">
            {/* Mode Toggles */}
            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10 w-fit">
              <button 
                onClick={() => setMode('URL')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${mode === 'URL' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-white'}`}
              >
                <Target className="w-4 h-4" /> Single Target
              </button>
              <button 
                onClick={() => setMode('SND')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${mode === 'SND' ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-white'}`}
              >
                <Crosshair className="w-4 h-4" /> Search & Destroy
              </button>
            </div>

            {/* Input Bar */}
            <div className="flex gap-3">
              <div className="relative flex-grow md:w-96 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className={`h-4 w-4 transition-colors ${mode === 'URL' ? 'text-cyan-400' : 'text-red-400'}`} />
                </div>
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={mode === 'URL' ? "Enter Target URL (e.g., https://site.com)" : "Enter Brand/Asset Name (e.g., House of the Dragon)"}
                  className={`w-full bg-white/5 border rounded-lg py-2 pl-10 pr-4 focus:outline-none transition-all text-sm placeholder:text-gray-600 ${mode === 'URL' ? 'border-white/10 focus:border-cyan-500' : 'border-red-500/30 focus:border-red-500 bg-red-500/5'}`}
                />
              </div>
              <button 
                onClick={startMission}
                disabled={isScanning || !inputValue}
                className={`px-6 py-2 font-bold rounded-lg transition-all active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-black ${mode === 'URL' ? 'bg-cyan-500 hover:bg-cyan-400' : 'bg-red-500 hover:bg-red-400'}`}
              >
                {isScanning ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {mode === 'URL' ? 'Scanning...' : 'Searching...'}</>
                ) : (
                  <>{mode === 'URL' ? 'Scan Target' : 'Launch Fleet'}</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Violations" value={stats.total.toLocaleString()} icon={<Shield className="text-purple-500" />} change="live" />
          <StatCard title="Active Threats" value={stats.threats.toString()} icon={<Zap className="text-yellow-500" />} change="live" />
          <StatCard title="Discoveries" value={discoveries.length.toString()} icon={<Radar className="text-red-500" />} change="fleet" />
          <StatCard title="System Health" value={stats.health} icon={<Activity className="text-cyan-500" />} change="stable" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                Forensic Discovery Feed
              </h2>
            </div>
            <ViolationsTable data={violations} />
          </div>

          {/* Discovery Feed Sidebar */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Radar className="w-5 h-5 text-red-400" />
              Telemetry Feed
            </h2>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 h-[600px] overflow-y-auto space-y-4">
              {discoveries.length === 0 ? (
                <p className="text-sm text-gray-500 italic text-center mt-10">No Search & Destroy fleets deployed.</p>
              ) : (
                discoveries.map(d => (
                  <div key={d.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-red-400 text-sm truncate">{d.assetName}</span>
                      <span className="text-[10px] uppercase tracking-wider text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">Active</span>
                    </div>
                    <div className="space-y-1">
                      {d.targets.slice(0,3).map((t, i) => (
                        <div key={i} className="text-xs text-gray-400 truncate flex items-center gap-1.5">
                          <Target className="w-3 h-3 text-gray-600" />
                          {t.replace('https://', '')}
                        </div>
                      ))}
                      {d.targets.length > 3 && (
                        <div className="text-xs text-gray-500 pt-1">+ {d.targets.length - 3} more targets</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}

function StatCard({ title, value, icon, change }: { title: string; value: string; icon: React.ReactNode; change: string }) {
  return (
    <div className="glass-card p-6 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <span className="text-gray-400 text-sm font-medium">{title}</span>
        <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs mt-1 text-gray-500">
          <span className={change === 'live' ? 'text-green-400' : 'text-gray-400'}>{change.toUpperCase()}</span> update
        </div>
      </div>
    </div>
  );
}
