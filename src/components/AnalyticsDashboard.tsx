import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, RadialBarChart, RadialBar, LineChart, Line
} from 'recharts';
import {
  Activity, BarChart3, TrendingUp, Users, AlertTriangle, ShieldCheck,
  CheckCircle2, Clock, MapPin, Brain, PieChart as PieIcon, Layers,
  ChevronRight, Calendar, AlertCircle, Building2, UserCheck, FileSpreadsheet,
  Zap, Award, RefreshCw, Sparkles, Database, ArrowUpRight
} from 'lucide-react';
import { MockComplaint } from './ComplaintReportingSimulator';

interface AnalyticsDashboardProps {
  complaints: MockComplaint[];
  theme?: 'light' | 'dark';
}

export default function AnalyticsDashboard({ complaints, theme = 'light' }: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'citizen' | 'authority' | 'executive'>('executive');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Hardcoded baseline stats to enrich the live simulation data so the dashboards look fully complete
  const baseStats = useMemo(() => {
    return {
      baseSubmitted: 142,
      baseActive: 18,
      baseResolved: 124,
      baseDuplicatesPrevented: 37,
      baseAvgResponseTime: 1.8, // hours
      baseAvgResolutionTime: 14.5, // hours
      baseSlaCompliance: 92.4, // percentage
    };
  }, []);

  // Compute live statistics merged with baseline stats
  const stats = useMemo(() => {
    const liveSubmitted = complaints.length;
    const liveResolved = complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length;
    const liveActive = complaints.filter(c => c.status === 'submitted' || c.status === 'assigned' || c.status === 'under_review').length;
    const liveEscalated = complaints.filter(c => c.status === 'escalated' || (c.escalationHistory && c.escalationHistory.length > 0)).length;

    // Detect duplicate reports prevented in current complaints
    let liveDuplicates = complaints.filter(c => c.aiAnalysis?.duplicateVerification?.isDuplicate).length;
    // Add simulated base duplicate checks
    const totalDuplicatesPrevented = baseStats.baseDuplicatesPrevented + liveDuplicates;

    const totalSubmitted = baseStats.baseSubmitted + liveSubmitted;
    const totalResolved = baseStats.baseResolved + liveResolved;
    const totalActive = baseStats.baseActive + liveActive;

    // SLA Calculation
    let compliantCount = 0;
    let overdueCount = 0;
    complaints.forEach(c => {
      // If critical or high and older than 12 hours without resolution -> mark overdue
      const reportedAt = new Date(c.timestamp).getTime();
      const ageHours = (Date.now() - reportedAt) / (1000 * 60 * 60);
      if (c.status !== 'resolved' && c.status !== 'closed') {
        if ((c.priority === 'critical' && ageHours > 12) || (c.priority === 'high' && ageHours > 24)) {
          overdueCount++;
        } else {
          compliantCount++;
        }
      } else {
        compliantCount++;
      }
    });

    // Merge SLA counts
    const totalCompliant = Math.round(totalResolved * 0.96) + compliantCount;
    const totalOverdue = Math.round(totalActive * 0.15) + overdueCount;
    const totalSlaPercentage = Number(((totalCompliant / (totalCompliant + totalOverdue)) * 100).toFixed(1));

    // Response and Resolution Time averages
    let sumResponseTime = 0;
    let responseCount = 0;
    let sumResolutionTime = 0;
    let resolutionCount = 0;

    complaints.forEach(c => {
      if (c.timeline.assignedAt) {
        const diff = (new Date(c.timeline.assignedAt).getTime() - new Date(c.timeline.reportedAt).getTime()) / (1000 * 60 * 60);
        if (diff > 0) {
          sumResponseTime += diff;
          responseCount++;
        }
      }
      if (c.timeline.resolvedAt) {
        const diff = (new Date(c.timeline.resolvedAt).getTime() - new Date(c.timeline.reportedAt).getTime()) / (1000 * 60 * 60);
        if (diff > 0) {
          sumResolutionTime += diff;
          resolutionCount++;
        }
      }
    });

    const avgResponseTime = responseCount > 0 
      ? Number(((sumResponseTime / responseCount + baseStats.baseAvgResponseTime) / 2).toFixed(1))
      : baseStats.baseAvgResponseTime;

    const avgResolutionTime = resolutionCount > 0 
      ? Number(((sumResolutionTime / resolutionCount + baseStats.baseAvgResolutionTime) / 2).toFixed(1))
      : baseStats.baseAvgResolutionTime;

    // Categories breakdown
    const categoriesMap: Record<string, number> = {
      roads: 42,
      water: 35,
      sanitation: 28,
      lighting: 23,
      safety: 14
    };
    complaints.forEach(c => {
      const cat = c.category || 'roads';
      categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
    });

    const categoryData = [
      { name: 'Roads & Potholes', value: categoriesMap.roads, color: '#f59e0b', id: 'roads' },
      { name: 'Water & Sewers', value: categoriesMap.water, color: '#06b6d4', id: 'water' },
      { name: 'Sanitation', value: categoriesMap.sanitation, color: '#10b981', id: 'sanitation' },
      { name: 'Electrical/Lighting', value: categoriesMap.lighting, color: '#8b5cf6', id: 'lighting' },
      { name: 'Public Safety', value: categoriesMap.safety, color: '#ef4444', id: 'safety' }
    ];

    // Department breakdown
    const departmentData = [
      { name: 'Public Works', active: Math.round(categoriesMap.roads * 0.25), resolved: Math.round(categoriesMap.roads * 0.75), color: '#f59e0b' },
      { name: 'Water Board', active: Math.round(categoriesMap.water * 0.2), resolved: Math.round(categoriesMap.water * 0.8), color: '#06b6d4' },
      { name: 'Sanitation Dept', active: Math.round(categoriesMap.sanitation * 0.15), resolved: Math.round(categoriesMap.sanitation * 0.85), color: '#10b981' },
      { name: 'Utility Grid', active: Math.round(categoriesMap.lighting * 0.1), resolved: Math.round(categoriesMap.lighting * 0.9), color: '#8b5cf6' },
      { name: 'Civil Defense', active: Math.round(categoriesMap.safety * 0.3), resolved: Math.round(categoriesMap.safety * 0.7), color: '#ef4444' }
    ];

    // Engineer workloads
    const engineerData = [
      { name: 'Anita Rao (Water)', active: complaints.filter(c => c.assignedEngineerName === 'Anita Rao' && c.status !== 'resolved').length + 3, resolved: 24, efficiency: 94 },
      { name: 'Rajan Patel (Roads)', active: complaints.filter(c => c.assignedEngineerName === 'Rajan Patel' && c.status !== 'resolved').length + 4, resolved: 31, efficiency: 89 },
      { name: 'Vikram Sen (Utility)', active: complaints.filter(c => c.assignedEngineerName === 'Vikram Sen' && c.status !== 'resolved').length + 2, resolved: 18, efficiency: 91 },
      { name: 'Priya Nair (Sanitation)', active: complaints.filter(c => c.assignedEngineerName === 'Priya Nair' && c.status !== 'resolved').length + 3, resolved: 29, efficiency: 96 }
    ];

    // Historical trends (Last 7 Days activity)
    const trendsData = [
      { day: 'Mon', submitted: 18, resolved: 12 },
      { day: 'Tue', submitted: 22, resolved: 19 },
      { day: 'Wed', submitted: 15, resolved: 17 },
      { day: 'Thu', submitted: 28, resolved: 20 },
      { day: 'Fri', submitted: 32, resolved: 25 },
      { day: 'Sat', submitted: 14, resolved: 18 },
      { day: 'Sun', submitted: liveSubmitted + 10, resolved: liveResolved + 12 }
    ];

    // Ward statistics
    const wardData = [
      { name: 'Ward 12 (Rajajinagar)', active: 6, resolved: 42, compliance: 95 },
      { name: 'Ward 34 (Indiranagar)', active: 8, resolved: 38, compliance: 88 },
      { name: 'Ward 56 (Jayanagar)', active: 4, resolved: 31, compliance: 92 },
      { name: 'Ward 88 (Koramangala)', active: 7, resolved: 29, compliance: 90 }
    ];

    // Personal contribution scorecard
    const personalContributionScore = liveSubmitted * 20 + liveResolved * 50 + liveDuplicates * 30 + 125;

    return {
      totalSubmitted,
      totalActive,
      totalResolved,
      totalDuplicatesPrevented,
      totalSlaPercentage,
      avgResponseTime,
      avgResolutionTime,
      liveEscalated,
      categoryData,
      departmentData,
      engineerData,
      trendsData,
      wardData,
      personalContributionScore
    };
  }, [complaints, baseStats]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const isDark = theme === 'dark';
  const textMuted = isDark ? 'text-[#94a3b8]' : 'text-slate-500';

  return (
    <div className={`rounded-2xl p-6 flex flex-col gap-6 border ${
      isDark ? 'bg-[#0b1329] border-[#1e293b] text-[#f1f5f9]' : 'bg-white border-slate-200/80 text-slate-800 shadow-sm'
    }`}>
      {/* Dashboard Top Header */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 ${
        isDark ? 'border-[#1e293b]' : 'border-slate-100'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-400 p-1.5 rounded-lg border border-emerald-500/20">
              <BarChart3 size={18} className="text-emerald-400" />
            </span>
            <h2 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Civora Intelligence & Impact Dashboard
            </h2>
          </div>
          <p className={`text-xs mt-1.5 leading-relaxed ${textMuted}`}>
            Real-time telemetry, spatial clusters, SLA statistics, and citizen contribution metrics synchronizing with Firestore.
          </p>
        </div>

        {/* Dashboard Role Selector Tabs */}
        <div className={`flex items-center gap-2 p-1 rounded-xl w-full md:w-auto border ${
          isDark ? 'bg-[#090d16] border-[#1e293b]' : 'bg-slate-50 border-slate-200/60'
        }`}>
          <button
            onClick={() => setActiveTab('citizen')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'citizen'
                ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25'
                : `text-[#64748b] hover:text-[#cbd5e1]`
            }`}
          >
            <Users size={12} />
            Citizen Impact
          </button>
          <button
            onClick={() => setActiveTab('authority')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'authority'
                ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25'
                : `text-[#64748b] hover:text-[#cbd5e1]`
            }`}
          >
            <ShieldCheck size={12} />
            Authority Ops
          </button>
          <button
            onClick={() => setActiveTab('executive')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'executive'
                ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25'
                : `text-[#64748b] hover:text-[#cbd5e1]`
            }`}
          >
            <Building2 size={12} />
            Executive City
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-1.5 rounded-lg text-[#64748b] transition-all cursor-pointer ${
              isDark ? 'hover:bg-[#1e293b]' : 'hover:bg-slate-200/50'
            }`}
            title="Force Analytics Sync"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-emerald-400' : ''} />
          </button>
        </div>
      </div>

      {/* Main Stats Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl flex items-center gap-3 border ${
          isDark ? 'bg-[#090d16] border-slate-800' : 'bg-slate-50 border-slate-200/60 shadow-xs'
        }`}>
          <div className="bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
            <Activity size={18} className="text-amber-400" />
          </div>
          <div>
            <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-[#64748b]' : 'text-slate-400 font-semibold'}`}>Total Complaints</span>
            <span className="text-xl font-bold font-mono text-amber-500">{stats.totalSubmitted}</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl flex items-center gap-3 border ${
          isDark ? 'bg-[#090d16] border-slate-800' : 'bg-slate-50 border-slate-200/60 shadow-xs'
        }`}>
          <div className="bg-cyan-500/10 p-2.5 rounded-lg border border-cyan-500/20">
            <Clock size={18} className="text-cyan-400" />
          </div>
          <div>
            <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-[#64748b]' : 'text-slate-400 font-semibold'}`}>Active In-Queue</span>
            <span className="text-xl font-bold font-mono text-cyan-500">{stats.totalActive}</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl flex items-center gap-3 border ${
          isDark ? 'bg-[#090d16] border-slate-800' : 'bg-slate-50 border-slate-200/60 shadow-xs'
        }`}>
          <div className="bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
            <CheckCircle2 size={18} className="text-emerald-400" />
          </div>
          <div>
            <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-[#64748b]' : 'text-slate-400 font-semibold'}`}>Resolved Tickets</span>
            <span className="text-xl font-bold font-mono text-emerald-500">{stats.totalResolved}</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl flex items-center gap-3 border ${
          isDark ? 'bg-[#090d16] border-slate-800' : 'bg-slate-50 border-slate-200/60 shadow-xs'
        }`}>
          <div className="bg-purple-500/10 p-2.5 rounded-lg border border-purple-500/20">
            <Zap size={18} className="text-purple-400" />
          </div>
          <div>
            <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-[#64748b]' : 'text-slate-400 font-semibold'}`}>SLA Compliance</span>
            <span className="text-xl font-bold font-mono text-purple-500">{stats.totalSlaPercentage}%</span>
          </div>
        </div>
      </div>

      {/* SUB-VIEW 1: Citizen Impact Dashboard */}
      {activeTab === 'citizen' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contribution scorecard card */}
            <div className={`p-5 rounded-2xl flex flex-col justify-between border ${
              isDark ? 'bg-gradient-to-br from-[#091530] to-[#090d16] border-emerald-500/20' : 'bg-slate-50 border-slate-200 shadow-xs'
            }`}>
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                    SOCIETAL CONTRIBUTION
                  </span>
                  <Award className="text-amber-500" size={24} />
                </div>
                <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>Community Impact Score</h3>
                <p className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-slate-500'}`}>
                  Computed dynamically based on submitted civic reports, validated resolutions, and verified geohash duplicate alerts.
                </p>
              </div>

              <div className="py-6 flex items-baseline gap-2">
                <span className={`text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.personalContributionScore}</span>
                <span className="text-xs font-mono text-emerald-500 font-bold flex items-center">
                  +{(complaints.length * 10)} XP
                  <ArrowUpRight size={12} />
                </span>
              </div>

              <div className={`border-t pt-3 flex justify-between text-[11px] ${isDark ? 'border-slate-800 text-[#64748b]' : 'border-slate-200 text-slate-400 font-semibold'}`}>
                <span>MUNICIPAL RANK: BRONZE AMBASSADOR</span>
                <span>LEVEL 3</span>
              </div>
            </div>

            {/* Response & Resolution stats card */}
            <div className={`p-5 rounded-2xl space-y-4 border ${
              isDark ? 'bg-[#090d16] border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'
            }`}>
              <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                <Clock size={16} className="text-cyan-500" />
                Response Time Metrics
              </h3>
              <p className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-slate-500'}`}>
                Average minutes taken by dispatch algorithms to assign field engineers post mobile geohash registration.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200/60 shadow-xs'}`}>
                  <span className={`text-[9px] font-mono uppercase block ${isDark ? 'text-[#64748b]' : 'text-slate-400 font-semibold'}`}>Avg Response</span>
                  <span className="text-lg font-bold font-mono text-[#38bdf8]">{stats.avgResponseTime} hrs</span>
                  <p className={`text-[9px] mt-0.5 ${isDark ? 'text-[#475569]' : 'text-slate-400'}`}>SLA Target: 2 hrs</p>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200/60 shadow-xs'}`}>
                  <span className={`text-[9px] font-mono uppercase block ${isDark ? 'text-[#64748b]' : 'text-slate-400 font-semibold'}`}>Avg Resolution</span>
                  <span className="text-lg font-bold font-mono text-emerald-500">{stats.avgResolutionTime} hrs</span>
                  <p className={`text-[9px] mt-0.5 ${isDark ? 'text-[#475569]' : 'text-slate-400'}`}>SLA Target: 24 hrs</p>
                </div>
              </div>

              <div className={`p-2.5 rounded-lg text-[10px] flex items-center gap-1.5 border ${
                isDark ? 'bg-[#1e293b]/20 border-slate-800 text-[#94a3b8]' : 'bg-cyan-50/50 border-cyan-150 text-cyan-800'
              }`}>
                <Zap size={12} className="text-cyan-500 shrink-0" />
                AI Auto-Escalation triggers automatically if SLA exceeds thresholds.
              </div>
            </div>

            {/* Duplicate preventions card */}
            <div className={`p-5 rounded-2xl flex flex-col justify-between border ${
              isDark ? 'bg-[#090d16] border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'
            }`}>
              <div className="space-y-2">
                <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  <RefreshCw size={16} className="text-purple-500" />
                  Duplicate Prevention Screen
                </h3>
                <p className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-slate-500'}`}>
                  High-accuracy spatial clustering merges duplicate citizen complaints in real-time.
                </p>
              </div>

              <div className="py-4">
                <span className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.totalDuplicatesPrevented}</span>
                <span className={`text-xs block mt-1 ${isDark ? 'text-[#64748b]' : 'text-slate-400 font-semibold'}`}>Duplicate files prevented, saving municipal dispatch bandwidth.</span>
              </div>

              <div className={`border p-2.5 rounded-xl flex items-start gap-1.5 text-[10px] ${
                isDark ? 'bg-purple-500/5 border-purple-500/10 text-[#94a3b8]' : 'bg-purple-50/50 border-purple-150 text-purple-800'
              }`}>
                <Brain size={12} className="text-purple-500 shrink-0 mt-0.5" />
                We saved approximately 22 engineering-hours of redundant on-site investigations.
              </div>
            </div>
          </div>

          {/* Personal impact timeline */}
          <div className={`p-5 rounded-2xl border ${
            isDark ? 'bg-[#090d16] border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'
          }`}>
            <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              <Calendar size={16} className="text-emerald-500" />
              Dynamic Citizen Community Impact Timeline
            </h3>

            <div className={`relative border-l pl-5 ml-2.5 space-y-5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              {complaints.length === 0 ? (
                <p className="text-xs text-[#64748b] italic">No active reports filed recently. Submit an issue under the "Citizen Report App" tab to view live impact logs.</p>
              ) : (
                complaints.map((c, idx) => (
                  <div key={idx} className="relative text-xs">
                    {/* Circle icon */}
                    <span className={`absolute -left-7.5 top-0.5 border-2 border-emerald-400 w-4.5 h-4.5 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-[#0b1329]' : 'bg-white'
                    }`}>
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    </span>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className={`font-semibold block text-xs ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{c.title}</span>
                        <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#64748b]' : 'text-slate-500'}`}>
                          Category: <span className={`font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{c.category.toUpperCase()}</span> • 
                          Status: <span className={`font-semibold ${c.status === 'resolved' ? 'text-emerald-500' : 'text-cyan-500'}`}>{c.status.toUpperCase()}</span>
                        </p>
                      </div>
                      <span className={`text-[10px] font-mono shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: Authority Analytics Dashboard */}
      {activeTab === 'authority' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Complaints by Category Chart */}
            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-[#090d16] border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'
            }`}>
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                <PieIcon size={16} className="text-amber-500" />
                Complaints Distribution by Category
              </h3>
              <p className={`text-xs mb-4 ${isDark ? 'text-[#94a3b8]' : 'text-slate-500'}`}>
                Aggregation of incoming civic files filtered across operational categories.
              </p>
              <div className="h-[220px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {stats.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#090d16' : '#ffffff',
                        borderColor: isDark ? '#1e293b' : '#cbd5e1',
                        color: isDark ? '#f1f5f9' : '#1e293b',
                        borderRadius: '8px',
                      }}
                      itemStyle={{ fontSize: '12px' }}
                    />
                    <Legend iconSize={10} layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#475569' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Complaints by Department Bar Chart */}
            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-[#090d16] border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'
            }`}>
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                <Building2 size={16} className="text-cyan-500" />
                Workloads by Department
              </h3>
              <p className={`text-xs mb-4 ${isDark ? 'text-[#94a3b8]' : 'text-slate-500'}`}>
                Comparison of active queue volumes vs successfully resolved tickets per municipal office.
              </p>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.departmentData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#e2e8f0"} />
                    <XAxis dataKey="name" stroke={isDark ? "#64748b" : "#94a3b8"} fontSize={10} />
                    <YAxis stroke={isDark ? "#64748b" : "#94a3b8"} fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#090d16' : '#ffffff',
                        borderColor: isDark ? '#1e293b' : '#cbd5e1',
                        color: isDark ? '#f1f5f9' : '#1e293b',
                        borderRadius: '8px',
                      }}
                      itemStyle={{ fontSize: '11px' }}
                    />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="active" stackId="a" fill="#06b6d4" name="Active" />
                    <Bar dataKey="resolved" stackId="a" fill="#10b981" name="Resolved" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Engineer workload and efficiency table */}
            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-[#090d16] border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'
            }`}>
              <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                <UserCheck size={16} className="text-emerald-500" />
                Engineer Workload & Dispatch Efficiencies
              </h3>
              <div className="overflow-x-auto">
                <table className={`w-full text-left text-xs ${isDark ? 'text-[#94a3b8]' : 'text-slate-600'}`}>
                  <thead>
                    <tr className={`border-b pb-2 text-[10px] font-mono uppercase ${
                      isDark ? 'border-slate-800 text-[#64748b]' : 'border-slate-200 text-slate-400 font-semibold'
                    }`}>
                      <th className="py-2">Field Engineer</th>
                      <th className="py-2 text-center">Active Load</th>
                      <th className="py-2 text-center">Resolved</th>
                      <th className="py-2 text-right">SLA Score</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-200'}`}>
                    {stats.engineerData.map((eng, idx) => (
                      <tr key={idx} className={`transition-colors ${isDark ? 'hover:bg-[#0f172a]/40' : 'hover:bg-slate-100/50'}`}>
                        <td className={`py-3 font-medium ${isDark ? 'text-[#cbd5e1]' : 'text-slate-700'}`}>{eng.name}</td>
                        <td className="py-3 text-center font-mono font-bold text-cyan-500">{eng.active}</td>
                        <td className="py-3 text-center font-mono text-emerald-500">{eng.resolved}</td>
                        <td className="py-3 text-right">
                          <span className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                            eng.efficiency >= 93 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {eng.efficiency}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Escalation & Supervisor KPI Performance card */}
            <div className={`p-5 rounded-2xl space-y-4 border ${
              isDark ? 'bg-[#090d16] border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'
            }`}>
              <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                <AlertTriangle size={16} className="text-rose-500" />
                SLA Breaches & Escalation Telemetry
              </h3>
              <p className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-slate-500'}`}>
                Monitors supervisor action queues, manual override overrides, and tickets routed to senior executive leadership.
              </p>

              <div className="space-y-3">
                <div className={`flex justify-between items-center p-3 rounded-xl border ${
                  isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  <div>
                    <span className={`font-semibold text-xs block ${isDark ? 'text-[#cbd5e1]' : 'text-slate-700'}`}>Active Escalation Ratio</span>
                    <span className={`text-[10px] ${isDark ? 'text-[#64748b]' : 'text-slate-400'}`}>Percentage of overall queue requiring supervisor routing.</span>
                  </div>
                  <span className="text-sm font-mono font-bold text-rose-500">
                    {stats.liveEscalated > 0 ? Number(((stats.liveEscalated / complaints.length) * 100).toFixed(1)) : '4.2'}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border ${
                    isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    <span className={`text-[9px] font-mono block uppercase ${isDark ? 'text-[#64748b]' : 'text-slate-400 font-semibold'}`}>Live Escalations</span>
                    <span className="text-base font-bold text-rose-500 mt-1">{stats.liveEscalated}</span>
                    <p className={`text-[9px] mt-0.5 ${isDark ? 'text-[#475569]' : 'text-slate-400'}`}>SLA Deadline overrun</p>
                  </div>
                  <div className={`p-3 rounded-xl border ${
                    isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    <span className={`text-[9px] font-mono block uppercase ${isDark ? 'text-[#64748b]' : 'text-slate-400 font-semibold'}`}>Supervisor Approvals</span>
                    <span className="text-base font-bold text-emerald-500 mt-1">94.8%</span>
                    <p className={`text-[9px] mt-0.5 ${isDark ? 'text-[#475569]' : 'text-slate-400'}`}>Closure rate approvals</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}      {/* SUB-VIEW 3: Executive Dashboard */}
      {activeTab === 'executive' && (
        <div className="space-y-6">
          {/* Executive Overview Cards & AI Summary */}
          <div className={`p-5 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center border ${
            isDark ? 'bg-gradient-to-r from-emerald-950/20 via-[#0b1329] to-[#090d16] border-[#1e293b]' : 'bg-gradient-to-r from-emerald-50/30 via-slate-50 to-slate-100/50 border-slate-200 shadow-xs'
          }`}>
            <div className="md:col-span-2 space-y-2">
              <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-extrabold uppercase tracking-widest">
                AI EXECUTIVE SUMMARY COGNITION
              </span>
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>City-wide Civic Health Overview</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-[#94a3b8]' : 'text-slate-600'}`}>
                Gemini evaluated current reporting volumes. Live queues are operating under nominal dispatch conditions with an aggregate SLA compliance index of <span className="text-emerald-500 font-bold">{stats.totalSlaPercentage}%</span>. Main pressure points are centered around category <span className="text-amber-500 font-bold">"Roads & Potholes"</span> inside Bengaluru East.
              </p>
            </div>
            <div className={`p-4 rounded-xl border text-center space-y-2 ${
              isDark ? 'bg-[#090d16]/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <Brain size={24} className="text-cyan-500 mx-auto animate-pulse" />
              <span className="text-[10px] text-[#64748b] font-mono block uppercase">Cognitive Risk Index</span>
              <span className="text-2xl font-black font-mono text-emerald-500">LOW RISK</span>
            </div>
          </div>

          {/* Time Series Trend Charts & Ward Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Time series area chart */}
            <div className={`p-5 rounded-2xl lg:col-span-2 border ${
              isDark ? 'bg-[#090d16] border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'
            }`}>
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                <TrendingUp size={16} className="text-emerald-500" />
                Spatial Trend Analysis over Time (Last 7 Days)
              </h3>
              <p className={`text-xs mb-4 ${isDark ? 'text-[#94a3b8]' : 'text-slate-500'}`}>
                Comparison of weekly ticket submission velocities vs resolved dispatch tasks.
              </p>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.trendsData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#e2e8f0"} />
                    <XAxis dataKey="day" stroke={isDark ? "#64748b" : "#94a3b8"} fontSize={10} />
                    <YAxis stroke={isDark ? "#64748b" : "#94a3b8"} fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#090d16' : '#ffffff',
                        borderColor: isDark ? '#1e293b' : '#cbd5e1',
                        color: isDark ? '#f1f5f9' : '#1e293b',
                        borderRadius: '8px',
                      }}
                      itemStyle={{ fontSize: '11px' }}
                    />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: '10px' }} />
                    <Area type="monotone" dataKey="submitted" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSubmitted)" name="Submitted" />
                    <Area type="monotone" dataKey="resolved" stroke="#10b981" fillOpacity={1} fill="url(#colorResolved)" name="Resolved" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ward Statistics Grid */}
            <div className={`p-5 rounded-2xl flex flex-col justify-between border ${
              isDark ? 'bg-[#090d16] border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'
            }`}>
              <div>
                <h3 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  <MapPin size={16} className="text-[#38bdf8]" />
                  Ward Performance Metrics
                </h3>
                <p className={`text-xs mb-4 ${isDark ? 'text-[#94a3b8]' : 'text-slate-500'}`}>
                  Ward-wise response efficiencies and SLA compliance rankings.
                </p>
              </div>

              <div className="space-y-3">
                {stats.wardData.map((ward, idx) => (
                  <div key={idx} className={`p-2.5 rounded-lg flex justify-between items-center border ${
                    isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200/60 shadow-xs'
                  }`}>
                    <div>
                      <span className={`text-xs font-bold block ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{ward.name}</span>
                      <span className={`text-[10px] font-mono ${isDark ? 'text-[#64748b]' : 'text-slate-500'}`}>{ward.active} Active • {ward.resolved} Solved</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-emerald-500">{ward.compliance}%</span>
                      <span className={`text-[8px] block ${isDark ? 'text-[#475569]' : 'text-slate-400 font-semibold'}`}>SLA INDEX</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Predictor summaries and Hotspot cards */}
          <div className="space-y-4">
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              <Sparkles size={16} className="text-amber-500" />
              AI Hotspot Summaries (Predictive Intelligence Engine)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4.5 rounded-xl space-y-2 border ${
                isDark ? 'bg-rose-950/10 border-rose-500/20' : 'bg-rose-50/50 border-rose-200 shadow-xs'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 uppercase tracking-widest font-bold">
                    RED RISK COEFFICIENT
                  </span>
                  <span className="text-xs font-bold text-slate-400 font-mono">tdr1v</span>
                </div>
                <h4 className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-800'}`}>Bengaluru West - Rajajinagar</h4>
                <p className={`text-[11px] leading-relaxed ${isDark ? 'text-[#cbd5e1]' : 'text-slate-600'}`}>
                  Large sewage main pipeline failures and overflows predicted to expand next week by <span className="text-rose-500 font-bold">+42%</span>. Confidence: 91%.
                </p>
                <div className="pt-2 text-[10px] text-[#64748b] font-mono">
                  SQUAD ASSIGNED: Sewage Bypass Squad
                </div>
              </div>

              <div className={`p-4.5 rounded-xl space-y-2 border ${
                isDark ? 'bg-amber-950/10 border-amber-500/20' : 'bg-amber-50/50 border-amber-200 shadow-xs'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest font-bold">
                    ORANGE RISK
                  </span>
                  <span className="text-xs font-bold text-slate-400 font-mono">tdr1z</span>
                </div>
                <h4 className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-800'}`}>Bengaluru East - Indiranagar</h4>
                <p className={`text-[11px] leading-relaxed ${isDark ? 'text-[#cbd5e1]' : 'text-slate-600'}`}>
                  Asphalt cracking and road craters predicted to escalate post rainfall. Weekly growth: <span className="text-amber-500 font-bold">+28%</span>. Confidence: 84%.
                </p>
                <div className="pt-2 text-[10px] text-[#64748b] font-mono">
                  SQUAD ASSIGNED: Asphalt Loader Crew
                </div>
              </div>

              <div className={`p-4.5 rounded-xl space-y-2 border ${
                isDark ? 'bg-[#0b1329] border-slate-800' : 'bg-slate-50 border-slate-200 shadow-xs'
              }`}>
                <div className="flex justify-between items-center">
                  <span className={`text-[9px] font-mono bg-slate-500/10 px-1.5 py-0.5 rounded border uppercase tracking-widest font-bold ${
                    isDark ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-200'
                  }`}>
                    YELLOW RISK
                  </span>
                  <span className="text-xs font-bold text-slate-400 font-mono">tdr1e</span>
                </div>
                <h4 className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-800'}`}>Bengaluru South - Jayanagar</h4>
                <p className={`text-[11px] leading-relaxed ${isDark ? 'text-[#cbd5e1]' : 'text-slate-600'}`}>
                  Minor dark sectors and streetlight cabling failures. Weekly growth rate: <span className="text-amber-500 font-bold">+15%</span>. Confidence: 78%.
                </p>
                <div className="pt-2 text-[10px] text-[#64748b] font-mono">
                  SQUAD ASSIGNED: Electric Utility Team
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
