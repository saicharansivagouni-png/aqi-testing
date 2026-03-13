import React, { useState, ChangeEvent, FormEvent } from "react";
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
  X
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from "recharts";
import { predictAQI, searchAQIByLocation, type AQIInput, type AQIResult } from "./services/gemini";
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
  const [loading, setLoading] = useState<boolean>(false);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [result, setResult] = useState<AQIResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputs, setInputs] = useState<AQIInput>({
    pm25: 12,
    pm10: 20,
    no2: 15,
    co: 0.5,
    so2: 5
  });

  const handlePredict = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const prediction = await predictAQI(inputs);
      setResult(prediction);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    setError(null);
    try {
      const prediction = await searchAQIByLocation(searchQuery);
      setResult(prediction);
      // Update inputs based on search result if available
      if (prediction.pollutants) {
        const newInputs = { ...inputs };
        prediction.pollutants.forEach(p => {
          // Normalize names like "PM 2.5", "PM2.5", "pm25" to match AQIInput keys
          const key = p.name.toLowerCase().replace(/[^a-z0-9]/g, "") as keyof AQIInput;
          if (key in newInputs) {
            newInputs[key] = p.value;
          }
        });
        setInputs(newInputs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleInputChange = (id: string, value: string) => {
    const numValue = value === "" ? 0 : parseFloat(value);
    setInputs((prev: AQIInput) => ({ ...prev, [id]: numValue }));
  };

  const getCategoryStyles = (category: string) => {
    return AQI_CATEGORIES[category as keyof typeof AQI_CATEGORIES] || AQI_CATEGORIES["Moderate"];
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
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
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
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
            <a href="#" className="text-emerald-600">Dashboard</a>
            <a href="#" className="hover:text-black transition-colors">Monitoring</a>
            <a href="#" className="hover:text-black transition-colors">Insights</a>
            <a href="#" className="hover:text-black transition-colors">About</a>
          </nav>
          <button className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-all">
            Connect Station
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-12">
          {/* Left Column: Input Form */}
          <div className="lg:col-span-4 space-y-8">
            <section>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Environmental Parameters</h2>
              <p className="text-gray-500 text-sm">Enter the current pollution levels to predict the Air Quality Index using our AI model.</p>
            </section>

            <form onSubmit={handlePredict} className="space-y-6 bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
              <div className="space-y-4">
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
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(field.id, e.target.value)}
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
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <RefreshCw className="animate-spin" size={20} />
                ) : (
                  <>
                    Predict AQI
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Results & Dashboard */}
          <div className="lg:col-span-8 space-y-8">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm"
                >
                  <AlertTriangle size={18} />
                  {error}
                </motion.div>
              )}
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-8"
                >
                  {/* Summary Card */}
                  <div className={cn(
                    "p-8 rounded-[2.5rem] border flex flex-col md:flex-row items-center gap-8",
                    getCategoryStyles(result.category).bg,
                    getCategoryStyles(result.category).border
                  )}>
                    <div className="relative">
                      <div className="w-48 h-48 rounded-full border-8 border-white flex flex-col items-center justify-center shadow-xl bg-white">
                        <span className="text-5xl font-black tracking-tighter">{result.aqi}</span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">AQI Score</span>
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
                          {result.category} Air Quality
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

                  {/* Charts Grid */}
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Pollutant Distribution */}
                    <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                          <BarChart3 size={14} />
                          Pollutant Levels
                        </h4>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={result.pollutants}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 10, fontWeight: 600, fill: '#9CA3AF' }} 
                            />
                            <YAxis hide />
                            <Tooltip 
                              cursor={{ fill: '#F9FAFB' }}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {result.pollutants.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#E5E7EB'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Impact Analysis */}
                    <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                        <Activity size={14} />
                        Health Impact
                      </h4>
                      <div className="space-y-4">
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
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[500px] flex flex-col items-center justify-center text-center space-y-6 bg-white rounded-[3rem] border border-dashed border-gray-200"
                >
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                    <Wind size={48} />
                  </div>
                  <div className="space-y-2 max-w-xs">
                    <h3 className="text-xl font-bold">Waiting for Data</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Enter the pollution parameters on the left and click predict to see the AI analysis.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
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
              <li><a href="#" className="hover:text-black">Predictions</a></li>
              <li><a href="#" className="hover:text-black">Global Map</a></li>
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
    </div>
  );
}
