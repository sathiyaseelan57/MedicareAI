import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  Calendar,
  Pill,
  FileText,
  Activity,
  ArrowLeft,
  Sparkles,
  Clock,
  CheckCircle2,
  Heart,
  Thermometer,
  Scale,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertCircle,
  BrainCircuit,
  RefreshCw,
} from "lucide-react";
import api from "../api/axios";

const PatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // Initial Load: Basic Details, Adherence, Appointments
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/ai/patient-details/${id}`);
        setData(res.data);
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetails();
  }, [id]);

  // Dedicated AI Fetch: Triggered on Button Click
  const generateAiSummary = async () => {
    setAiLoading(true);
    try {
      const res = await api.get(`/ai/patient-details/ai-summary/${id}`);
      setAiSummary(res.data.aiSummary);
    } catch (err) {
      console.error("AI Error:", err);
      setAiSummary("Unable to generate analysis at this time.");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-base-300">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-infinity loading-lg text-primary"></span>
          <p className="text-xs font-black uppercase tracking-widest opacity-40">
            Syncing Clinical Records...
          </p>
        </div>
      </div>
    );

  if (!data)
    return (
      <div className="p-20 text-center font-black">
        PATIENT RECORD NOT FOUND
      </div>
    );

  const { basicDetails, appointments, prescriptions, adherenceRate } = data;

  return (
    <div className="min-h-screen bg-base-200/50 pb-12 transition-all">
      <style>{`
        .ai-scrollbar::-webkit-scrollbar { width: 4px; }
        .ai-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
        .ai-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.4); border-radius: 10px; }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }
        .animate-pulse-slow { animation: pulse-slow 3s infinite; }
      `}</style>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* TOP NAVIGATION */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost gap-2 rounded-2xl hover:bg-base-300 px-6"
          >
            <ArrowLeft size={20} /> <span className="font-bold">Back</span>
          </button>
          <div className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">
            MRN:{" "}
            {basicDetails.medicalRecordNumber ||
              basicDetails._id?.slice(-8).toUpperCase()}
          </div>
        </div>

        {/* HERO SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Patient Profile Card */}
          <div className="bg-base-100 rounded-[2.5rem] p-8 border border-base-300 shadow-xl flex flex-col items-center text-center h-fit">
            <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white text-4xl font-black mb-4 shadow-lg shadow-indigo-200">
              {basicDetails.name?.charAt(0)}
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              {basicDetails.name}
            </h1>
            <p className="opacity-40 text-xs font-bold uppercase tracking-widest mt-1">
              {basicDetails.email}
            </p>

            <div className="grid grid-cols-2 gap-3 mt-8 w-full">
              <InfoTile label="Age" value={`${basicDetails.age} Yrs`} />
              <InfoTile label="Blood Group" value={basicDetails.bloodGroup} />
              <InfoTile label="Gender" value={basicDetails.gender} />
              <InfoTile label="Weight" value={`${basicDetails.weightKg} kg`} />
            </div>
          </div>

          {/* AI SUMMARY CARD - MANUAL TRIGGER */}
          <div className="lg:col-span-2 relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl border border-white/5 min-h-[400px] flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col h-full flex-grow">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                    <BrainCircuit
                      size={20}
                      className={`text-indigo-400 ${
                        aiLoading ? "animate-spin" : ""
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      Clinical AI Engine
                    </h3>
                    <p className="text-[9px] font-bold text-indigo-400/60 uppercase tracking-tighter">
                      Llama 3.3 Medical Assistant
                    </p>
                  </div>
                </div>
                {aiSummary && !aiLoading && (
                  <button
                    onClick={generateAiSummary}
                    className="btn btn-ghost btn-xs text-indigo-400 hover:bg-white/5 gap-2 font-black"
                  >
                    <RefreshCw size={12} /> REGENERATE
                  </button>
                )}
              </div>

              {/* Main Content Area */}
              <div className="flex-grow flex flex-col items-center justify-center ai-scrollbar overflow-y-auto pr-4 mb-6 max-h-[220px]">
                {aiLoading ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <span className="loading loading-bars loading-lg text-indigo-500"></span>
                    <div className="text-center">
                      <p className="text-indigo-400 font-black text-xs uppercase tracking-widest">
                        AI is thinking...
                      </p>
                      <p className="text-slate-500 text-[10px] mt-1 italic">
                        Analyzing adherence and clinical history
                      </p>
                    </div>
                  </div>
                ) : aiSummary ? (
                  <p className="text-xl md:text-2xl leading-relaxed font-medium text-slate-200 italic w-full">
                    "{aiSummary}"
                  </p>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                      <Sparkles size={24} className="text-indigo-400/40" />
                    </div>
                    <div className="max-w-xs">
                      <p className="text-slate-400 text-sm font-medium">
                        Ready to analyze patient progress.
                      </p>
                      <button
                        onClick={generateAiSummary}
                        className="btn btn-primary btn-sm mt-4 rounded-xl font-black gap-2"
                      >
                        Generate Briefing
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Metrics Bar */}
              <div className="mt-auto flex gap-8 border-t border-white/5 pt-6">
                <div className="flex items-center gap-4">
                  <div
                    className="radial-progress text-indigo-500 text-[10px] font-black"
                    style={{
                      "--value": adherenceRate,
                      "--size": "3.5rem",
                      "--thickness": "4px",
                    }}
                    role="progressbar"
                  >
                    {adherenceRate}%
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white">
                      {adherenceRate}%
                    </div>
                    <div className="text-[10px] uppercase font-bold text-slate-500">
                      Compliance
                    </div>
                  </div>
                </div>
                <div className="w-px h-10 bg-white/10 self-center"></div>
                <div>
                  <div className="text-2xl font-black text-white">
                    {appointments?.length || 0}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">
                    Encounters
                  </div>
                </div>
              </div>
            </div>
            <Activity className="absolute -right-10 -bottom-10 w-64 h-64 opacity-[0.03] pointer-events-none" />
          </div>
        </div>

        {/* MAIN GRID: CLINICAL DATA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: TIMELINE */}
          <div className="lg:col-span-7 space-y-8">
            <section className="space-y-4">
              <h3 className="text-xl font-black flex items-center gap-3 px-2 text-slate-700">
                <Clock className="text-primary" /> Encounter History
              </h3>
              <div className="space-y-6">
                {appointments.map((app) => (
                  <div
                    key={app._id}
                    className="bg-base-100 rounded-[2rem] border border-base-300 shadow-sm"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">
                            {new Date(app.appointmentDate).toLocaleDateString(
                              "en-US",
                              { month: "long", day: "numeric", year: "numeric" }
                            )}
                          </p>
                          <h4 className="text-xl font-black text-primary mt-1">
                            {app.reason}
                          </h4>
                        </div>
                        <div className="badge badge-success text-white font-bold px-4 py-3 rounded-xl">
                          {app.status}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <VitalStat
                          icon={<Thermometer size={14} />}
                          label="Temp"
                          value={`${app.vitalsAtVisit?.temp}°F`}
                        />
                        <VitalStat
                          icon={<Heart size={14} />}
                          label="BP"
                          value={app.vitalsAtVisit?.bp}
                        />
                        <VitalStat
                          icon={<Activity size={14} />}
                          label="Pulse"
                          value={app.vitalsAtVisit?.pulse}
                        />
                        <VitalStat
                          icon={<Scale size={14} />}
                          label="Weight"
                          value={`${app.vitalsAtVisit?.weightKg}kg`}
                        />
                      </div>
                      <div className="mt-6 p-5 bg-base-200/50 rounded-2xl border border-base-200">
                        <p className="text-sm italic">
                          "{app.notes || "No notes provided."}"
                        </p>
                        {app.diagnosis && (
                          <p className="mt-3 text-sm font-black text-indigo-600 uppercase tracking-tighter">
                            Diagnosis: {app.diagnosis}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR: PRESCRIPTIONS */}
          <aside className="lg:col-span-5 space-y-6">
            <h3 className="text-xl font-black flex items-center gap-3 px-2 text-slate-700">
              <Pill className="text-secondary" /> Medical Regimen
            </h3>
            <div className="space-y-4">
              {prescriptions.active.map((p) => (
                <PrescriptionCard key={p._id} p={p} isActive={true} />
              ))}
              {prescriptions.active.length === 0 && (
                <div className="p-10 bg-base-100 rounded-3xl border border-dashed border-base-300 text-center opacity-40">
                  No active medications
                </div>
              )}
            </div>

            {prescriptions.history?.length > 0 && (
              <div className="pt-4">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="btn btn-block btn-ghost bg-base-100 rounded-2xl border-base-300 normal-case font-black text-xs gap-2"
                >
                  {showHistory ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                  {showHistory
                    ? "Collapse Old Records"
                    : `View Medication History (${prescriptions.history.length})`}
                </button>
                {showHistory && (
                  <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {prescriptions.history.map((p) => (
                      <PrescriptionCard key={p._id} p={p} isActive={false} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

const InfoTile = ({ label, value }) => (
  <div className="bg-base-200/50 p-3 rounded-2xl border border-base-300/50">
    <div className="text-[9px] uppercase font-black opacity-40 tracking-widest mb-1">
      {label}
    </div>
    <div className="text-sm font-black text-indigo-700">{value || "N/A"}</div>
  </div>
);

const VitalStat = ({ icon, label, value }) => (
  <div className="bg-base-100 p-3 rounded-2xl border border-base-200 flex flex-col items-center">
    <div className="text-primary mb-1">{icon}</div>
    <span className="text-[8px] font-black opacity-40 uppercase">{label}</span>
    <span className="text-xs font-black">{value || "--"}</span>
  </div>
);

const PrescriptionCard = ({ p, isActive }) => (
  <div
    className={`bg-base-100 p-6 rounded-[2.5rem] border-2 transition-all shadow-sm ${
      isActive ? "border-secondary/30" : "border-base-300 opacity-60"
    }`}
  >
    <div className="flex justify-between items-center mb-4">
      <div className="flex flex-col">
        <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">
          Issued: {new Date(p.startDate || p.createdAt).toLocaleDateString()}
        </span>
      </div>
      {isActive && <CheckCircle2 className="text-emerald-500" size={18} />}
    </div>
    <div className="space-y-4">
      {p.medicines?.map((med, idx) => (
        <div
          key={idx}
          className={`pl-4 border-l-4 ${
            isActive ? "border-secondary" : "border-base-300"
          }`}
        >
          <div className="flex justify-between items-start">
            <p className="font-black text-sm">{med.name}</p>
            <span className="text-[9px] font-black bg-base-200 px-2 py-0.5 rounded-md uppercase">
              {med.durationDays}D
            </span>
          </div>
          <p className="text-[10px] font-bold opacity-60 uppercase mt-1">
            {med.dosage} • {med.timing?.join(" & ")}
          </p>
        </div>
      ))}
    </div>
  </div>
);

export default PatientDetails;
