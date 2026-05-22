import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search,
  Wind, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  BarChart3, 
  RefreshCw,
  Droplets,
  Cloud,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Cpu,
  Database,
  Zap,
  Code,
  Layers,
  Terminal,
  Settings,
  ShieldCheck,
  X,
  Key,
  ExternalLink
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { predictAQI, searchAQIByLocation, type AQIInput, type AQIResult } from "./services/gemini";
import { predictCropViability, type CropPredictResult } from "./services/crop";
import { cn } from "./lib/utils";

const AQI_CATEGORIES = {
  "Good": { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle2 },
  "Moderate": { color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: Info },
  "Unhealthy for Sensitive Groups": { color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: AlertTriangle },
  "Unhealthy": { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", icon: AlertTriangle },
  "Very Unhealthy": { color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", icon: AlertTriangle },
  "Hazardous": { color: "text-rose-900", bg: "bg-rose-900/10", border: "border-rose-900/20", icon: AlertTriangle },
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<"home" | "about" | "prediction" | "visualization" | "forecast" | "crops">("home");
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [localToken, setLocalToken] = useState(localStorage.getItem("waqi_token") || "");

  const handleSaveToken = () => {
    const trimmedToken = localToken.trim();
    localStorage.setItem("waqi_token", trimmedToken);
    setLocalToken(trimmedToken);
    setShowSettings(false);
    setError(null);
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [result, setResult] = useState<AQIResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputs, setInputs] = useState<AQIInput>({
    pm25: 12,
    pm10: 20,
    no2: 15,
    co: 0.5,
    so2: 5
  });
  const [cropResult, setCropResult] = useState<CropPredictResult | null>(null);
  const [cropLoading, setCropLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const prediction = await predictAQI(inputs);
      setResult(prediction);
      setActiveTab("visualization");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    setError(null);
    try {
      const prediction = await searchAQIByLocation(searchQuery);
      setResult(prediction);
      setActiveTab("visualization");
      // Update inputs based on search result if available
      if (prediction.pollutants) {
        const newInputs = { ...inputs };
        prediction.pollutants.forEach(p => {
          const key = p.name.toLowerCase().replace(/[^a-z0-9]/g, "") as keyof AQIInput;
          if (key in newInputs) {
            newInputs[key] = p.value;
          }
        });
        setInputs(newInputs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      // If search fails, we should still show the error, maybe switch to visualization or show a toast
      // For now, let's ensure the error is visible on the current tab too
    } finally {
      setSearchLoading(false);
    }
  };

  const handleInputChange = (id: string, value: string) => {
    const numValue = value === "" ? 0 : parseFloat(value);
    setInputs(prev => ({ ...prev, [id]: numValue }));
  };

  const handleCropPredict = async () => {
    if (!result) return;
    
    setCropLoading(true);
    setError(null);
    try {
      const cropPrediction = await predictCropViability(
        inputs.pm25,
        inputs.pm10,
        inputs.no2,
        inputs.co,
        inputs.so2,
        result.aqi
      );
      setCropResult(cropPrediction);
      setActiveTab("crops");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to predict crops");
    } finally {
      setCropLoading(false);
    }
  };

  const getCategoryStyles = (category: string) => {
    return AQI_CATEGORIES[category as keyof typeof AQI_CATEGORIES] || AQI_CATEGORIES["Moderate"];
  };

  return (
    <AnimatePresence mode="wait">
      {showSplash ? (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999]"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30">
              <Wind size={56} />
            </div>
            <div className="text-center space-y-2">
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-5xl font-black tracking-tighter text-[#1A1A1A]"
              >
                EcoPredict AI
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="text-gray-400 font-medium tracking-widest uppercase text-[10px]"
              >
                Environmental Intelligence
              </motion.p>
            </div>
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.8, duration: 1.2, ease: "easeInOut" }}
              className="w-48 h-1 bg-emerald-500/20 rounded-full overflow-hidden relative"
            >
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="absolute inset-0 bg-emerald-500 w-1/2"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div 
          key="main"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-emerald-100"
        >
          {/* Header */}
          <header className="border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("home")}>
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                  <Wind size={20} />
                </div>
                <h1 className="font-bold text-lg tracking-tight">EcoPredict AI</h1>
              </div>

              <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8 relative hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search area (e.g. New York, Delhi)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-100 border-none rounded-full py-2.5 pl-12 pr-10 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
                {searchLoading && (
                  <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 animate-spin" size={16} />
                )}
              </form>

              <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-500">
                {[
                  { id: "home", label: "Home" },
                  { id: "about", label: "About" },
                  { id: "prediction", label: "Prediction" },
                  { id: "forecast", label: "Forecast" },
                  { id: "visualization", label: "Visualization" },
                  { id: "crops", label: "Crops & Agriculture" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "transition-colors relative py-2",
                      activeTab === tab.id ? "text-emerald-600" : "hover:text-black"
                    )}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"
                      />
                    )}
                  </button>
                ))}
              </nav>
              <button className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-all ml-4">
                Connect Station
              </button>
              <button 
                id="settings-toggle-btn"
                onClick={() => setShowSettings(true)}
                className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-500 ml-4"
                title="API Settings"
              >
                <Settings size={20} />
              </button>
            </div>
          </header>

          {/* Settings Modal */}
          <AnimatePresence>
            {showSettings && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowSettings(false)}
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                        <Key size={20} />
                      </div>
                      <h3 className="text-xl font-bold">API Configuration</h3>
                    </div>
                    <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                      <X size={20} />
                      <span className="sr-only">Close settings</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                      <p className="text-xs text-blue-700 leading-relaxed">
                        <strong>Note:</strong> This is for the <strong>World Air Quality Index (WAQI)</strong> API, not the Gemini API.
                      </p>
                      <a 
                        href="https://aqicn.org/data-platform/token/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 mt-2"
                      >
                        Get a free WAQI token here <ExternalLink size={12} />
                      </a>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                        WAQI API Token
                      </label>
                      <input 
                        type="text"
                        value={localToken}
                        onChange={(e) => setLocalToken(e.target.value)}
                        placeholder="Paste your token here..."
                        className="w-full bg-gray-50 border border-black/5 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      This token is used to fetch real-time air quality data for the search feature. It is saved locally in your browser.
                    </p>
                    <button 
                      id="save-token-btn"
                      onClick={handleSaveToken}
                      className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      Save Configuration
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <main className="max-w-7xl mx-auto px-6 py-12">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between gap-3 text-red-600 text-sm"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle size={18} />
                  <span>{error}</span>
                </div>
                <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded-full transition-colors">
                  <X size={16} />
                  <span className="sr-only">Dismiss error</span>
                </button>
              </motion.div>
            )}
            <AnimatePresence mode="wait">
              {activeTab === "home" && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-24 pb-12"
                >
                  {/* Hero Section */}
                  <section className="text-center space-y-8 max-w-4xl mx-auto py-12">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-widest"
                    >
                      <Activity size={14} />
                      AI-Powered Environmental Intelligence
                    </motion.div>
                    <h2 className="text-7xl font-black tracking-tighter leading-[0.85]">
                      Predict Air Quality <br />
                      <span className="text-emerald-500">With Precision.</span>
                    </h2>
                    <p className="text-gray-500 text-xl leading-relaxed max-w-2xl mx-auto">
                      EcoPredict AI uses advanced machine learning to analyze pollution parameters and provide real-time AQI forecasts, helping you make informed decisions for your health.
                    </p>

                    <div className="max-w-xl mx-auto pt-4">
                      <form onSubmit={handleSearch} className="relative group">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <div className="relative flex items-center bg-white border border-black/5 rounded-3xl p-2 shadow-xl">
                          <Search className="ml-4 text-gray-400" size={20} />
                          <input
                            type="text"
                            placeholder="Search your city (e.g. London, Tokyo)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent border-none px-4 py-3 text-lg focus:ring-0 placeholder:text-gray-300"
                          />
                          <button
                            id="search-submit-btn"
                            type="submit"
                            disabled={searchLoading}
                            className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50"
                          >
                            {searchLoading ? <RefreshCw size={18} className="animate-spin" /> : "Search"}
                          </button>
                        </div>
                      </form>
                      <p className="text-[10px] text-gray-400 mt-4 uppercase tracking-widest font-bold">
                        Powered by WAQI Real-time Data
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-4 pt-8">
                      <button 
                        onClick={() => setActiveTab("prediction")}
                        className="bg-emerald-500 text-white px-10 py-5 rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-2xl shadow-emerald-500/30 flex items-center gap-2 group"
                      >
                        Start Prediction
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                      <button 
                        onClick={() => setActiveTab("about")}
                        className="bg-white border border-black/5 px-10 py-5 rounded-2xl font-bold hover:bg-gray-50 transition-all"
                      >
                        Learn More
                      </button>
                    </div>
                  </section>

                  {/* Features Grid */}
                  <section className="space-y-12">
                    <div className="text-center space-y-2">
                      <h3 className="text-3xl font-black tracking-tight">Core Features</h3>
                      <p className="text-gray-400 text-sm">Everything you need to monitor and predict air quality.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                      {[
                        { icon: Wind, title: "Real-time Monitoring", desc: "Track PM2.5, PM10, and other key pollutants instantly with high precision sensors or manual input." },
                        { icon: Activity, title: "AI Predictions", desc: "Our Gemini-powered model forecasts AQI trends for the next 24 hours based on historical patterns." },
                        { icon: BarChart3, title: "Data Visualization", desc: "Interactive charts and health impact analysis for every reading, making complex data easy to understand." },
                        { icon: Search, title: "Global Search", desc: "Search for any city or area worldwide to get instant air quality reports and AI-driven recommendations." },
                        { icon: AlertTriangle, title: "Health Alerts", desc: "Receive specific health advice based on current pollution levels tailored for sensitive groups." },
                        { icon: RefreshCw, title: "Dynamic Trends", desc: "Understand if air quality is improving or worsening with our trend analysis and future forecasting." },
                      ].map((feature, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 group"
                        >
                          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <feature.icon size={28} />
                          </div>
                          <h3 className="text-xl font-bold">{feature.title}</h3>
                          <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                        </motion.div>
                      ))}
                    </div>
                  </section>

                  {/* How it Works */}
                  <section className="bg-black text-white rounded-[3rem] p-12 md:p-20 space-y-16 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="max-w-2xl space-y-4 relative z-10">
                      <h3 className="text-4xl font-black tracking-tight">How It Works</h3>
                      <p className="text-gray-400 leading-relaxed">Our platform simplifies environmental data into three easy steps using state-of-the-art AI technology.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-12 relative z-10">
                      {[
                        { step: "01", title: "Data Input", desc: "Enter pollutant concentrations manually or search for a specific location to fetch real-time data." },
                        { step: "02", title: "AI Analysis", desc: "Gemini AI processes the parameters, calculating the AQI and predicting future trends." },
                        { step: "03", title: "Actionable Insights", desc: "Receive detailed health recommendations and visual dashboards for better decision making." },
                      ].map((item, i) => (
                        <div key={i} className="space-y-4">
                          <span className="text-5xl font-black text-emerald-500/20 block">{item.step}</span>
                          <h4 className="text-xl font-bold">{item.title}</h4>
                          <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Pollutants Section */}
                  <section className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <h3 className="text-4xl font-black tracking-tight">Pollutants We Track</h3>
                        <p className="text-gray-500 leading-relaxed">We monitor the five most critical pollutants that define air quality and impact human health globally.</p>
                      </div>
                      <div className="space-y-4">
                        {[
                          { name: "PM2.5 & PM10", icon: Cloud, desc: "Fine and coarse particles that can cause respiratory and cardiovascular issues." },
                          { name: "Nitrogen Dioxide (NO2)", icon: Droplets, desc: "A key indicator of traffic-related pollution and respiratory irritant." },
                          { name: "Carbon Monoxide (CO)", icon: Activity, desc: "A toxic gas primarily from incomplete combustion of fossil fuels." },
                          { name: "Sulfur Dioxide (SO2)", icon: BarChart3, desc: "Produced from industrial processes, contributing to acid rain and lung irritation." },
                        ].map((p, i) => (
                          <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-black/5 hover:bg-white hover:shadow-md transition-all">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                              <p.icon size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-sm">{p.name}</p>
                              <p className="text-[11px] text-gray-400">{p.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="relative">
                      <div className="aspect-square bg-emerald-50 rounded-[3rem] overflow-hidden flex items-center justify-center p-12">
                        <motion.div 
                          animate={{ 
                            y: [0, -20, 0],
                            rotate: [0, 5, 0]
                          }}
                          transition={{ 
                            duration: 6,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="w-full h-full bg-white rounded-[2rem] shadow-2xl border border-black/5 p-8 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between">
                            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                              <Wind size={24} />
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Status</p>
                              <p className="text-xs font-black text-emerald-500">Monitoring Active</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                              <motion.div 
                                animate={{ width: ["20%", "80%", "40%"] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="h-full bg-emerald-500"
                              />
                            </div>
                            <div className="h-2 w-2/3 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div 
                                animate={{ width: ["40%", "20%", "60%"] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="h-full bg-emerald-400"
                              />
                            </div>
                          </div>
                          <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                            <span className="text-2xl font-black tracking-tighter">AQI 42</span>
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded-full uppercase">Good</span>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}

              {activeTab === "about" && (
                <motion.div
                  key="about"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-5xl mx-auto space-y-16 pb-20"
                >
                  <section className="text-center space-y-6 max-w-3xl mx-auto">
                    <h2 className="text-5xl font-black tracking-tight text-[#1A1A1A]">Technical Architecture</h2>
                    <p className="text-lg text-gray-500 leading-relaxed">
                      EcoPredict AI is built on a high-performance stack designed for real-time environmental analysis and predictive modeling.
                    </p>
                  </section>

                  <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm space-y-6 hover:shadow-md transition-all">
                      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                        <Code size={28} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold">Frontend Stack</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          Built with **React 19** and **TypeScript** for type-safe, component-driven development. Styled using **Tailwind CSS** for a modern, responsive interface.
                        </p>
                      </div>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm space-y-6 hover:shadow-md transition-all">
                      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                        <Cpu size={28} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold">AI Engine</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          Powered by **Google Gemini 3.1 Pro**. We utilize advanced prompt engineering to simulate **Random Forest** and **Neural Network** regression models.
                        </p>
                      </div>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm space-y-6 hover:shadow-md transition-all">
                      <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500">
                        <BarChart3 size={28} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold">Data Viz</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          Interactive charting powered by **Recharts** and **Motion**. Real-time data streaming and SVG-based rendering for high-density metrics.
                        </p>
                      </div>
                    </div>
                  </div>

                  <section className="bg-black text-white rounded-[3rem] p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="relative z-10 space-y-12">
                      <div className="space-y-4">
                        <h3 className="text-3xl font-black">Predictive Algorithms</h3>
                        <p className="text-gray-400 max-w-2xl">
                          Our system doesn't just display data; it understands atmospheric patterns through multi-layered analysis.
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                          <div className="flex gap-6">
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                              <Terminal size={20} className="text-emerald-400" />
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-bold">Neural Pattern Matching</h4>
                              <p className="text-sm text-gray-400 leading-relaxed">
                                Gemini analyzes historical pollutant correlations to identify non-linear relationships between PM2.5, NO2, and SO2 levels.
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-6">
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                              <Layers size={20} className="text-blue-400" />
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-bold">Atmospheric Regression</h4>
                              <p className="text-sm text-gray-400 leading-relaxed">
                                We simulate a regression pipeline that calculates the weighted impact of each pollutant on the overall Air Quality Index.
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-8">
                          <div className="flex gap-6">
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                              <Settings size={20} className="text-purple-400" />
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-bold">Real-time Grounding</h4>
                              <p className="text-sm text-gray-400 leading-relaxed">
                                Using Google Search grounding, the model incorporates current local events (traffic, industrial activity) into its forecast.
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-6">
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                              <ShieldCheck size={20} className="text-orange-400" />
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-bold">Confidence Scoring</h4>
                              <p className="text-sm text-gray-400 leading-relaxed">
                                Every prediction is accompanied by a confidence interval calculated based on data density and model convergence.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <h3 className="text-2xl font-bold">Development Infrastructure</h3>
                      <div className="space-y-4">
                        {[
                          { name: "Vite 6.0", desc: "Next-generation frontend tooling for lightning-fast HMR and optimized builds." },
                          { name: "Lucide Icons", desc: "Crisp, consistent SVG icons for high-end visual communication." },
                          { name: "Motion/React", desc: "Physics-based animation engine for fluid UI transitions and layout changes." },
                        ].map((item) => (
                          <div key={item.name} className="p-6 bg-white rounded-3xl border border-black/5 flex items-center justify-between group hover:border-emerald-500/20 transition-all">
                            <div className="space-y-1">
                              <p className="font-bold text-sm">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.desc}</p>
                            </div>
                            <ArrowRight size={16} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-8">
                      <h3 className="text-2xl font-bold">API & Services</h3>
                      <div className="space-y-4">
                        {[
                          { name: "Google Generative AI SDK", desc: "Native integration with Gemini models for low-latency inference." },
                          { name: "Google Search Grounding", desc: "Live web data integration for context-aware environmental analysis." },
                          { name: "Express Backend", desc: "Node.js server handling API routing and secure environment management." },
                        ].map((item) => (
                          <div key={item.name} className="p-6 bg-white rounded-3xl border border-black/5 flex items-center justify-between group hover:border-blue-500/20 transition-all">
                            <div className="space-y-1">
                              <p className="font-bold text-sm">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.desc}</p>
                            </div>
                            <ArrowRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "prediction" && (
                <motion.div
                  key="prediction"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-2xl mx-auto space-y-8"
                >
                  <section className="text-center space-y-2">
                    <h2 className="text-4xl font-black tracking-tight">AQI Prediction</h2>
                    <p className="text-gray-500">Enter the pollutant concentrations to generate an AI assessment.</p>
                  </section>

                  <form onSubmit={handlePredict} className="space-y-6 bg-white p-10 rounded-[2.5rem] border border-black/5 shadow-xl">
                    <div className="grid md:grid-cols-2 gap-6">
                      {[
                        { id: "pm25", label: "PM2.5", unit: "µg/m³", icon: Cloud },
                        { id: "pm10", label: "PM10", unit: "µg/m³", icon: Cloud },
                        { id: "no2", label: "NO2", unit: "µg/m³", icon: Droplets },
                        { id: "co", label: "CO", unit: "mg/m³", icon: Activity },
                        { id: "so2", label: "SO2", unit: "µg/m³", icon: Activity },
                      ].map((field) => (
                        <div key={field.id} className="space-y-1.5">
                          <label htmlFor={field.id} className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                            <field.icon size={12} />
                            {field.label}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              id={field.id}
                              step="0.1"
                              value={inputs[field.id as keyof AQIInput] || ""}
                              onChange={(e) => handleInputChange(field.id, e.target.value)}
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                              required
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-300 uppercase">
                              {field.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      id="predict-submit-btn"
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-emerald-500/20"
                    >
                      {loading ? (
                        <RefreshCw className="animate-spin" size={20} />
                      ) : (
                        <>
                          Generate Prediction
                          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {activeTab === "visualization" && (
                <motion.div
                  key="visualization"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  {result ? (
                    <div className="space-y-8">
                      <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-black tracking-tight">Analysis Dashboard</h2>
                        <button 
                          onClick={() => setActiveTab("prediction")}
                          className="text-xs font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 flex items-center gap-2"
                        >
                          <RefreshCw size={14} />
                          New Prediction
                        </button>
                      </div>

                      <div className="grid lg:grid-cols-3 gap-8">
                        <div className={cn(
                          "lg:col-span-2 p-8 rounded-[2.5rem] border flex flex-col md:flex-row items-center gap-8 relative overflow-hidden",
                          getCategoryStyles(result.category).bg,
                          getCategoryStyles(result.category).border
                        )}>
                          <div className="absolute top-6 right-8 text-[10px] font-black uppercase tracking-[0.3em] text-black/20">
                            Present Status
                          </div>
                          <div className="relative">
                            <div className="w-48 h-48 rounded-full border-8 border-white flex flex-col items-center justify-center shadow-xl bg-white">
                              <span className="text-5xl font-black tracking-tighter">{result.aqi}</span>
                              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Current AQI</span>
                            </div>
                            <div className={cn(
                              "absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-lg",
                              getCategoryStyles(result.category).color.replace("text-", "bg-")
                            )}>
                              {result.category}
                            </div>
                          </div>

                          <div className="flex-1 space-y-4 text-center md:text-left">
                            <div className="space-y-1">
                              <h3 className={cn("text-2xl font-bold", getCategoryStyles(result.category).color)}>
                                Present Air Quality
                              </h3>
                              <p className="text-gray-600 leading-relaxed">
                                {result.recommendation}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                              {result.pollutants.slice(0, 3).map((p) => (
                                <div key={p.name} className="bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-gray-400">{p.name}</span>
                                  <span className="text-xs font-bold">{p.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white flex flex-col justify-between relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                          <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Next 24 Hours</span>
                              <div className="bg-white/20 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider">
                                AI Forecast
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black">{result.futurePrediction.aqi}</span>
                                <span className="text-xs font-bold opacity-60">AQI</span>
                              </div>
                              <p className="text-sm font-bold">{result.futurePrediction.category}</p>
                            </div>
                            <div className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              result.futurePrediction.trend === "Improving" ? "bg-emerald-400/30" :
                              result.futurePrediction.trend === "Worsening" ? "bg-red-400/30" : "bg-white/20"
                            )}>
                              {result.futurePrediction.trend === "Improving" && <TrendingDown size={12} />}
                              {result.futurePrediction.trend === "Worsening" && <TrendingUp size={12} />}
                              {result.futurePrediction.trend === "Stable" && <Minus size={12} />}
                              {result.futurePrediction.trend}
                            </div>
                          </div>
                          <button 
                            onClick={() => setActiveTab("forecast")}
                            className="mt-6 w-full py-3 bg-white text-emerald-600 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                          >
                            View Full Forecast
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                            <BarChart3 size={14} />
                            Pollutant Levels
                          </h4>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={result.pollutants}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#9CA3AF' }} />
                                <YAxis hide />
                                <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                  {result.pollutants.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                            <Activity size={14} />
                            Pollutant Distribution
                          </h4>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={result.pollutants}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {result.pollutants.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 600 }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                            <Activity size={14} />
                            Health Impact
                          </h4>
                          <div className="space-y-4 overflow-y-auto max-h-64 pr-2 custom-scrollbar">
                            {result.pollutants.map((p) => (
                              <div key={p.name} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                  <Info size={18} />
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold">{p.name}</span>
                                    <span className="text-[10px] text-gray-400">{p.value} units</span>
                                  </div>
                                  <p className="text-[11px] text-gray-500 leading-tight">{p.impact}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Yearly Trend Graph */}
                      <div className="bg-white p-10 rounded-[3rem] border border-black/5 shadow-sm space-y-8">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h4 className="text-lg font-bold flex items-center gap-2">
                              <TrendingUp size={20} className="text-emerald-500" />
                              Yearly Pollution Trend
                            </h4>
                            <p className="text-xs text-gray-400">Historical and projected monthly average AQI over the year</p>
                          </div>
                        </div>
                        <div className="h-80 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={result.yearlyTrend} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                              <XAxis 
                                dataKey="month" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 600, fill: '#9ca3af' }}
                                dy={10}
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 600, fill: '#9ca3af' }}
                                dx={-10}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  borderRadius: '16px', 
                                  border: 'none', 
                                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}
                              />
                              <Legend 
                                verticalAlign="top" 
                                align="right" 
                                iconType="circle" 
                                wrapperStyle={{ fontSize: '10px', fontWeight: 600, paddingBottom: '20px' }} 
                              />
                              <Line 
                                name="Monthly Avg AQI"
                                type="monotone" 
                                dataKey="aqi" 
                                stroke="#3b82f6" 
                                strokeWidth={4}
                                dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 8, strokeWidth: 0 }}
                                animationDuration={2500}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 justify-center pt-8">
                      <button 
                        onClick={handleCropPredict}
                        disabled={cropLoading}
                        className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-emerald-600 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/30"
                      >
                        {cropLoading ? <RefreshCw size={18} className="animate-spin" /> : <Droplets size={18} />}
                        Predict Suitable Crops
                      </button>
                      <button 
                        onClick={() => setActiveTab("forecast")}
                        className="bg-white border border-black/5 px-8 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all"
                      >
                        View Forecast
                      </button>
                    </div>
                  ) : (
                    <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center space-y-6 bg-white rounded-[3rem] border border-dashed border-gray-200">
                      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                        <BarChart3 size={48} />
                      </div>
                      <div className="space-y-2 max-w-xs">
                        <h3 className="text-xl font-bold">No Data Visualized</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          Please complete a prediction or search for a location to see the visual analysis here.
                        </p>
                        <button 
                          onClick={() => setActiveTab("prediction")}
                          className="text-emerald-500 font-bold text-sm pt-4 hover:underline"
                        >
                          Go to Prediction
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
              {activeTab === "forecast" && (
                <motion.div
                  key="forecast"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-12"
                >
                  <div className="text-center space-y-4 max-w-2xl mx-auto">
                    <h2 className="text-4xl font-black tracking-tight text-[#1A1A1A]">AI Future Forecast</h2>
                    <p className="text-gray-500">Advanced predictive modeling for the next 24 hours based on real-time atmospheric data.</p>
                  </div>

                  {result ? (
                    <div className="max-w-4xl mx-auto space-y-8">
                      <div className="bg-emerald-600 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-emerald-500/20">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                          <div className="space-y-8">
                            <div className="space-y-2">
                              <span className="text-xs font-black uppercase tracking-[0.3em] opacity-60">Projected AQI</span>
                              <div className="flex items-baseline gap-4">
                                <h3 className="text-8xl font-black tracking-tighter">{result.futurePrediction.aqi}</h3>
                                <div className={cn(
                                  "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest",
                                  result.futurePrediction.trend === "Improving" ? "bg-emerald-400/30" : "bg-red-400/30"
                                )}>
                                  {result.futurePrediction.trend}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                  <Activity size={24} />
                                </div>
                                <div>
                                  <p className="text-lg font-bold">{result.futurePrediction.category}</p>
                                  <p className="text-xs opacity-60 uppercase tracking-wider font-bold">Expected Category</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                  <RefreshCw size={24} />
                                </div>
                                <div>
                                  <p className="text-lg font-bold">24 Hours</p>
                                  <p className="text-xs opacity-60 uppercase tracking-wider font-bold">Forecast Window</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white/10 backdrop-blur-md rounded-[2rem] p-8 border border-white/10 space-y-6">
                            <h4 className="text-sm font-bold uppercase tracking-widest opacity-80">AI Reasoning</h4>
                            <p className="text-lg leading-relaxed italic">
                              "{result.futurePrediction.reason}"
                            </p>
                            <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Confidence Level</span>
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: "94%" }}
                                    transition={{ duration: 1.5, delay: 0.5 }}
                                    className="h-full bg-white"
                                  />
                                </div>
                                <span className="text-xs font-black">94%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-10 rounded-[3rem] border border-black/5 shadow-sm space-y-8">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h4 className="text-lg font-bold">Hourly AQI Trend</h4>
                            <p className="text-xs text-gray-400">Projected air quality fluctuations over the next 24 hours</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-emerald-500" />
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Projected AQI</span>
                            </div>
                          </div>
                        </div>
                        <div className="h-80 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={result.futurePrediction.hourlyForecast}>
                              <defs>
                                <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                              <XAxis 
                                dataKey="time" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fill: '#9ca3af' }}
                                dy={10}
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fill: '#9ca3af' }}
                                dx={-10}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  borderRadius: '16px', 
                                  border: 'none', 
                                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="aqi" 
                                stroke="#10b981" 
                                strokeWidth={4}
                                fillOpacity={1} 
                                fill="url(#colorAqi)" 
                                animationDuration={2000}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="space-y-8 bg-gray-50/50 p-12 rounded-[3rem] border border-black/5">
                        <div className="text-center space-y-2">
                          <h4 className="text-sm font-black uppercase tracking-[0.3em] text-gray-400">AI Decision Flow Chart</h4>
                          <p className="text-xs text-gray-500">The logical path from raw data to predictive intelligence</p>
                        </div>
                        
                        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-0">
                          <div className="flex flex-col items-center gap-4 group">
                            <div className="w-20 h-20 rounded-[2rem] bg-white border border-black/5 shadow-sm flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-all duration-500">
                              <Database size={28} />
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-black uppercase tracking-wider">Input Layer</p>
                              <p className="text-[9px] text-gray-400 max-w-[80px]">Real-time Pollutant Metrics</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-center h-12 md:h-auto md:w-24">
                            <ArrowRight className="text-gray-200 rotate-90 md:rotate-0" size={20} />
                          </div>
                          
                          <div className="flex flex-col items-center gap-4 group">
                            <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 group-hover:rotate-12 transition-all duration-500">
                              <Cpu size={36} />
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-black uppercase tracking-wider">Processing</p>
                              <p className="text-[9px] text-gray-400 max-w-[100px]">Neural Pattern Matching</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-center h-12 md:h-auto md:w-24">
                            <ArrowRight className="text-gray-200 rotate-90 md:rotate-0" size={20} />
                          </div>

                          <div className="flex flex-col items-center gap-4 group">
                            <div className="w-20 h-20 rounded-[2rem] bg-white border border-black/5 shadow-sm flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-all duration-500">
                              <Zap size={28} />
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-black uppercase tracking-wider">Output Layer</p>
                              <p className="text-[9px] text-gray-400 max-w-[80px]">24h Predictive Forecast</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trend Direction</p>
                          <div className="flex items-center gap-2">
                            {result.futurePrediction.trend === "Improving" ? (
                              <TrendingDown className="text-emerald-500" size={20} />
                            ) : (
                              <TrendingUp className="text-red-500" size={20} />
                            )}
                            <span className="font-bold">{result.futurePrediction.trend}</span>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Primary Driver</p>
                          <p className="font-bold">Atmospheric Flow</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data Source</p>
                          <p className="font-bold">Gemini 3.1 Pro</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-md mx-auto bg-gray-50 rounded-[2.5rem] p-12 text-center space-y-6 border border-dashed border-gray-200">
                      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm text-gray-300">
                        <RefreshCw size={40} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold">No Forecast Data</h3>
                        <p className="text-sm text-gray-500">Run a prediction or search for a location to see the AI future forecast.</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab("prediction")}
                        className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all"
                      >
                        Start Prediction
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "crops" && (
                <motion.div
                  key="crops"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8 pb-12"
                >
                  {cropResult ? (
                    <div className="space-y-8">
                      <div className="text-center space-y-4 max-w-3xl mx-auto">
                        <h2 className="text-4xl font-black tracking-tight">Agricultural Predictions</h2>
                        <p className="text-gray-500">Based on current air quality conditions, here's which crops can thrive in your area.</p>
                      </div>

                      {/* Productivity Level */}
                      <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 p-8 rounded-[2.5rem] border border-emerald-500/20 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Productivity Status</p>
                            <h3 className="text-2xl font-black">{cropResult.productivityLevel}</h3>
                          </div>
                          <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center text-2xl",
                            cropResult.productivityLevel === "High" ? "bg-emerald-500/20 text-emerald-600" :
                            cropResult.productivityLevel === "Moderate" ? "bg-yellow-500/20 text-yellow-600" :
                            "bg-red-500/20 text-red-600"
                          )}>
                            {cropResult.productivityLevel === "High" ? "✓" : cropResult.productivityLevel === "Moderate" ? "◐" : "✗"}
                          </div>
                        </div>
                      </div>

                      {/* Best Crops */}
                      <div className="space-y-4">
                        <h3 className="text-2xl font-black">Best Crops For Your Area</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                          {cropResult.bestCrops.map((crop, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="bg-white p-6 rounded-2xl border-2 border-emerald-500 shadow-lg hover:shadow-xl transition-all flex items-center justify-between"
                            >
                              <span className="text-xl font-bold">{crop}</span>
                              <CheckCircle2 className="text-emerald-500" size={24} />
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* All Crops */}
                      <div className="space-y-4">
                        <h3 className="text-2xl font-black">Crop Viability Analysis</h3>
                        <div className="grid gap-3">
                          {cropResult.viableCrops.map((crop, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className={cn(
                                "p-4 rounded-2xl border transition-all",
                                crop.suitable 
                                  ? "bg-emerald-50 border-emerald-200 hover:shadow-md" 
                                  : "bg-gray-50 border-gray-200 opacity-60"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="font-bold text-lg">{crop.crop}</span>
                                    <div className="flex-1 max-w-xs">
                                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <motion.div 
                                          initial={{ width: 0 }}
                                          animate={{ width: `${crop.suitabilityScore}%` }}
                                          transition={{ duration: 1, ease: "easeOut" }}
                                          className={cn(
                                            "h-full",
                                            crop.suitable ? "bg-emerald-500" : "bg-gray-400"
                                          )}
                                        />
                                      </div>
                                    </div>
                                    <span className="text-sm font-bold text-gray-600 w-12 text-right">{crop.suitabilityScore}%</span>
                                  </div>
                                  <p className="text-xs text-gray-600">{crop.reason}</p>
                                </div>
                                <div className="ml-4">
                                  {crop.suitable ? (
                                    <CheckCircle2 className="text-emerald-500" size={20} />
                                  ) : (
                                    <AlertTriangle className="text-gray-400" size={20} />
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200 space-y-3">
                          <div className="flex items-center gap-2">
                            <Info className="text-blue-600" size={20} />
                            <h4 className="font-bold text-lg">Farming Recommendations</h4>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{cropResult.agriculturalRecommendation}</p>
                        </div>

                        <div className="bg-purple-50 p-6 rounded-2xl border border-purple-200 space-y-3">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="text-purple-600" size={20} />
                            <h4 className="font-bold text-lg">Seasonal Advice</h4>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{cropResult.seasonalAdvice}</p>
                        </div>
                      </div>

                      {/* Risk Factors */}
                      {cropResult.riskFactors.length > 0 && (
                        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200 space-y-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="text-orange-600" size={20} />
                            <h4 className="font-bold text-lg">Risk Factors</h4>
                          </div>
                          <ul className="space-y-2">
                            {cropResult.riskFactors.map((risk, i) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-orange-600 mt-1">•</span>
                                <span>{risk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-4 justify-center pt-8">
                        <button 
                          onClick={() => setActiveTab("visualization")}
                          className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-600 transition-all flex items-center gap-2"
                        >
                          <ArrowRight size={18} />
                          Back to AQI Data
                        </button>
                        <button 
                          onClick={() => setActiveTab("prediction")}
                          className="bg-white border border-black/5 px-8 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all"
                        >
                          New Prediction
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-md mx-auto bg-gray-50 rounded-[2.5rem] p-12 text-center space-y-6 border border-dashed border-gray-200">
                      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm text-gray-300">
                        <Droplets size={40} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold">No Crop Data Yet</h3>
                        <p className="text-sm text-gray-500">First, run an air quality prediction to get crop viability recommendations.</p>
                      </div>
                      {result ? (
                        <button 
                          onClick={handleCropPredict}
                          disabled={cropLoading}
                          className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mx-auto"
                        >
                          {cropLoading ? <RefreshCw size={16} className="animate-spin" /> : "Predict Crops"}
                        </button>
                      ) : (
                        <button 
                          onClick={() => setActiveTab("prediction")}
                          className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all"
                        >
                          Start Prediction
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Footer */}
          <footer className="border-t border-black/5 bg-white py-12 mt-12">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center text-white">
                    <Wind size={14} />
                  </div>
                  <span className="font-bold">EcoPredict AI</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Advanced environmental monitoring and prediction platform powered by artificial intelligence.
                </p>
              </div>
              <div>
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Platform</h5>
                <ul className="text-xs space-y-2 text-gray-500">
                  <li><button onClick={() => setActiveTab("prediction")} className="hover:text-black">Predictions</button></li>
                  <li><button onClick={() => setActiveTab("visualization")} className="hover:text-black">Visualization</button></li>
                  <li><a href="#" className="hover:text-black">API Documentation</a></li>
                </ul>
              </div>
              <div>
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Resources</h5>
                <ul className="text-xs space-y-2 text-gray-500">
                  <li><a href="#" className="hover:text-black">Health Guide</a></li>
                  <li><a href="#" className="hover:text-black">Pollution Data</a></li>
                  <li><a href="#" className="hover:text-black">Research Papers</a></li>
                </ul>
              </div>
              <div>
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Support</h5>
                <ul className="text-xs space-y-2 text-gray-500">
                  <li><a href="#" className="hover:text-black">Contact Us</a></li>
                  <li><a href="#" className="hover:text-black">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-black">Terms of Service</a></li>
                </ul>
              </div>
            </div>
            <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t border-black/5 flex justify-between items-center">
              <p className="text-[10px] text-gray-400">© 2026 EcoPredict AI. All rights reserved.</p>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-emerald-50 hover:text-emerald-500 transition-all cursor-pointer">
                  <Activity size={14} />
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-emerald-50 hover:text-emerald-500 transition-all cursor-pointer">
                  <BarChart3 size={14} />
                </div>
              </div>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
