import React, { useState, useMemo, FormEvent, MouseEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Folder,
  FolderOpen,
  FileCode,
  Database,
  Brain,
  Compass,
  MapPin,
  Sparkles,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Lock,
  AlertCircle,
  Check,
  Plus,
  Search,
  Code,
  List,
  UserCheck,
  Volume2,
  Image as ImageIcon,
  ChevronRight,
  Info,
  Calendar,
  Network,
  Smartphone,
  Wifi,
  WifiOff,
  Terminal,
  Globe,
  Languages,
  Palette,
  Eye,
  Trash2,
  BarChart3,
  Zap
} from 'lucide-react';
import {
  flutterCleanArchitecture,
  firestoreCollections,
  geminiPipelines
} from './data/architecture';
import { FileNode, FirestoreCollection, AIPipeline, GeohashDemoPoint } from './types';
import ComplaintReportingSimulator, { MockComplaint } from './components/ComplaintReportingSimulator';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { firestoreComplaintRepository } from './data/repositories/firestore_complaint_repository';

let uniqueIdCounter = 0;
function generateUniqueId() {
  uniqueIdCounter += 1;
  return `${Date.now()}-${uniqueIdCounter}-${Math.floor(Math.random() * 1000000)}`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'clean_architecture' | 'core_foundation' | 'database_schema' | 'ai_pipelines' | 'duplicate_detection' | 'complaint_reporting' | 'analytics_dashboard' | 'roadmap'>('complaint_reporting');

  // Shared complaints state across Citizen Reporter and Analytics Dashboard
  const [complaints, setComplaints] = useState<MockComplaint[]>([]);

  useEffect(() => {
    const unsubscribe = firestoreComplaintRepository.subscribe((list) => {
      if (list.length === 0) {
        firestoreComplaintRepository.seedDefaultComplaints().catch((err) => {
          console.error("Failed to seed complaints collection:", err);
        });
      } else {
        setComplaints(list);
      }
    });
    return unsubscribe;
  }, []);

  // File Explorer State
  const [selectedNode, setSelectedNode] = useState<FileNode>(flutterCleanArchitecture);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'civora_app': true,
    'lib': true,
    'core': true,
    'features': true,
    'issue_reporting': true,
    'domain': true
  });

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Core Foundation Interactive State
  const [foundationTheme, setFoundationTheme] = useState<'light' | 'dark'>('light');
  const [authRole, setAuthRole] = useState<'guest' | 'citizen' | 'field_engineer' | 'supervisor' | 'higher_authority'>('citizen');
  const [foundationLocale, setFoundationLocaleState] = useState<'en' | 'es' | 'hi'>(() => {
    return (localStorage.getItem('civora_locale') as 'en' | 'es' | 'hi') || 'en';
  });

  const setFoundationLocale = (loc: 'en' | 'es' | 'hi') => {
    localStorage.setItem('civora_locale', loc);
    setFoundationLocaleState(loc);
  };
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [tourExpanded, setTourExpanded] = useState<boolean>(true);
  const [tourStep, setTourStep] = useState<number>(1);
  const [isClientAuthenticated, setIsClientAuthenticated] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [offlineQueue, setOfflineQueue] = useState<Array<{ id: string; title: string; category: string; timestamp: string }>>([]);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ id: string; time: string; level: 'debug' | 'info' | 'warn' | 'error'; msg: string }>>(() => {
    const now = new Date();
    const t1 = new Date(now.getTime() - 2000).toTimeString().split(' ')[0];
    const t2 = new Date(now.getTime() - 1000).toTimeString().split(' ')[0];
    const t3 = now.toTimeString().split(' ')[0];
    return [
      { id: '1', time: t1, level: 'info', msg: 'Civora Core Bootloader Sequence Activated...' },
      { id: '2', time: t2, level: 'debug', msg: 'Checking client environment arguments... Device: Android API 34' },
      { id: '3', time: t3, level: 'info', msg: 'Firebase Service Initialized. Offline cache size: UNLIMITED.' }
    ];
  });
  const [snackbars, setSnackbars] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>>([]);
  const [isSubmittingOffline, setIsSubmittingOffline] = useState(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [dialogType, setDialogType] = useState<'none' | 'auth' | 'escalation'>('none');

  // Helpers for console logs and snackbars
  const addLog = (level: 'debug' | 'info' | 'warn' | 'error', msg: string) => {
    const time = new Date().toTimeString().split(' ')[0];
    setConsoleLogs(prev => [...prev, { id: generateUniqueId(), time, level, msg }].slice(-40));
  };

  const showSnackbar = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = generateUniqueId();
    setSnackbars(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setSnackbars(prev => prev.filter(s => s.id !== id));
    }, 4000);
  };

  const tourSteps = useMemo(() => [
    {
      step: 1,
      title: "Platform Overview & Executive Pitch",
      description: "Understand the core vision of Civora and why municipalities should use it.",
      details: [
        { label: "What Civora Is", text: "An Intelligent Civic Operations Platform designed with a high-fidelity mobile client interface and server-side predictive engines." },
        { label: "Why It's Different", text: "Replaces slow, error-prone manual triage with real-time geospatial duplicate detection, automated severity evaluations, and zero-loss offline synchronization." },
        { label: "The AI Edge", text: "Uses Gemini server-side intelligence to standardize informal slang audio memos, audit uploaded photos, and perform sub-100m geohash clustering." },
        { label: "Municipal ROI", text: "Shifts maintenance from reactive repair to predictive preemption, slashing response SLAs from days to hours and saving up to 45% in operating costs." }
      ],
      actionText: "Step 1: Open Operations Dashboard",
      setup: () => {
        setActiveTab('analytics_dashboard');
        addLog('info', 'Guided Tour: Shifted view to Operations & Analytics Dashboard.');
        showSnackbar('Scene configured: Viewing Operations Dashboard', 'success');
      }
    },
    {
      step: 2,
      title: "Secure Federated SSO Authentication",
      description: "Demonstrate enterprise-grade secure token handshakes and role-based access control.",
      details: [
        { label: "What It Is", text: "Federated login handshakes utilizing secure Firebase Auth and Attribute-Based Access Control (ABAC)." },
        { label: "Why It's Different", text: "Each role (Citizen, Field Engineer, Supervisor, Director) operates with strictly partitioned authorization layers, audited via secure Firestore Rules." },
        { label: "The AI Edge", text: "Initializes custom operational profiles and logs AI credentials safely behind server proxy routes." },
        { label: "Municipal ROI", text: "Prevents rogue field edits, ensures full traceability of data, and protects critical infrastructure records." }
      ],
      actionText: "Step 2: Initialize Mobile SSO Gate",
      setup: () => {
        setActiveTab('complaint_reporting');
        setIsClientAuthenticated(false);
        setAuthRole('citizen');
        addLog('info', 'Guided Tour: Routing to Citizen SSO Authentication interface.');
        showSnackbar('Scene configured: Bypassing to Citizen SSO login', 'success');
      }
    },
    {
      step: 3,
      title: "Intelligent Citizen Reporting App",
      description: "Simulate a citizen recording a voice memo, capturing an image, and submitting a hazard.",
      details: [
        { label: "What It Is", text: "Interactive smartphone mockup simulation demonstrating offline caching and live telemetry registration." },
        { label: "Why It's Different", text: "Maintains full functionality in dead-zones (offline mode). Syncs local caches instantly when connectivity is restored." },
        { label: "The AI Edge", text: "Vocal reports are standardized by Gemini. Images are audited for fake submissions, and priority levels are automatically calculated." },
        { label: "Municipal ROI", text: "Decreases intake friction by 80%, allowing residents to report issues in local dialects or informal street slang." }
      ],
      actionText: "Step 3: Launch Active Citizen Session",
      setup: () => {
        setActiveTab('complaint_reporting');
        setIsClientAuthenticated(true);
        setAuthRole('citizen');
        addLog('info', 'Guided Tour: Activated Citizen Session. Ready to report hazards.');
        showSnackbar('Scene configured: Active Citizen Session loaded', 'success');
      }
    },
    {
      step: 4,
      title: "Real-Time Spatial Duplicate Detection",
      description: "Avoid dispatching duplicate crews to the same 100m geohash grid, preventing wasted resources.",
      details: [
        { label: "What It Is", text: "Real-time geohash clustering screening and live upvoting systems." },
        { label: "Why It's Different", text: "Rather than filing individual tickets, incoming issues in the same micro-geohash (sub-100m) are merged automatically into one master ticket." },
        { label: "The AI Edge", text: "Gemini checks text and image similarity. If a duplicate is verified, it links it, upvotes the original, and alerts the citizen." },
        { label: "Municipal ROI", text: "Reduces duplicate work dispatches by 35% and prevents redundant phone calls to municipal call centers." }
      ],
      actionText: "Step 4: View Geohash Duplicate Map",
      setup: () => {
        setActiveTab('duplicate_detection');
        addLog('info', 'Guided Tour: Switched to Spatial Duplicate Screening visualization.');
        showSnackbar('Scene configured: Spatial Duplicate Map active', 'success');
      }
    },
    {
      step: 5,
      title: "Unified Multi-Role Authority Task Center",
      description: "Demonstrate Field Engineers, Supervisors, and Directors reviewing and resolving tickets.",
      details: [
        { label: "What It Is", text: "End-to-end task lifecycle workflow including status dispatches, work logs, and digital sign-offs." },
        { label: "Why It's Different", text: "Changes status dynamically and saves complete immutable audit trails across supervisor approvals and engineer resolutions." },
        { label: "The AI Edge", text: "AI verification inspects resolution proof photos to verify that potholes are paved and sewers are fixed before closure." },
        { label: "Municipal ROI", text: "Reduces false closures by 95% and cuts inspection cycle overhead by automating visual confirmation." }
      ],
      actionText: "Step 5: Load Supervisor Dispatch Panel",
      setup: () => {
        setActiveTab('complaint_reporting');
        setIsClientAuthenticated(true);
        setAuthRole('supervisor');
        addLog('info', 'Guided Tour: Activated Supervisor Authority Context. Displaying Unified Task Center.');
        showSnackbar('Scene configured: Switched role to Supervisor dispatcher', 'success');
      }
    },
    {
      step: 6,
      title: "AI Predictive Hotspot Forecasting",
      description: "Predict infrastructure failures and execute preventive maintenance before breakdowns occur.",
      details: [
        { label: "What It Is", text: "Civora Preemptive ML Engine displaying sector risk rankings, predictive signals, and impact blueprints." },
        { label: "Why It's Different", text: "Replaces traditional corrective repair models with a modern, proactive municipal scheduling model." },
        { label: "The AI Edge", text: "Fuses historic tickets, transit axle stress, and weather forecasts to predict cracks and leaks before they fail." },
        { label: "Municipal ROI", text: "Extends asphalt and utility assets life by up to 30%, saving thousands in emergency repair fees." }
      ],
      actionText: "Step 6: Open Spatial Hotspot Intelligence",
      setup: () => {
        setActiveTab('complaint_reporting');
        setIsClientAuthenticated(true);
        setAuthRole('higher_authority');
        addLog('info', 'Guided Tour: Switched to AI Spatial Hotspots & Predictive Forecasting view.');
        showSnackbar('Scene configured: Displaying Preemptive ML Engine', 'success');
      }
    }
  ], [setActiveTab, setIsClientAuthenticated, setAuthRole, addLog, showSnackbar]);

  // Geohash Simulator State
  const [demoPoints, setDemoPoints] = useState<GeohashDemoPoint[]>([
    { id: '1', lat: 12.9716, lng: 77.5946, geohash: 'tdr1w7', label: 'Main St Water Leak', isDuplicate: false },
    { id: '2', lat: 12.9722, lng: 77.5952, geohash: 'tdr1w7', label: 'Main St Pothole Repair', isDuplicate: true, parentId: '1' },
    { id: '3', lat: 12.9805, lng: 77.6011, geohash: 'tdr1yd', label: 'Broken Streetlight, Park Lane', isDuplicate: false },
  ]);
  const [newPointLat, setNewPointLat] = useState('12.9719');
  const [newPointLng, setNewPointLng] = useState('77.5948');
  const [newPointLabel, setNewPointLabel] = useState('Clogged Storm Drain');
  const [simMessage, setSimMessage] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>({
    text: 'Click on the interactive map area or insert custom Lat/Lng to simulate Citizen Reporting & AI Duplicate Screening.',
    type: 'info'
  });

  // Calculate Geohash from simple fake geohash algorithm for representation
  const calculateRepresentationGeohash = (lat: number, lng: number): string => {
    // Simple mock deterministic geohash based on rounding coordinate bounds
    const latInt = Math.floor(lat * 1000);
    const lngInt = Math.floor(lng * 1000);
    if (latInt === 12971 || latInt === 12972) {
      if (lngInt === 77594 || lngInt === 77595) {
        return 'tdr1w7'; // Same geohash zone
      }
    }
    if (latInt === 12980 && lngInt === 77601) {
      return 'tdr1yd';
    }
    // Generate code based on coordinates
    const base32Chars = '0123456789bcdefghjkmnpqrstuvwxyz';
    const index1 = Math.abs(latInt) % 32;
    const index2 = Math.abs(lngInt) % 32;
    return `tdr1${base32Chars[index1]}${base32Chars[index2]}`;
  };

  const handleAddSimPoint = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const lat = parseFloat(newPointLat);
    const lng = parseFloat(newPointLng);
    if (isNaN(lat) || isNaN(lng) || !newPointLabel.trim()) {
      setSimMessage({ text: 'Please enter valid coordinates and label.', type: 'warning' });
      return;
    }

    const calculatedHash = calculateRepresentationGeohash(lat, lng);
    const existingParent = demoPoints.find(p => p.geohash === calculatedHash && !p.isDuplicate);

    const newId = (demoPoints.length + 1).toString();
    const newPoint: GeohashDemoPoint = {
      id: newId,
      lat,
      lng,
      geohash: calculatedHash,
      label: newPointLabel,
      isDuplicate: !!existingParent,
      parentId: existingParent?.id
    };

    setDemoPoints(prev => [...prev, newPoint]);

    if (existingParent) {
      setSimMessage({
        text: `Duplicate Screen Action Triggered: A complaint already exists inside Geohash grid "${calculatedHash}" ("${existingParent.label}"). Civora registered this as a Duplicate, merged the ticket, and automatically incremented upvotes!`,
        type: 'warning'
      });
    } else {
      setSimMessage({
        text: `Unique Issue Filed: Registered new civic issue inside Geohash grid "${calculatedHash}" successfully. Automatically prioritized by Gemini AI Routing.`,
        type: 'success'
      });
    }
    setNewPointLabel('');
  };

  const handleCanvasClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Map pixel coordinates (360x240) to Lat/Lng bounds:
    // Lat: 12.9700 to 12.9850
    // Lng: 77.5900 to 77.6050
    const latRange = 12.9850 - 12.9700;
    const lngRange = 77.6050 - 77.5900;

    const lat = 12.9850 - (y / rect.height) * latRange;
    const lng = 77.5900 + (x / rect.width) * lngRange;

    setNewPointLat(lat.toFixed(4));
    setNewPointLng(lng.toFixed(4));
    setNewPointLabel(`Pothole on Road Zone ${Math.floor(x/10)}`);
  };

  // Render Folder Tree Recurser
  const renderFolderTree = (node: FileNode, depth = 0, parentPath = '') => {
    const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
    const isFolder = node.type === 'folder';
    const isExpanded = expandedFolders[currentPath];

    return (
      <div key={currentPath} className="select-none">
        <div
          id={`explorer-${node.name.replace(/\W/g, '-')}`}
          className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors duration-150 text-sm ${
            selectedNode.name === node.name
              ? 'bg-[#1e293b] text-[#10b981] border-l-2 border-[#10b981]'
              : 'hover:bg-[#0f172a] text-[#94a3b8]'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            setSelectedNode(node);
            if (isFolder) {
              toggleFolder(currentPath);
            }
          }}
        >
          {isFolder ? (
            isExpanded ? (
              <FolderOpen size={16} className="text-amber-400 shrink-0" />
            ) : (
              <Folder size={16} className="text-amber-400 shrink-0" />
            )
          ) : (
            <FileCode size={16} className="text-[#38bdf8] shrink-0" />
          )}
          <span className={`font-mono truncate ${isFolder ? 'font-medium' : 'text-xs'}`}>
            {node.name}
          </span>
          {isFolder && node.children && (
            <span className="text-[10px] bg-[#1e293b] text-[#475569] px-1.5 py-0.5 rounded ml-auto">
              {node.children.length}
            </span>
          )}
        </div>

        {isFolder && isExpanded && node.children && (
          <div className="overflow-hidden">
            {node.children.map(child => renderFolderTree(child, depth + 1, currentPath))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row font-sans transition-colors duration-300 ${
      foundationTheme === 'dark' ? 'bg-[#0f172a] text-[#f1f5f9]' : 'bg-[#f8fafc] text-slate-800'
    }`}>
      {/* Sidebar - Desktop Layout */}
      <aside className={`hidden lg:flex flex-col w-72 shrink-0 border-r transition-all duration-300 sticky top-0 h-screen z-40 ${
        foundationTheme === 'dark' 
          ? 'bg-[#0b1329] border-slate-800 text-slate-100' 
          : 'bg-[#1e3f3a] border-emerald-900/40 text-white' // Deep Forest Sage for Light Theme! Premium, custom look.
      }`}>
        {/* Sidebar Header with Brand Identity */}
        <div className="p-6 border-b border-white/10 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border transition-all ${
              foundationTheme === 'dark' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-white/10 border-white/20 text-emerald-300'
            }`}>
              <Layers className="w-5.5 h-5.5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight font-display text-white">
                Civora
              </h1>
              <p className={`text-[10px] font-mono tracking-wider ${
                foundationTheme === 'dark' ? 'text-emerald-400' : 'text-emerald-300'
              }`}>
                Civic Intelligence
              </p>
            </div>
          </div>
          <p className="text-[11px] mt-2 leading-relaxed opacity-80 font-sans italic">
            “Shaping the Next Era of Civic Intelligence.”
          </p>
        </div>

        {/* Sidebar Navigation Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Group 1: CIVIC PORTALS */}
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-bold tracking-wider uppercase px-3 opacity-60 font-mono">
              Civic Portals
            </h3>
            <button
              id="tab-analytics-dashboard"
              onClick={() => setActiveTab('analytics_dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left text-xs font-semibold ${
                activeTab === 'analytics_dashboard'
                  ? foundationTheme === 'dark'
                    ? 'bg-emerald-500/15 border-l-4 border-emerald-500 text-emerald-400 font-bold'
                    : 'bg-white/15 border-l-4 border-emerald-300 text-white font-bold'
                  : 'opacity-75 hover:bg-white/5 hover:opacity-100'
              }`}
            >
              <BarChart3 size={16} />
              <span>Operations & Analytics</span>
            </button>
            <button
              id="tab-complaint-reporting"
              onClick={() => setActiveTab('complaint_reporting')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left text-xs font-semibold ${
                activeTab === 'complaint_reporting'
                  ? foundationTheme === 'dark'
                    ? 'bg-emerald-500/15 border-l-4 border-emerald-500 text-emerald-400 font-bold'
                    : 'bg-white/15 border-l-4 border-emerald-300 text-white font-bold'
                  : 'opacity-75 hover:bg-white/5 hover:opacity-100'
              }`}
            >
              <Smartphone size={16} />
              <span>Citizen Reporting App</span>
            </button>
          </div>

          {/* Group 2: AI & INFERENCE CORE */}
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-bold tracking-wider uppercase px-3 opacity-60 font-mono">
              AI Intelligence
            </h3>
            <button
              id="tab-duplicate-detection"
              onClick={() => setActiveTab('duplicate_detection')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left text-xs font-semibold ${
                activeTab === 'duplicate_detection'
                  ? foundationTheme === 'dark'
                    ? 'bg-emerald-500/15 border-l-4 border-emerald-500 text-emerald-400 font-bold'
                    : 'bg-white/15 border-l-4 border-emerald-300 text-white font-bold'
                  : 'opacity-75 hover:bg-white/5 hover:opacity-100'
              }`}
            >
              <MapPin size={16} />
              <span>Duplicate Detection Map</span>
            </button>
            <button
              id="tab-ai-pipelines"
              onClick={() => setActiveTab('ai_pipelines')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left text-xs font-semibold ${
                activeTab === 'ai_pipelines'
                  ? foundationTheme === 'dark'
                    ? 'bg-emerald-500/15 border-l-4 border-emerald-500 text-emerald-400 font-bold'
                    : 'bg-white/15 border-l-4 border-emerald-300 text-white font-bold'
                  : 'opacity-75 hover:bg-white/5 hover:opacity-100'
              }`}
            >
              <Brain size={16} />
              <span>Gemini AI Pipelines</span>
            </button>
          </div>

          {/* Group 3: TECHNICAL BLUEPRINTS */}
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-bold tracking-wider uppercase px-3 opacity-60 font-mono">
              System Blueprints
            </h3>
            <button
              id="tab-database-schema"
              onClick={() => setActiveTab('database_schema')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left text-xs font-semibold ${
                activeTab === 'database_schema'
                  ? foundationTheme === 'dark'
                    ? 'bg-emerald-500/15 border-l-4 border-emerald-500 text-emerald-400 font-bold'
                    : 'bg-white/15 border-l-4 border-emerald-300 text-white font-bold'
                  : 'opacity-75 hover:bg-white/5 hover:opacity-100'
              }`}
            >
              <Database size={16} />
              <span>Durable Schema</span>
            </button>
            <button
              id="tab-clean-architecture"
              onClick={() => setActiveTab('clean_architecture')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left text-xs font-semibold ${
                activeTab === 'clean_architecture'
                  ? foundationTheme === 'dark'
                    ? 'bg-emerald-500/15 border-l-4 border-emerald-500 text-emerald-400 font-bold'
                    : 'bg-white/15 border-l-4 border-emerald-300 text-white font-bold'
                  : 'opacity-75 hover:bg-white/5 hover:opacity-100'
              }`}
            >
              <Folder size={16} />
              <span>Clean Architecture</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-white/10 dark:border-slate-800 space-y-4">
          {/* Active Role Selector */}
          <div>
            <label className="text-[9px] uppercase font-mono tracking-wider opacity-60 block mb-1.5">
              Simulated Role Context
            </label>
            <select
              value={authRole}
              onChange={(e) => {
                const role = e.target.value as any;
                setAuthRole(role);
                addLog('info', `Active simulation security authority switched to: ${role.toUpperCase()}`);
                showSnackbar(`Role switched: ${role.toUpperCase()}`, 'success');
              }}
              className={`w-full text-xs font-semibold rounded-lg px-2.5 py-2 outline-none border transition-all ${
                foundationTheme === 'dark'
                  ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-emerald-500'
                  : 'bg-[#152e2a] border-emerald-800/40 text-emerald-100 focus:border-emerald-400'
              }`}
            >
              <option value="guest" className="text-slate-800 bg-white">Guest User</option>
              <option value="citizen" className="text-slate-800 bg-white">Citizen Reporter</option>
              <option value="field_engineer" className="text-slate-800 bg-white">Field Engineer</option>
              <option value="supervisor" className="text-slate-800 bg-white">Supervisor</option>
              <option value="higher_authority" className="text-slate-800 bg-white">Director / High Authority</option>
            </select>
          </div>

          {/* Theme Switcher Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono opacity-75">Theme:</span>
            <button
              onClick={() => {
                const nextTheme = foundationTheme === 'light' ? 'dark' : 'light';
                setFoundationTheme(nextTheme);
                showSnackbar(`Theme changed to ${nextTheme.toUpperCase()}`, 'info');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                foundationTheme === 'dark'
                  ? 'bg-slate-900 border-slate-800 text-yellow-400 hover:text-yellow-300'
                  : 'bg-white/10 border-white/20 text-yellow-200 hover:bg-white/15'
              }`}
            >
              {foundationTheme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Content Container */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Header Bar */}
        <header className={`border-b sticky top-0 z-30 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-300 ${
          foundationTheme === 'dark' 
            ? 'bg-[#0f172a]/95 border-slate-800 text-white backdrop-blur-md' 
            : 'bg-white/95 border-slate-200/85 text-slate-800 backdrop-blur-md'
        }`}>
          {/* Logo & Info block (Visible on Tablet/Mobile) */}
          <div className="flex items-center justify-between w-full lg:w-auto">
            <div className="flex items-center gap-3">
              <div className={`lg:hidden p-2 rounded-xl border transition-all ${
                foundationTheme === 'dark' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-brand-sage/10 border-brand-sage/20 text-brand-sage'
              }`}>
                <Layers className="w-5.5 h-5.5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold tracking-tight font-display bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                    CIVORA
                  </span>
                  <span className={`text-[9px] font-mono tracking-wider px-1.5 py-0.5 rounded border uppercase ${
                    foundationTheme === 'dark'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-brand-sage/10 text-brand-sage border-brand-sage/20'
                  }`}>
                    Civic Engine
                  </span>
                </div>
                <p className={`text-[10px] ${foundationTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Shaping the Next Era of Civic Intelligence
                </p>
              </div>
            </div>

            {/* Mobile/Tablet Controls */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => {
                  const nextTheme = foundationTheme === 'light' ? 'dark' : 'light';
                  setFoundationTheme(nextTheme);
                  showSnackbar(`Theme changed to ${nextTheme.toUpperCase()}`, 'info');
                }}
                className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                  foundationTheme === 'dark' ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                {foundationTheme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>
          </div>

          {/* Quick System Indicators (Desktop & Tablet) */}
          <div className="hidden sm:flex items-center gap-3 text-xs">
            {/* Live Connection Sync Badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
              foundationTheme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200/60 text-slate-700'
            }`}>
              {isOnline ? (
                <Wifi size={14} className="text-emerald-500 animate-pulse" />
              ) : (
                <WifiOff size={14} className="text-amber-500 animate-pulse" />
              )}
              <button
                onClick={() => {
                  setIsOnline(!isOnline);
                  addLog('warn', `Device network hardware state set to ${!isOnline ? 'ONLINE' : 'OFFLINE'}`);
                  showSnackbar(`Connection changed to ${!isOnline ? 'Online' : 'Offline'}`, 'info');
                }}
                className="font-mono text-[11px] font-semibold hover:underline"
              >
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </button>
            </div>

            {/* Time Clock */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-[11px] ${
              foundationTheme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200/60 text-slate-700'
            }`}>
              <Clock size={13} className="text-brand-emerald" />
              <span>
                {currentTime.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })}{' '}
                {currentTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}{' '}
                {(() => {
                  try {
                    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
                    if (tz.includes('Kolkata') || tz.includes('Calcutta') || tz === 'Asia/Kolkata') {
                      return 'IST';
                    }
                    return tz;
                  } catch (e) {
                    return 'UTC';
                  }
                })()}
              </span>
            </div>

            {/* Active Security Context */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20 font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              {authRole.replace('_', ' ').toUpperCase()} VIEW
            </div>
          </div>
        </header>

        {/* Mobile bottom navigation bar */}
        <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t flex justify-around items-center py-2.5 px-4 transition-colors duration-300 ${
          foundationTheme === 'dark' ? 'bg-[#0f172a]/95 border-slate-800 text-slate-400 backdrop-blur-md' : 'bg-white/95 border-slate-200/80 text-slate-600 backdrop-blur-md'
        }`}>
          <button
            onClick={() => setActiveTab('analytics_dashboard')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
              activeTab === 'analytics_dashboard' ? 'text-brand-emerald font-bold' : 'opacity-70'
            }`}
          >
            <BarChart3 size={18} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('complaint_reporting')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
              activeTab === 'complaint_reporting' ? 'text-brand-emerald font-bold' : 'opacity-70'
            }`}
          >
            <Smartphone size={18} />
            <span>Citizen App</span>
          </button>
          <button
            onClick={() => setActiveTab('duplicate_detection')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
              activeTab === 'duplicate_detection' ? 'text-brand-emerald font-bold' : 'opacity-70'
            }`}
          >
            <MapPin size={18} />
            <span>Duplicate Map</span>
          </button>
          <button
            onClick={() => setActiveTab('ai_pipelines')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
              activeTab === 'ai_pipelines' || activeTab === 'database_schema' ? 'text-brand-emerald font-bold' : 'opacity-70'
            }`}
          >
            <Brain size={18} />
            <span>AI Pipelines</span>
          </button>
        </nav>

        {/* Scrollable Main Content Frame */}
        <main className="flex-1 p-4 md:p-6 pb-24 lg:pb-6 overflow-y-auto">
          {/* CIVORA INTUITIVE JUDGE DEMO COMPANION HUD */}
          <div 
            id="judge-onboarding-hud"
            className={`mb-6 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
              foundationTheme === 'dark' 
                ? 'bg-gradient-to-br from-[#0f1934] via-[#090f21] to-[#0d142b] border-[#1e2d5c]/60 shadow-[0_8px_30px_rgb(0,0,0,0.5)]' 
                : 'bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] border-slate-300/80 shadow-md'
            }`}
          >
            {/* Top Bar / Header of the Companion HUD */}
            <div className={`px-5 py-3 border-b flex items-center justify-between transition-colors ${
              foundationTheme === 'dark' ? 'border-[#1e2d5c]/40' : 'border-slate-300/40'
            }`}>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sparkles size={14} className="animate-pulse" />
                </span>
                <div>
                  <h4 className={`text-xs font-bold tracking-wider uppercase font-mono ${
                    foundationTheme === 'dark' ? 'text-slate-100' : 'text-slate-700'
                  }`}>
                    Civora Intelligent Hackathon Tour Companion
                  </h4>
                  <p className="text-[9px] opacity-75 font-sans mt-0.5">
                    Interactive guided walk-through designed to showcase the complete civic intelligence workflow in 30 seconds.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  id="btn-toggle-tour"
                  onClick={() => setTourExpanded(!tourExpanded)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all border cursor-pointer ${
                    foundationTheme === 'dark'
                      ? 'bg-slate-900/60 border-slate-800 text-emerald-400 hover:text-emerald-300'
                      : 'bg-white border-slate-300 text-emerald-600 hover:bg-slate-50'
                  }`}
                >
                  {tourExpanded ? 'Collapse Tour [−]' : 'Expand Tour Guide [+]'}
                </button>
              </div>
            </div>

            {/* Expanded State with full Pitch and Steps */}
            {tourExpanded ? (
              <div className="p-5 flex flex-col lg:flex-row gap-5 items-stretch">
                {/* Left Side: Step Pitching */}
                <div className="flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono ${
                        foundationTheme === 'dark' ? 'bg-[#10b981]/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#10b981]/10 text-emerald-700 border border-emerald-500/20'
                      }`}>
                        STEP {tourStep} OF 6
                      </span>
                      <h3 className={`text-sm font-bold tracking-tight ${
                        foundationTheme === 'dark' ? 'text-white' : 'text-slate-800'
                      }`}>
                        {tourSteps[tourStep - 1].title}
                      </h3>
                    </div>
                    <p className={`text-xs leading-relaxed mb-4 ${
                      foundationTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {tourSteps[tourStep - 1].description}
                    </p>

                    {/* Bento Grid Features - Pitching Core Questions: What, Why, AI, ROI */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {tourSteps[tourStep - 1].details.map((detail, idx) => (
                        <div 
                          key={idx}
                          className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
                            foundationTheme === 'dark'
                              ? 'bg-[#060a13] border-slate-800/80 hover:border-emerald-500/10'
                              : 'bg-white border-slate-200 hover:border-emerald-500/20'
                          }`}
                        >
                          <span className="text-[9px] font-bold uppercase font-mono tracking-wider text-emerald-500">
                            {detail.label}
                          </span>
                          <p className={`text-[11px] leading-relaxed ${
                            foundationTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            {detail.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Navigation & Execution Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/10 dark:border-slate-800/60">
                    <div className="flex items-center gap-1">
                      {tourSteps.map(s => (
                        <button
                          key={s.step}
                          onClick={() => setTourStep(s.step)}
                          className={`w-5 h-5 rounded-md text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
                            tourStep === s.step
                              ? 'bg-[#10b981] text-slate-950 font-black scale-110 shadow-md'
                              : foundationTheme === 'dark'
                                ? 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {s.step}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setTourStep(prev => Math.max(1, prev - 1))}
                        disabled={tourStep === 1}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 border cursor-pointer ${
                          tourStep === 1
                            ? 'opacity-40 cursor-not-allowed'
                            : foundationTheme === 'dark'
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                              : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        ◀ Previous
                      </button>
                      
                      {/* Active Magic Config Button */}
                      <button
                        onClick={() => tourSteps[tourStep - 1].setup()}
                        className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-lg shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Zap size={13} className="fill-slate-950" />
                        <span>{tourSteps[tourStep - 1].actionText}</span>
                      </button>

                      <button
                        onClick={() => setTourStep(prev => Math.min(6, prev + 1))}
                        disabled={tourStep === 6}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 border cursor-pointer ${
                          tourStep === 6
                            ? 'opacity-40 cursor-not-allowed'
                            : foundationTheme === 'dark'
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                              : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Next ▶
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Side: Demo Quick-Check Guide Checklist */}
                <div className={`w-full lg:w-72 p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                  foundationTheme === 'dark' ? 'bg-[#060a13] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div>
                    <h4 className={`text-xs font-bold font-mono tracking-wider mb-2 flex items-center gap-1.5 ${
                      foundationTheme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                    }`}>
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      JUDGE DEMO CHECKLIST
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-normal mb-3">
                      Complete these 4 simple steps to test the entire operational circle of Civora:
                    </p>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2 text-[11px]">
                        <span className="w-4 h-4 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold font-mono text-[9px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <div>
                          <p className={`font-semibold ${foundationTheme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>SSO Log In</p>
                          <p className="text-[9px] text-slate-400">Click bypass to activate secure token context.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-[11px]">
                        <span className="w-4 h-4 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold font-mono text-[9px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <div>
                          <p className={`font-semibold ${foundationTheme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>Voice Intake & Photo Audit</p>
                          <p className="text-[9px] text-slate-400">Record an audio memo inside the Citizen App to run Gemini standardization.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-[11px]">
                        <span className="w-4 h-4 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold font-mono text-[9px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <div>
                          <p className={`font-semibold ${foundationTheme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>Authority Dispatch</p>
                          <p className="text-[9px] text-slate-400">Review tickets as a supervisor, assign engineers, and sign off.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-[11px]">
                        <span className="w-4 h-4 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold font-mono text-[9px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <div>
                          <p className={`font-semibold ${foundationTheme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>ML Preventive Dispatch</p>
                          <p className="text-[9px] text-slate-400">Inspect hotspots and preemptively dispatch repairs before failures.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`pt-2 border-t text-[10px] font-mono leading-normal opacity-80 ${
                    foundationTheme === 'dark' ? 'border-slate-800/80 text-emerald-400' : 'border-slate-200 text-emerald-700'
                  }`}>
                    💡 Pro tip: Clicking the central flash button auto-configures the views instantly!
                  </div>
                </div>
              </div>
            ) : (
              // Collapsed state bar
              <div className="px-5 py-2.5 flex items-center justify-between bg-[#060a13]/30">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-emerald-400">
                    💡 ACTIVE: Step {tourStep}/6 — {tourSteps[tourStep - 1].title}
                  </span>
                  <span className="hidden md:inline text-[11px] opacity-70">—</span>
                  <p className="hidden md:inline text-[11px] opacity-75">
                    {tourSteps[tourStep - 1].description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => tourSteps[tourStep - 1].setup()}
                    className="px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-[10px] rounded hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Zap size={10} className="fill-slate-950" />
                    <span>Quick Config</span>
                  </button>
                  <button
                    onClick={() => setTourStep(prev => Math.max(1, prev - 1))}
                    disabled={tourStep === 1}
                    className={`p-0.5 text-xs font-mono transition-all disabled:opacity-30 ${foundationTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => setTourStep(prev => Math.min(6, prev + 1))}
                    disabled={tourStep === 6}
                    className={`p-0.5 text-xs font-mono transition-all disabled:opacity-30 ${foundationTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}
                  >
                    ▶
                  </button>
                </div>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {/* TAB: Clean Architecture Folder Structure */}
            {activeTab === 'clean_architecture' && (
              <motion.div
                key="clean_architecture"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-5 gap-6"
              >
                {/* File Tree Panel */}
                <div className={`md:col-span-2 rounded-2xl p-4 flex flex-col h-[600px] overflow-hidden border ${
                  foundationTheme === 'dark' ? 'bg-[#0b1329] border-slate-800 text-slate-100' : 'bg-white border-slate-200/80 text-slate-800 shadow-sm'
                }`}>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Layers size={16} className="text-[#10b981]" />
                    Flutter Directory Tree
                  </h3>
                  <div className="flex-1 overflow-y-auto pr-1 space-y-1">
                    {renderFolderTree(flutterCleanArchitecture)}
                  </div>
                </div>

                {/* Selected File Details & Code Display */}
                <div className={`md:col-span-3 rounded-2xl p-5 flex flex-col h-[600px] overflow-hidden border ${
                  foundationTheme === 'dark' ? 'bg-[#0b1329] border-slate-800 text-slate-100' : 'bg-white border-slate-200/80 text-slate-800 shadow-sm'
                }`}>
                  <div className={`flex items-center justify-between border-b pb-3 mb-4 ${
                    foundationTheme === 'dark' ? 'border-slate-800' : 'border-slate-100'
                  }`}>
                    <div>
                      <h3 className={`font-bold text-base flex items-center gap-2 font-mono ${
                        foundationTheme === 'dark' ? 'text-white' : 'text-slate-800'
                      }`}>
                        {selectedNode.type === 'folder' ? (
                          <Folder size={18} className="text-amber-400" />
                        ) : (
                          <FileCode size={18} className="text-[#38bdf8]" />
                        )}
                        {selectedNode.name}
                      </h3>
                      <p className="text-xs text-[#64748b] mt-1 italic">
                        Type: {selectedNode.type === 'folder' ? 'Directory Container' : 'Dart Source File'}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4">
                    <div className={`p-4 rounded-xl border ${
                      foundationTheme === 'dark' ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-50 border-slate-200/60'
                    }`}>
                      <h4 className="text-xs font-semibold text-[#10b981] uppercase tracking-wider mb-1">
                        Architecture Responsibility
                      </h4>
                      <p className={`text-sm leading-relaxed ${
                        foundationTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                      }`}>
                        {selectedNode.description}
                      </p>
                    </div>

                    {selectedNode.codeSnippet && (
                      <div className="flex-1 flex flex-col">
                        <h4 className="text-xs font-semibold text-[#10b981] uppercase tracking-wider mb-2">
                          Production Boilerplate Example
                        </h4>
                        <div className={`flex-1 rounded-xl p-4 overflow-x-auto font-mono text-xs leading-relaxed max-h-[300px] border ${
                          foundationTheme === 'dark' 
                            ? 'bg-[#090d16] border-slate-800 text-[#cbd5e1]' 
                            : 'bg-slate-900 border-slate-950 text-slate-200'
                        }`}>
                          <pre>{selectedNode.codeSnippet}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: Database Schema */}
            {activeTab === 'database_schema' && (
              <motion.div
                key="database_schema"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className={`rounded-2xl p-6 border ${
                  foundationTheme === 'dark' ? 'bg-[#0b1329] border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
                }`}>
                  <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                    <Database size={20} className="text-[#10b981]" />
                    Cloud Firestore Schema & Security Model
                  </h2>
                  <p className={`text-sm ${
                    foundationTheme === 'dark' ? 'text-[#94a3b8]' : 'text-slate-600'
                  }`}>
                    Civora implements an enterprise-grade database model utilizing the **Split Collection** 
                    pattern to strictly isolate Personally Identifiable Information (PII) from public queries.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {firestoreCollections.map((col, index) => (
                    <div key={index} className={`rounded-2xl p-5 flex flex-col border ${
                      foundationTheme === 'dark' ? 'bg-[#0b1329] border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
                    }`}>
                      <div className={`flex items-start justify-between border-b pb-3 mb-4 ${
                        foundationTheme === 'dark' ? 'border-slate-800' : 'border-slate-100'
                      }`}>
                        <div>
                          <h3 className={`font-bold text-base flex items-center gap-2 ${
                            foundationTheme === 'dark' ? 'text-white' : 'text-slate-800'
                          }`}>
                            <span className="p-1 rounded bg-[#10b981]/10 text-[#10b981] text-xs font-mono">
                              COL
                            </span>
                            {col.name}
                          </h3>
                          <code className="text-xs text-[#10b981] block mt-1 font-mono">
                            {col.path}
                          </code>
                        </div>
                      </div>

                      <p className={`text-xs mb-4 leading-relaxed italic ${
                        foundationTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {col.description}
                      </p>

                      {/* Schema Fields list */}
                      <div className="flex-1 space-y-2 mb-4">
                        <h4 className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1">
                          Attribute Fields Map
                        </h4>
                        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                          {col.fields.map((f, fIdx) => (
                            <div key={fIdx} className={`flex justify-between items-center text-xs p-2 rounded-lg border transition-all ${
                              foundationTheme === 'dark' 
                                ? 'bg-[#0f172a] border-slate-800/60 hover:border-[#10b981]/25' 
                                : 'bg-slate-50 border-slate-200/50 hover:border-[#10b981]/40'
                            }`}>
                              <div>
                                <span className={`font-mono font-medium ${
                                  foundationTheme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                                }`}>{f.name}</span>
                                <span className="text-[10px] text-[#475569] block font-mono">{f.description}</span>
                              </div>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                foundationTheme === 'dark' ? 'bg-slate-800 text-cyan-400' : 'bg-slate-100 text-cyan-700'
                              }`}>
                                {f.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Security summary */}
                      <div className="bg-[#10b981]/5 border border-[#10b981]/15 p-3 rounded-xl flex items-start gap-2.5">
                        <ShieldCheck size={16} className="text-[#10b981] shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-xs font-bold text-[#10b981] mb-0.5">Firestore Security Invariant</h5>
                          <p className={`text-[11px] leading-normal ${
                            foundationTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                          }`}>{col.securityRulesSummary}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TAB: Gemini AI Pipelines */}
            {activeTab === 'ai_pipelines' && (
              <motion.div
                key="ai_pipelines"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className={`rounded-2xl p-6 border ${
                  foundationTheme === 'dark' ? 'bg-[#0b1329] border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
                }`}>
                  <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                    <Brain size={20} className="text-[#10b981]" />
                    Structured Server-Side Gemini AI Pipelines
                  </h2>
                  <p className={`text-sm ${
                    foundationTheme === 'dark' ? 'text-[#94a3b8]' : 'text-slate-600'
                  }`}>
                    In obedience to safety protocols, all LLM inference operations run strictly server-side using 
                    the **@google/genai SDK** proxying queries from the client to isolate municipal keys.
                  </p>
                </div>

                <div className="space-y-4">
                  {geminiPipelines.map((pipeline, pIdx) => (
                    <div key={pIdx} className={`rounded-2xl p-5 grid grid-cols-1 md:grid-cols-5 gap-6 border ${
                      foundationTheme === 'dark' ? 'bg-[#0b1329] border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
                    }`}>
                      <div className="md:col-span-2 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="p-1 px-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-mono border border-emerald-500/20">
                            {pipeline.model}
                          </span>
                        </div>
                        <h3 className={`text-base font-bold ${
                          foundationTheme === 'dark' ? 'text-white' : 'text-slate-800'
                        }`}>{pipeline.name}</h3>
                        <p className={`text-xs leading-relaxed ${
                          foundationTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>{pipeline.description}</p>

                        <div className={`flex items-center gap-2 text-[11px] p-2.5 rounded-xl border ${
                          foundationTheme === 'dark' ? 'text-[#64748b] bg-[#0f172a] border-slate-800' : 'text-slate-500 bg-slate-50 border-slate-200/60'
                        }`}>
                          <Sparkles size={14} className="text-[#10b981]" />
                          <span>Structured JSON Response Mode Enabled</span>
                        </div>
                      </div>

                      <div className="md:col-span-3 space-y-3">
                        <div>
                          <span className="text-[10px] font-semibold text-[#10b981] uppercase tracking-wider block mb-1">
                            System Instruction Prompt
                          </span>
                          <div className={`p-3 rounded-xl font-mono text-xs leading-relaxed max-h-[120px] overflow-y-auto border ${
                            foundationTheme === 'dark' 
                              ? 'bg-[#090d16] border-slate-800 text-[#cbd5e1]' 
                              : 'bg-slate-900 border-slate-950 text-slate-200'
                          }`}>
                            {pipeline.systemInstruction}
                          </div>
                        </div>

                        {pipeline.responseSchema && (
                          <div>
                            <span className="text-[10px] font-semibold text-[#38bdf8] uppercase tracking-wider block mb-1">
                              Response Schema (Typed Struct)
                            </span>
                            <div className={`p-3 rounded-xl font-mono text-xs max-h-[120px] overflow-y-auto border ${
                              foundationTheme === 'dark' 
                                ? 'bg-[#090d16] border-slate-800 text-cyan-400' 
                                : 'bg-slate-900 border-slate-950 text-cyan-300'
                            }`}>
                              <pre>{pipeline.responseSchema}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TAB: Geohash Simulator */}
            {activeTab === 'duplicate_detection' && (
              <motion.div
                key="duplicate_detection"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-5 gap-6"
              >
                {/* Simulator Inputs & Map Canvas */}
                <div className={`lg:col-span-3 rounded-2xl p-5 flex flex-col gap-4 border ${
                  foundationTheme === 'dark' ? 'bg-[#0b1329] border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
                }`}>
                  <div>
                    <h2 className={`text-lg font-bold mb-1 flex items-center gap-2 ${
                      foundationTheme === 'dark' ? 'text-white' : 'text-slate-800'
                    }`}>
                      <MapPin size={20} className="text-[#10b981]" />
                      Geohash-Based Duplicate Detection Simulator
                    </h2>
                    <p className={`text-xs leading-relaxed ${
                      foundationTheme === 'dark' ? 'text-[#94a3b8]' : 'text-slate-500'
                    }`}>
                      Civora clusters reports in real time based on base32 spatial indexing boundaries. Click 
                      anywhere inside the simulated grid zone below to report a civic issue.
                    </p>
                  </div>

                  {/* Interactive Coordinate Canvas */}
                  <div className="relative">
                    <div
                      onClick={handleCanvasClick}
                      className={`w-full h-[280px] border-2 border-dashed rounded-xl relative cursor-crosshair overflow-hidden group transition-colors ${
                        foundationTheme === 'dark' ? 'bg-[#090d16] border-slate-800 hover:border-[#10b981]/40' : 'bg-slate-50 border-slate-300 hover:border-[#10b981]/40'
                      }`}
                    >
                      {/* Grid overlay */}
                      <div className={`absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:30px_30px] opacity-35 ${
                        foundationTheme === 'dark' ? 'bg-[size:30px_30px]' : 'bg-[size:30px_30px]'
                      }`} />

                      {/* Geohash grid region visualizers */}
                      <div className="absolute top-0 left-0 w-1/2 h-full border-r border-[#10b981]/20 bg-emerald-500/[0.01] flex items-end p-2 pointer-events-none">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                          foundationTheme === 'dark' ? 'text-[#10b981] bg-[#0b1329]/90 border-slate-800' : 'text-emerald-700 bg-white/95 border-slate-200 shadow-xs'
                        }`}>
                          Geohash: tdr1w7 (Sector A)
                        </span>
                      </div>
                      <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-500/[0.01] flex items-end justify-end p-2 pointer-events-none">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                          foundationTheme === 'dark' ? 'text-[#38bdf8] bg-[#0b1329]/90 border-slate-800' : 'text-cyan-700 bg-white/95 border-slate-200 shadow-xs'
                        }`}>
                          Geohash: tdr1yd (Sector B)
                        </span>
                      </div>

                      {/* Displaying Current points */}
                      {demoPoints.map((pt) => {
                        // Coordinates map to pixel:
                        // Lat: 12.9700 to 12.9850 (Y coordinate)
                        // Lng: 77.5900 to 77.6050 (X coordinate)
                        const latPct = ((12.9850 - pt.lat) / (12.9850 - 12.9700)) * 100;
                        const lngPct = ((pt.lng - 77.5900) / (77.6050 - 77.5900)) * 100;

                        return (
                          <div
                            key={pt.id}
                            className="absolute -translate-x-1/2 -translate-y-1/2 group/point"
                            style={{ top: `${latPct}%`, left: `${lngPct}%` }}
                          >
                            <div className={`w-3.5 h-3.5 rounded-full ${pt.isDuplicate ? 'bg-amber-500 ring-2 ring-amber-500/20' : 'bg-emerald-500 ring-4 ring-emerald-500/20'} relative flex items-center justify-center cursor-pointer`}>
                              <span className="absolute w-2 h-2 rounded-full bg-white scale-0 group-hover/point:scale-100 transition-transform" />
                            </div>
                            <div className={`absolute left-5 top-0 -translate-y-1/2 text-[10px] border p-1.5 rounded shadow-xl whitespace-nowrap z-10 pointer-events-none opacity-80 group-hover/point:opacity-100 transition-opacity ${
                              foundationTheme === 'dark' ? 'bg-[#020617]/90 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                            }`}>
                              <span className="font-bold">{pt.label}</span>
                              <span className={`block text-[8px] font-mono ${foundationTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                Lat: {pt.lat.toFixed(4)}, Lng: {pt.lng.toFixed(4)} | {pt.geohash}
                              </span>
                              {pt.isDuplicate && (
                                <span className="block text-[8px] text-amber-500 font-bold mt-0.5">
                                  Merged under Ticket #{pt.parentId}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className={`absolute right-3 top-3 p-2 rounded-lg pointer-events-none text-[10px] font-mono border ${
                      foundationTheme === 'dark' ? 'bg-[#0b1329] border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500 shadow-xs'
                    }`}>
                      Coordinates Boundary Zone
                    </div>
                  </div>

                  {/* Manual Form entry */}
                  <form onSubmit={handleAddSimPoint} className={`grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 rounded-xl border ${
                    foundationTheme === 'dark' ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex flex-col gap-1 sm:col-span-1">
                      <label className={`text-[10px] uppercase font-semibold font-mono ${
                        foundationTheme === 'dark' ? 'text-[#64748b]' : 'text-slate-500'
                      }`}>Latitude</label>
                      <input
                        type="text"
                        value={newPointLat}
                        onChange={(e) => setNewPointLat(e.target.value)}
                        className={`border rounded-lg px-2.5 py-1.5 text-xs font-mono focus:border-[#10b981] outline-none ${
                          foundationTheme === 'dark' ? 'bg-[#0b1329] border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      />
                    </div>
                    <div className="flex flex-col gap-1 sm:col-span-1">
                      <label className={`text-[10px] uppercase font-semibold font-mono ${
                        foundationTheme === 'dark' ? 'text-[#64748b]' : 'text-slate-500'
                      }`}>Longitude</label>
                      <input
                        type="text"
                        value={newPointLng}
                        onChange={(e) => setNewPointLng(e.target.value)}
                        className={`border rounded-lg px-2.5 py-1.5 text-xs font-mono focus:border-[#10b981] outline-none ${
                          foundationTheme === 'dark' ? 'bg-[#0b1329] border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      />
                    </div>
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className={`text-[10px] uppercase font-semibold font-mono ${
                        foundationTheme === 'dark' ? 'text-[#64748b]' : 'text-slate-500'
                      }`}>Report Label / Issue Title</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Clogged Storm Drain"
                          value={newPointLabel}
                          onChange={(e) => setNewPointLabel(e.target.value)}
                          className={`border rounded-lg px-2.5 py-1.5 text-xs flex-1 focus:border-[#10b981] outline-none ${
                            foundationTheme === 'dark' ? 'bg-[#0b1329] border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        />
                        <button
                          type="submit"
                          className="bg-[#10b981] hover:bg-[#059669] text-slate-900 font-semibold text-xs px-3 rounded-lg flex items-center gap-1 shrink-0 transition-colors"
                        >
                          <Plus size={14} /> Add
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Algorithmic Explainers & Simulated Log */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  {/* The Algorithmic Flow */}
                  <div className={`rounded-2xl p-5 flex flex-col gap-3 border ${
                    foundationTheme === 'dark' ? 'bg-[#0b1329] border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
                  }`}>
                    <h3 className={`text-sm font-bold flex items-center gap-2 ${
                      foundationTheme === 'dark' ? 'text-white' : 'text-slate-800'
                    }`}>
                      <Network size={16} className="text-[#10b981]" />
                      Duplicate Resolution Pipeline
                    </h3>
                    <div className={`space-y-3.5 text-xs leading-relaxed ${
                      foundationTheme === 'dark' ? 'text-[#94a3b8]' : 'text-slate-600'
                    }`}>
                      <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#10b981]/15 text-[#10b981] font-mono flex items-center justify-center font-bold text-[10px] shrink-0">
                          1
                        </div>
                        <p>
                          Citizen triggers GPS report. Coordinates are mapped to a 6-digit base32 string representing a 1.2km grid zone.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#10b981]/15 text-[#10b981] font-mono flex items-center justify-center font-bold text-[10px] shrink-0">
                          2
                        </div>
                        <p>
                          Civora performs a fast spatial index filter query against Firestore containing the matching hash block.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#10b981]/15 text-[#10b981] font-mono flex items-center justify-center font-bold text-[10px] shrink-0">
                          3
                        </div>
                        <p>
                          If a duplicate hash is located, Gemini compares report images and details semantically. If flagged, the reports are fused.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Simulated Output Log Panel */}
                  <div className={`rounded-2xl p-4 flex-1 flex flex-col min-h-[220px] border ${
                    foundationTheme === 'dark' ? 'bg-[#0b1329] border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
                  }`}>
                    <h4 className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-2.5">
                      Simulator Output Log
                    </h4>
                    <div className={`flex-1 rounded-xl p-3.5 font-mono text-xs overflow-y-auto space-y-2 border ${
                      foundationTheme === 'dark' ? 'bg-[#090d16] border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      {simMessage ? (
                        <div className={`p-2.5 rounded-lg border leading-relaxed ${
                          simMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' :
                          simMessage.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' :
                          foundationTheme === 'dark' ? 'bg-[#0f172a] text-[#94a3b8] border-slate-800' : 'bg-white text-slate-700 border-slate-200 shadow-xs'
                        }`}>
                          {simMessage.text}
                        </div>
                      ) : (
                        <div className="text-slate-500 text-center py-6">
                          System Idle. Place coordinates above.
                        </div>
                      )}

                      <div className={`border-t pt-2 mt-2 text-[10px] flex flex-col gap-1.5 ${
                        foundationTheme === 'dark' ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-500'
                      }`}>
                        <div className="flex justify-between">
                          <span>Total Tracked Tickets:</span>
                          <span className={`font-bold ${foundationTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{demoPoints.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sector `tdr1w7` (Main St):</span>
                          <span className={foundationTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                            {demoPoints.filter(p => p.geohash === 'tdr1w7').length} Reports
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: Core Foundation */}
            {activeTab === 'core_foundation' && (
              <motion.div
                key="core_foundation"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 text-[#f1f5f9]"
              >
                {/* Header Information Card */}
                <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold mb-2 flex items-center gap-2 text-emerald-400">
                        <Smartphone size={20} className="text-[#10b981]" />
                        Phase 1 Core Foundation & Design System Sandbox
                      </h2>
                      <p className="text-sm text-[#94a3b8] leading-relaxed">
                        Verify and stress-test Civora's low-level structural layers. This interactive canvas triggers 
                        simulated execution of the underlying Dart 3 / Riverpod core classes (theme system, GoRouter guards, localization engine, offline cache synchronization, and global error failure mapping).
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setFoundationTheme('dark');
                          setAuthRole('guest');
                          setFoundationLocale('en');
                          setIsOnline(true);
                          setOfflineQueue([]);
                          setConsoleLogs([
                            { id: '1', time: new Date().toTimeString().split(' ')[0], level: 'info', msg: 'Civora Core Bootloader Sequence Activated...' },
                            { id: '2', time: new Date().toTimeString().split(' ')[0], level: 'debug', msg: 'Checking client environment arguments... Device: Android API 34' },
                            { id: '3', time: new Date().toTimeString().split(' ')[0], level: 'info', msg: 'Firebase Service Initialized. Offline cache size: UNLIMITED.' }
                          ]);
                          showSnackbar('Core Sandbox Reset Successful', 'info');
                          addLog('info', 'Reset sandbox state back to default Guest parameters.');
                        }}
                        className="px-3.5 py-1.5 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] rounded-xl text-xs font-semibold text-[#cbd5e1] transition-colors"
                      >
                        Reset Sandbox
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subsystem Bento Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* LEFT BENTO RAIL: Interactivity Controls (8 cols) */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    {/* Grid Row 1: Material 3 Theme System & Design Components */}
                    <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5">
                      <div className="flex items-center justify-between border-b border-[#1e293b] pb-3 mb-4">
                        <div className="flex items-center gap-2">
                          <Palette size={16} className="text-pink-400" />
                          <h3 className="font-bold text-sm">1. Material 3 Theme System & Reusable Widgets</h3>
                        </div>
                        <div className="flex items-center bg-[#090d16] p-1 rounded-lg border border-[#1e293b]">
                          <button
                            onClick={() => {
                              setFoundationTheme('light');
                              addLog('info', 'Applied Material 3 Light Mode Palette. Secondary tone adjusted to neutral container.');
                              showSnackbar('Theme changed to Light Slate Mode', 'success');
                            }}
                            className={`px-3 py-1 text-xs rounded-md transition-colors ${foundationTheme === 'light' ? 'bg-[#10b981] text-slate-950 font-semibold' : 'text-[#64748b] hover:text-slate-300'}`}
                          >
                            Light Mode
                          </button>
                          <button
                            onClick={() => {
                              setFoundationTheme('dark');
                              addLog('info', 'Applied Material 3 Dark Slate Palette. High-contrast OLED dark mode.');
                              showSnackbar('Theme changed to OLED Dark Mode', 'success');
                            }}
                            className={`px-3 py-1 text-xs rounded-md transition-colors ${foundationTheme === 'dark' ? 'bg-[#10b981] text-slate-950 font-semibold' : 'text-[#64748b] hover:text-slate-300'}`}
                          >
                            Dark Mode
                          </button>
                        </div>
                      </div>

                      {/* Dynamic Preview Box using simulated theme colors */}
                      <div className={`p-5 rounded-xl border transition-all duration-300 ${
                        foundationTheme === 'dark' 
                          ? 'bg-[#0f172a] border-[#1e293b] text-[#f1f5f9]' 
                          : 'bg-[#f8fafc] border-[#e2e8f0] text-[#0f172a]'
                      }`}>
                        <div className="flex justify-between items-center mb-4">
                          <span className={`text-[10px] font-mono tracking-widest uppercase ${foundationTheme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            Live Material 3 Design Component Preview
                          </span>
                          <span className="text-[10px] bg-slate-500/10 px-2 py-0.5 rounded font-mono">
                            {foundationTheme === 'dark' ? 'M3 Dark Slate Theme' : 'M3 Warm Light Theme'}
                          </span>
                        </div>

                        {/* Visual representations of buttons, inputs, alerts, spinners */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Left Col: Custom Inputs & Loading */}
                          <div className="space-y-4">
                            <div>
                              <label className={`text-[11px] font-bold block mb-1 font-mono uppercase ${foundationTheme === 'dark' ? 'text-[#94a3b8]' : 'text-[#475569]'}`}>
                                CivoraTextField Input State
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Type civic complaint title..."
                                  className={`w-full text-xs px-3 py-2.5 rounded-lg outline-none border transition-all duration-150 ${
                                    foundationTheme === 'dark' 
                                      ? 'bg-[#020617] border-[#1e293b] text-slate-200 focus:border-[#10b981]' 
                                      : 'bg-white border-[#cbd5e1] text-slate-800 focus:border-emerald-600 shadow-sm'
                                  }`}
                                />
                                <span className="absolute right-2.5 top-2.5">
                                  <Check size={14} className={foundationTheme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} />
                                </span>
                              </div>
                            </div>

                            <div>
                              <label className={`text-[11px] font-bold block mb-1 font-mono uppercase ${foundationTheme === 'dark' ? 'text-[#94a3b8]' : 'text-[#475569]'}`}>
                                CivoraLoading Spinner
                              </label>
                              <div className={`flex items-center gap-2.5 p-3 rounded-lg border ${foundationTheme === 'dark' ? 'bg-[#020617]/50 border-[#1e293b]/40' : 'bg-white border-[#cbd5e1]/40'}`}>
                                <div className={`w-4.5 h-4.5 rounded-full border-2 border-t-transparent animate-spin ${foundationTheme === 'dark' ? 'border-[#10b981]' : 'border-emerald-600'}`} />
                                <span className="text-xs font-mono">Processing audio waveform via Gemini...</span>
                              </div>
                            </div>
                          </div>

                          {/* Right Col: Custom M3 Buttons & Feedback Cards */}
                          <div className="space-y-3">
                            <label className={`text-[11px] font-bold block font-mono uppercase ${foundationTheme === 'dark' ? 'text-[#94a3b8]' : 'text-[#475569]'}`}>
                              CivoraButton Variants
                            </label>

                            {/* Normal filled Button */}
                            <button
                              onClick={() => {
                                showSnackbar('Primary Button Clicked', 'success');
                                addLog('debug', 'CivoraButton primary state trigger action.');
                              }}
                              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 shadow ${
                                foundationTheme === 'dark'
                                  ? 'bg-[#10b981] hover:bg-[#059669] text-slate-950 font-extrabold'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              <CheckCircle2 size={14} /> Submit Primary
                            </button>

                            {/* Outline variant */}
                            <button
                              onClick={() => {
                                addLog('debug', 'CivoraButton secondary outline triggered.');
                                showSnackbar('Secondary Button Pressed', 'info');
                              }}
                              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 border ${
                                foundationTheme === 'dark'
                                  ? 'border-[#1e293b] hover:bg-[#1e293b]/50 text-slate-200'
                                  : 'border-[#cbd5e1] hover:bg-slate-100 text-[#0f172a]'
                              }`}
                            >
                              <Info size={14} /> View Secondary
                            </button>

                            {/* Disabled state button */}
                            <button
                              disabled
                              className={`w-full py-2.5 px-4 rounded-xl text-xs font-medium cursor-not-allowed flex items-center justify-center gap-1.5 opacity-50 ${
                                foundationTheme === 'dark'
                                  ? 'bg-[#1e293b] text-[#475569]'
                                  : 'bg-slate-200 text-slate-400'
                              }`}
                            >
                              <Lock size={14} /> Disabled / Admin Only
                            </button>
                          </div>

                        </div>
                      </div>
                    </div>

                    {/* Grid Row 2: GoRouter Role-Based Navigation Guards */}
                    <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5">
                      <div className="flex items-center justify-between border-b border-[#1e293b] pb-3 mb-4">
                        <div className="flex items-center gap-2">
                          <UserCheck size={16} className="text-indigo-400" />
                          <h3 className="font-bold text-sm">2. GoRouter Role-Based Navigation Guards</h3>
                        </div>
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono">
                          ABAC SECURE
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                        
                        {/* Control Select panel */}
                        <div className="md:col-span-6 space-y-4">
                          <p className="text-xs text-[#94a3b8] leading-relaxed">
                            Civora's routing logic secures municipal routes using role-based assertions. Toggle 
                            the active authentication context to simulate route gatekeeping.
                          </p>

                          <div>
                            <label className="text-[10px] uppercase text-[#64748b] font-semibold font-mono block mb-1">
                              Simulated Auth Session Role
                            </label>
                            <select
                              value={authRole}
                              onChange={(e) => {
                                const role = e.target.value as any;
                                setAuthRole(role);
                                addLog('info', `Authentication Session altered. Active context role: ${role.toUpperCase()}`);
                                showSnackbar(`Session role swapped to ${role.replace('_', ' ')}`, 'info');
                              }}
                              className="w-full bg-[#090d16] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:border-indigo-500 outline-none"
                            >
                              <option value="guest">Guest (Unauthenticated)</option>
                              <option value="citizen">Citizen (Standard User)</option>
                              <option value="field_engineer">Field Engineer (Authority)</option>
                              <option value="supervisor">Supervisor (Authority)</option>
                              <option value="higher_authority">Higher Authority (Executive)</option>
                            </select>
                          </div>

                          <button
                            onClick={() => {
                              // Perform dynamic navigation trace
                              addLog('info', `[GoRouter:Init] Guard trace initiated on path: "/admin/analytics"`);
                              if (authRole === 'guest') {
                                addLog('warn', '[GoRouter:Redirect] Unauthenticated session on private path. Redirecting back to "/login"');
                                showSnackbar('Route Denied! Redirected to Login Screen', 'warning');
                              } else if (authRole === 'citizen') {
                                addLog('warn', '[GoRouter:Redirect] Authorization violation. Citizen cannot access administrative panels. Redirecting to "/citizen/dashboard"');
                                showSnackbar('Authorization Denied! Redirected to Citizen Hub', 'error');
                              } else {
                                addLog('info', `[GoRouter:Authorized] Access Granted. Mounting role-specific controller for ${authRole.toUpperCase()}. Routing path: "/admin/analytics"`);
                                showSnackbar(`Access Granted! Routing to Administrative Insights`, 'success');
                              }
                            }}
                            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                          >
                            <Lock size={14} /> Trigger Admin Dashboard Path
                          </button>
                        </div>

                        {/* Animated Visual Mock Device Screen */}
                        <div className="md:col-span-6 bg-[#090d16] border border-[#1e293b] rounded-xl p-4 flex flex-col justify-between h-[210px] relative overflow-hidden">
                          <div className="flex justify-between items-center pb-2 border-b border-[#1e293b]">
                            <div className="flex items-center gap-1">
                              <Smartphone size={12} className="text-slate-500" />
                              <span className="text-[10px] font-mono text-slate-400">Mock App Device</span>
                            </div>
                            <span className="text-[8px] bg-slate-800 text-indigo-400 px-1.5 py-0.5 rounded font-mono">
                              {authRole === 'guest' ? 'UNAUTHENTICATED' : 'SECURE SESSION'}
                            </span>
                          </div>

                          {/* Dynamic Active App Screen Representation */}
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-3">
                            <AnimatePresence mode="wait">
                              {authRole === 'guest' && (
                                <motion.div
                                  key="screen-guest"
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="space-y-1"
                                >
                                  <Lock className="w-8 h-8 text-amber-500 mx-auto mb-1 animate-bounce" />
                                  <div className="text-xs font-bold text-slate-100">Login Gateway</div>
                                  <p className="text-[10px] text-slate-500 font-mono">path: /login</p>
                                </motion.div>
                              )}
                              {authRole === 'citizen' && (
                                <motion.div
                                  key="screen-citizen"
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="space-y-1"
                                >
                                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                                  <div className="text-xs font-bold text-slate-100">Citizen Reporting Hub</div>
                                  <p className="text-[10px] text-slate-500 font-mono">path: /citizen/dashboard</p>
                                </motion.div>
                              )}
                              {authRole === 'field_engineer' && (
                                <motion.div
                                  key="screen-engineer"
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="space-y-1"
                                >
                                  <List className="w-8 h-8 text-blue-400 mx-auto mb-1" />
                                  <div className="text-xs font-bold text-slate-100">Engineer Task Dispatch</div>
                                  <p className="text-[10px] text-slate-500 font-mono">path: /engineer/tasklist</p>
                                </motion.div>
                              )}
                              {authRole === 'supervisor' && (
                                <motion.div
                                  key="screen-supervisor"
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="space-y-1"
                                >
                                  <ShieldCheck className="w-8 h-8 text-indigo-400 mx-auto mb-1" />
                                  <div className="text-xs font-bold text-slate-100">Supervisor Control Center</div>
                                  <p className="text-[10px] text-slate-500 font-mono">path: /supervisor/workorders</p>
                                </motion.div>
                              )}
                              {authRole === 'higher_authority' && (
                                <motion.div
                                  key="screen-higher"
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="space-y-1"
                                >
                                  <Brain className="w-8 h-8 text-pink-400 mx-auto mb-1" />
                                  <div className="text-xs font-bold text-slate-100">Executive Insights Console</div>
                                  <p className="text-[10px] text-slate-500 font-mono">path: /authority/insights</p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <div className="border-t border-[#1e293b] pt-1.5 text-center text-[8px] font-mono text-slate-500">
                            SYSTEM REDIRECT GUARANTEED VIA GOROUTER 7.0
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Grid Row 3: Localization String Engine & Offline Cache Persistence (Flex/Grid Layout) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Subsegment: Localization Engine */}
                      <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5 mb-3">
                            <div className="flex items-center gap-2">
                              <Globe size={15} className="text-teal-400" />
                              <h4 className="font-bold text-xs">3. Localization (arb) Engine</h4>
                            </div>
                            <Languages size={15} className="text-slate-500" />
                          </div>

                          <p className="text-xs text-[#94a3b8] leading-relaxed mb-3">
                            Civora's multi-locale infrastructure maps keys dynamically to ensure accessibility.
                          </p>

                          {/* Language selector */}
                          <div className="mb-4">
                            <label className="text-[9px] uppercase text-[#64748b] font-semibold font-mono block mb-1">Select Language (App.arb Mappings)</label>
                            <select
                              value={foundationLocale}
                              onChange={(e) => {
                                const loc = e.target.value as any;
                                setFoundationLocale(loc);
                                addLog('info', `Localization table loaded context: ${loc.toUpperCase()}`);
                                showSnackbar(`Locale loaded: ${loc.toUpperCase()}`, 'success');
                              }}
                              className="w-full bg-[#090d16] border border-[#1e293b] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono outline-none focus:border-teal-400"
                            >
                              <option value="en">English (US)</option>
                              <option value="es">Spanish (ES)</option>
                              <option value="hi">Hindi (IN)</option>
                            </select>
                          </div>

                          {/* Dictionary strings output */}
                          <div className="space-y-2 bg-[#090d16] p-3 rounded-xl border border-[#1e293b] font-mono text-xs">
                            <div className="flex justify-between border-b border-[#1e293b]/50 pb-1">
                              <span className="text-slate-500 text-[10px]">ARB KEY</span>
                              <span className="text-slate-500 text-[10px]">TRANSLATION</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#38bdf8] text-[11px]">appTitle</span>
                              <span className="text-slate-200 font-sans text-[11px]">
                                {foundationLocale === 'en' && 'Civora'}
                                {foundationLocale === 'es' && 'Cívora'}
                                {foundationLocale === 'hi' && 'सिवोरा'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#38bdf8] text-[11px]">reportSuccess</span>
                              <span className="text-slate-200 font-sans text-[11px] text-right truncate max-w-[140px]" title={
                                foundationLocale === 'en' ? 'Report submitted successfully' :
                                foundationLocale === 'es' ? 'Informe enviado con éxito' :
                                'रिपोर्ट सफलतापूर्वक सबमिट की गई'
                              }>
                                {foundationLocale === 'en' && 'Report submitted successfully'}
                                {foundationLocale === 'es' && 'Informe enviado con éxito'}
                                {foundationLocale === 'hi' && 'रिपोर्ट सफलतापूर्वक सबमिट की गई'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#38bdf8] text-[11px]">netOffline</span>
                              <span className="text-slate-200 font-sans text-[11px]">
                                {foundationLocale === 'en' && 'No Internet. Saved to Cache'}
                                {foundationLocale === 'es' && 'Sin Internet. Guardado en caché'}
                                {foundationLocale === 'hi' && 'इंटरनेट नहीं है। कैश किया गया'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Subsegment: Offline Cache persistence sync queue */}
                      <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5 mb-3">
                            <div className="flex items-center gap-2">
                              {isOnline ? (
                                <Wifi size={15} className="text-emerald-400" />
                              ) : (
                                <WifiOff size={15} className="text-amber-500 animate-pulse" />
                              )}
                              <h4 className="font-bold text-xs">4. Offline Sync Queue (SQLite)</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono">Connection:</span>
                              <button
                                onClick={() => {
                                  setIsOnline(!isOnline);
                                  addLog('warn', `Device network hardware state set to ${!isOnline ? 'ONLINE' : 'OFFLINE'}`);
                                  showSnackbar(`Connection changed to ${!isOnline ? 'Online' : 'Offline'}`, 'info');
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                                  isOnline 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                }`}
                              >
                                {isOnline ? 'ONLINE' : 'OFFLINE'}
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-[#94a3b8] leading-relaxed mb-3">
                            Submit a civic complaint. If offline, the cache layer intercepts and holds it in local SQLite storage.
                          </p>

                          {/* Quick Submit Test */}
                          <div className="flex gap-2 mb-3.5">
                            <input
                              id="cache-complaint-input"
                              type="text"
                              placeholder="e.g. Water leak, High Street"
                              defaultValue="Water leak near Park Road"
                              className="bg-[#090d16] border border-[#1e293b] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 flex-1 outline-none focus:border-[#10b981]"
                            />
                            <button
                              onClick={() => {
                                const inp = document.getElementById('cache-complaint-input') as HTMLInputElement;
                                if (!inp || !inp.value.trim()) return;
                                const val = inp.value;
                                
                                if (!isOnline) {
                                  const id = generateUniqueId();
                                  setOfflineQueue(prev => [...prev, {
                                    id,
                                    title: val,
                                    category: 'Water Hazard',
                                    timestamp: new Date().toLocaleTimeString()
                                  }]);
                                  addLog('warn', `[SQLite:Cache] Device offline. Stashing transaction "${val}" inside secure app partition.`);
                                  showSnackbar('No Internet! Issue cached locally in SQLite', 'warning');
                                } else {
                                  addLog('info', `[Firestore:Sync] Device online. Direct cloud stream transaction successfully uploaded: "${val}"`);
                                  showSnackbar('Issue submitted directly to cloud!', 'success');
                                }
                                inp.value = '';
                              }}
                              className="px-3 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold text-xs rounded-lg transition-colors"
                            >
                              File
                            </button>
                          </div>

                          {/* Local Queue List Viewer */}
                          <div className="bg-[#090d16] rounded-xl border border-[#1e293b] p-2.5 h-[100px] overflow-y-auto">
                            <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Cached Sync Queue ({offlineQueue.length})</span>
                            {offlineQueue.length === 0 ? (
                              <div className="text-slate-500 text-[10px] text-center pt-5">
                                Queue clear. Toggle Offline & submit to cache tickets.
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {offlineQueue.map((item) => (
                                  <div key={item.id} className="flex justify-between items-center bg-[#0b1329] border border-[#1e293b]/60 px-2 py-1 rounded text-[10px] font-mono">
                                    <span className="text-slate-300 truncate max-w-[140px]">{item.title}</span>
                                    <span className="text-amber-500 bg-amber-500/10 px-1 py-0.2 rounded font-bold uppercase text-[8px] animate-pulse">PENDING SYNC</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Connection restoration sync helper */}
                        {!isOnline && offlineQueue.length > 0 && (
                          <button
                            onClick={() => {
                              setIsOnline(true);
                              setIsSubmittingOffline(true);
                              addLog('info', '[SyncManager] Internet Restored! Synchronization service booted.');
                              addLog('debug', `[SyncManager] Beginning stream upload of ${offlineQueue.length} cached records to Firestore...`);
                              
                              setTimeout(() => {
                                offlineQueue.forEach(item => {
                                  addLog('info', `[SyncManager:Success] Flushed local record #${item.id} -> uploaded: "${item.title}"`);
                                });
                                setOfflineQueue([]);
                                setIsSubmittingOffline(false);
                                addLog('info', '[SyncManager:Success] Local database queue flushed. Synchronization completed successfully.');
                                showSnackbar('Successfully synced cached tickets to Cloud Firestore!', 'success');
                              }, 1500);
                            }}
                            className="mt-3 w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow transition-colors"
                          >
                            {isSubmittingOffline ? (
                              <>
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin border-slate-950" />
                                Synchronizing Cache...
                              </>
                            ) : (
                              <>
                                <Wifi size={13} /> Network Restored? Sync Queue
                              </>
                            )}
                          </button>
                        )}
                      </div>

                    </div>

                    {/* Grid Row 4: Global Exception & Failure Resolver */}
                    <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-5">
                      <div className="flex items-center justify-between border-b border-[#1e293b] pb-3 mb-4">
                        <div className="flex items-center gap-2">
                          <AlertCircle size={16} className="text-red-400" />
                          <h3 className="font-bold text-sm">5. Global Exception & Failure Assertions</h3>
                        </div>
                        <span className="text-[10px] font-mono bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/10">
                          TYPED FAILURE
                        </span>
                      </div>

                      <p className="text-xs text-[#94a3b8] leading-relaxed mb-4">
                        Civora prevents hard system crashes by wrapping low-level network or Firebase errors with 
                        typed <code className="text-emerald-400 font-mono text-[10px]">Failure</code> instances that resolve gracefully in the UI.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          onClick={() => {
                            addLog('error', '[Exception] Firebase Firestore returned error code [11]: "Missing or insufficient permissions"');
                            addLog('warn', '[ErrorHandler] Exception mapped to ServerFailure: API rules denied write privilege.');
                            showSnackbar('ServerFailure: Action Denied by Firestore Rule Rules', 'error');
                          }}
                          className="px-3 py-2 bg-red-950/15 hover:bg-red-950/30 border border-red-500/20 rounded-xl text-xs font-semibold text-red-400 flex items-center justify-center gap-2 transition-colors"
                        >
                          Trigger PermissionDenied
                        </button>

                        <button
                          onClick={() => {
                            addLog('error', '[Exception] SocketTimeoutException: connection closed after 15000ms');
                            addLog('warn', '[ErrorHandler] Exception mapped to NetworkFailure: device is disconnected or server lagging.');
                            showSnackbar('NetworkFailure: Cloud services are currently unreachable', 'error');
                          }}
                          className="px-3 py-2 bg-red-950/15 hover:bg-red-950/30 border border-red-500/20 rounded-xl text-xs font-semibold text-red-400 flex items-center justify-center gap-2 transition-colors"
                        >
                          Trigger TimeoutException
                        </button>

                        <button
                          onClick={() => {
                            addLog('error', '[Exception] geohashDuplicateMergeException: colliding coordinates inside zone: tdr1w7');
                            addLog('warn', '[ErrorHandler] Exception mapped to DuplicateCollisionFailure: fusing ticket upvote.');
                            showSnackbar('DuplicateCollisionFailure: Ticket merged into existing geohash', 'warning');
                          }}
                          className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 rounded-xl text-xs font-semibold text-amber-400 flex items-center justify-center gap-2 transition-colors"
                        >
                          Trigger DuplicateCollision
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* RIGHT BENTO RAIL: Real-Time Level Terminal Logs (4 cols) */}
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    
                    {/* Console terminal card */}
                    <div className="bg-[#0b1329] border border-[#1e293b] rounded-2xl p-4 flex-1 flex flex-col h-[700px] overflow-hidden">
                      <div className="flex justify-between items-center border-b border-[#1e293b] pb-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Terminal size={15} className="text-emerald-400" />
                          <h4 className="font-bold text-xs">Civora Logger Terminal</h4>
                        </div>
                        <button
                          onClick={() => {
                            setConsoleLogs([]);
                            showSnackbar('Leveled logs cleared', 'info');
                          }}
                          className="text-[10px] text-slate-500 hover:text-slate-300 font-mono"
                        >
                          Clear
                        </button>
                      </div>

                      {/* Filter controls */}
                      <div className="flex gap-1 mb-3.5">
                        <span className="text-[10px] text-[#475569] font-mono flex items-center pr-1.5">FILTERS:</span>
                        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[9px] rounded font-mono">DEBUG</span>
                        <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 text-[9px] rounded font-mono">INFO</span>
                        <span className="px-1.5 py-0.5 bg-amber-950 text-amber-500 text-[9px] rounded font-mono">WARN</span>
                        <span className="px-1.5 py-0.5 bg-red-950 text-red-400 text-[9px] rounded font-mono">ERROR</span>
                      </div>

                      {/* Log Screen Area */}
                      <div className="flex-1 bg-[#090d16] border border-[#1e293b] rounded-xl p-3 font-mono text-xs overflow-y-auto space-y-2.5 max-h-[580px]">
                        {consoleLogs.length === 0 ? (
                          <div className="text-slate-600 text-center py-20 text-[11px]">
                            No terminal entries. Interact with the sandbox buttons to populate logs.
                          </div>
                        ) : (
                          consoleLogs.map((log) => (
                            <div key={log.id} className="text-[11px] leading-relaxed border-l-2 pl-2 border-slate-800">
                              <div className="flex justify-between text-[9px] text-[#475569] mb-0.5">
                                <span>{log.time}</span>
                                <span className={`font-bold ${
                                  log.level === 'debug' ? 'text-slate-400' :
                                  log.level === 'info' ? 'text-emerald-400' :
                                  log.level === 'warn' ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                  {log.level.toUpperCase()}
                                </span>
                              </div>
                              <p className={`${
                                log.level === 'error' ? 'text-red-300 font-medium' :
                                log.level === 'warn' ? 'text-amber-300' :
                                log.level === 'debug' ? 'text-slate-400 italic' :
                                'text-slate-200'
                              }`}>
                                {log.msg}
                              </p>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="border-t border-[#1e293b] pt-2.5 mt-3 flex justify-between items-center text-[10px] font-mono text-[#475569]">
                        <span>CORE STATUS: ACTIVE</span>
                        <span>THREAD: MAIN#0</span>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Floating toast notifications layer */}
                <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
                  <AnimatePresence>
                    {snackbars.map((s) => (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={`p-3.5 rounded-xl border shadow-2xl flex items-start gap-3 pointer-events-auto bg-[#0b1329] ${
                          s.type === 'success' ? 'border-emerald-500/30 border-l-4 border-l-emerald-400' :
                          s.type === 'error' ? 'border-red-500/30 border-l-4 border-l-red-400' :
                          s.type === 'warning' ? 'border-amber-500/30 border-l-4 border-l-amber-400' :
                          'border-[#1e293b] border-l-4 border-l-teal-400'
                        }`}
                      >
                        {s.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />}
                        {s.type === 'error' && <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />}
                        {s.type === 'warning' && <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />}
                        {s.type === 'info' && <Info size={16} className="text-teal-400 shrink-0 mt-0.5" />}
                        <div>
                          <p className="text-xs font-semibold text-slate-100">{s.message}</p>
                          <span className="text-[9px] text-[#475569] font-mono block mt-0.5">M3 SnackBar Widget</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

              </motion.div>
            )}

            {/* TAB: Analytics & Impact Dashboard */}
            {activeTab === 'analytics_dashboard' && (
              <motion.div
                key="analytics_dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <AnalyticsDashboard complaints={complaints} theme={foundationTheme} />
              </motion.div>
            )}

            {/* TAB: Complaint Reporting Simulator */}
            {activeTab === 'complaint_reporting' && (
              <motion.div
                key="complaint_reporting"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className={`border rounded-2xl p-6 transition-all ${
                  foundationTheme === 'dark' ? 'bg-[#0b1329] border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
                }`}>
                  <h2 className={`text-xl font-bold mb-2 flex items-center gap-2 font-display ${
                    foundationTheme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    <Sparkles size={20} className="text-[#10b981]" />
                    Citizen Complaint Reporting App Simulator
                  </h2>
                  <p className={`text-sm ${
                    foundationTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Test the complete, production-ready complaint reporting flow interactively. This represents 
                    the Flutter client interface connected with high-accuracy GPS geohashes, multi-media pipelines, offline queues, and automatic cloud sync.
                  </p>
                </div>

                <ComplaintReportingSimulator
                  complaints={complaints}
                  onComplaintsChange={setComplaints}
                  theme={foundationTheme}
                  isClientAuthenticated={isClientAuthenticated}
                  onClientAuthenticatedChange={setIsClientAuthenticated}
                  authRole={authRole}
                  onAuthRoleChange={setAuthRole}
                  lang={foundationLocale}
                  onLangChange={setFoundationLocale}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
