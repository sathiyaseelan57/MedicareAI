import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  User, Calendar, Pill, FileText, Activity, 
  ArrowLeft, Sparkles, Clock, CheckCircle2, 
  Heart, Thermometer, Scale, ChevronDown, 
  ChevronUp, ExternalLink, AlertCircle
} from "lucide-react";
import api from "../api/axios";

const PatientDetails = () => {
  // Matches <Route path="/patient-details/:id" />
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

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

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-base-300">
      <div className="flex flex-col items-center gap-4">
        <span className="loading loading-infinity loading-lg text-primary"></span>
        <p className="text-xs font-black uppercase tracking-widest opacity-40">Syncing Clinical Records...</p>
      </div>
    </div>
  );

  if (!data) return <div className="p-20 text-center">Patient Data Not Found</div>;

  const { basicDetails, aiSummary, appointments, prescriptions, adherenceRate } = data;

  return (
    <div className="min-h-screen bg-base-200/50 pb-12 transition-all">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* TOP NAVIGATION */}
        <div className="flex justify-between items-center">
          <button onClick={() => navigate(-1)} className="btn btn-ghost gap-2 rounded-2xl hover:bg-base-300 px-6">
            <ArrowLeft size={20} /> <span className="font-bold">Back</span>
          </button>
          <div className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">
            Medical Record: {basicDetails.medicalRecordNumber || "N/A"}
          </div>
        </div>

        {/* HERO SECTION: IDENTITY & AI INSIGHTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Patient Profile Card */}
          <div className="bg-base-100 rounded-[2.5rem] p-8 border border-base-300 shadow-xl flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white text-4xl font-black mb-4 shadow-lg shadow-indigo-200">
              {basicDetails.name?.charAt(0)}
            </div>
            <h1 className="text-2xl font-black tracking-tight">{basicDetails.name}</h1>
            <p className="opacity-40 text-xs font-bold uppercase tracking-widest mt-1">{basicDetails.email}</p>
            
            <div className="grid grid-cols-2 gap-3 mt-8 w-full">
              <InfoTile label="Age" value={`${basicDetails.age} Yrs`} />
              <InfoTile label="Blood Group" value={basicDetails.bloodGroup} />
              <InfoTile label="Gender" value={basicDetails.gender} />
              <InfoTile label="Weight" value={`${basicDetails.weightKg} kg`} />
            </div>
          </div>

          {/* AI Clinical Summary Card */}
          <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-700 to-blue-800 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-500/20">
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                    <Sparkles size={20} className="text-yellow-300" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-wider">AI Clinical Insight</h3>
                </div>
                
                {/* Handling potential AI Error from Backend */}
                <p className="text-xl leading-relaxed font-medium opacity-90 italic">
                  {aiSummary.includes("unavailable") ? (
                    <span className="flex items-center gap-2 opacity-50"><AlertCircle size={18}/> Gemini API Key Invalid or Quota Exceeded.</span>
                  ) : `"${aiSummary}"`}
                </p>
              </div>

              <div className="mt-8 flex gap-8 border-t border-white/10 pt-6">
                <div>
                  <div className="text-3xl font-black">{adherenceRate}%</div>
                  <div className="text-[10px] uppercase font-bold opacity-60">Medication Compliance</div>
                </div>
                <div className="divider divider-horizontal before:bg-white/10 after:bg-white/10"></div>
                <div>
                  <div className="text-3xl font-black">{appointments?.length || 0}</div>
                  <div className="text-[10px] uppercase font-bold opacity-60">Total Sessions</div>
                </div>
              </div>
            </div>
            <Activity className="absolute -right-10 -bottom-10 w-64 h-64 opacity-10" />
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: TIMELINE & REPORTS */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* 1. Reports Section */}
            <section className="space-y-4">
              <h3 className="text-xl font-black flex items-center gap-3 px-2">
                <FileText className="text-accent" /> Clinical Reports
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {basicDetails.medicalHistory && basicDetails.medicalHistory.length > 0 ? (
                  basicDetails.medicalHistory.map((report, i) => (
                    <div key={i} className="bg-base-100 p-5 rounded-2xl border border-base-300 flex items-center justify-between group hover:border-primary transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-base-200 rounded-xl text-accent group-hover:bg-accent/10 transition-colors">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{report.condition || "Diagnostic Report"}</p>
                          <p className="text-[10px] opacity-40 font-black uppercase">Ref: {new Date().toLocaleDateString()}</p>
                        </div>
                      </div>
                      <ExternalLink size={16} className="opacity-20 group-hover:opacity-100" />
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 p-10 bg-base-100 rounded-[2rem] border border-dashed border-base-300 text-center opacity-40">
                    <p className="italic text-sm">No digital reports found for this record.</p>
                  </div>
                )}
              </div>
            </section>

            {/* 2. Encounter Timeline */}
            <section className="space-y-4">
              <h3 className="text-xl font-black flex items-center gap-3 px-2">
                <Clock className="text-primary" /> Encounter History
              </h3>
              <div className="space-y-6">
                {appointments.map((app) => (
                  <div key={app._id} className="bg-base-100 rounded-[2rem] border border-base-300 overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">
                            {new Date(app.appointmentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                          <h4 className="text-xl font-black text-primary mt-1">{app.reason}</h4>
                        </div>
                        <div className="badge badge-success text-white font-bold px-4 py-3 rounded-xl">{app.status}</div>
                      </div>

                      {/* Vitals Grid */}
                      <div className="grid grid-cols-4 gap-3">
                        <VitalStat icon={<Thermometer size={14}/>} label="Temp" value={`${app.vitalsAtVisit?.temp}°F`} />
                        <VitalStat icon={<Heart size={14}/>} label="BP" value={app.vitalsAtVisit?.bp} />
                        <VitalStat icon={<Activity size={14}/>} label="Pulse" value={app.vitalsAtVisit?.pulse} />
                        <VitalStat icon={<Scale size={14}/>} label="Weight" value={`${app.vitalsAtVisit?.weightKg}kg`} />
                      </div>

                      <div className="mt-6 p-5 bg-base-200/50 rounded-2xl border border-base-200">
                        <p className="text-[10px] font-black opacity-30 uppercase mb-2">Clinical Notes & Diagnosis</p>
                        <p className="text-sm leading-relaxed italic">"{app.notes || "No notes provided for this session."}"</p>
                        {app.diagnosis && <p className="mt-3 text-sm font-black text-indigo-600">Diagnosis: {app.diagnosis}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR: PRESCRIPTIONS */}
          <aside className="lg:col-span-5 space-y-6">
            <h3 className="text-xl font-black flex items-center gap-3 px-2">
              <Pill className="text-secondary" /> Prescriptions
            </h3>

            {/* Active List */}
            <div className="space-y-4">
              {prescriptions.active.length > 0 ? prescriptions.active.map(p => (
                <PrescriptionCard key={p._id} p={p} isActive={true} />
              )) : (
                <div className="p-6 bg-base-100 rounded-3xl border border-base-300 text-center italic opacity-40">No active medications</div>
              )}
            </div>

            {/* History Toggle */}
            {prescriptions.history && prescriptions.history.length > 0 && (
              <div className="pt-4">
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className="btn btn-block btn-ghost bg-base-100 rounded-2xl border-base-300 normal-case font-black text-xs gap-2"
                >
                  {showHistory ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                  {showHistory ? "Collapse Old Records" : `View Medication History (${prescriptions.history.length})`}
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

// HELPER COMPONENTS
const InfoTile = ({ label, value }) => (
  <div className="bg-base-200/50 p-3 rounded-2xl border border-base-300/50">
    <div className="text-[9px] uppercase font-black opacity-40 tracking-widest mb-1">{label}</div>
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
  <div className={`bg-base-100 p-6 rounded-[2rem] border-2 transition-all shadow-sm ${isActive ? 'border-secondary/30' : 'border-base-300 opacity-60'}`}>
    <div className="flex justify-between items-center mb-4">
      <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">
        Issued: {new Date(p.startDate).toLocaleDateString()}
      </span>
      {isActive && <CheckCircle2 className="text-emerald-500" size={18} />}
    </div>
    <div className="space-y-4">
      {p.medicines?.map((med, idx) => (
        <div key={idx} className={`pl-4 border-l-4 ${isActive ? 'border-secondary' : 'border-base-300'}`}>
          <p className="font-black text-sm">{med.name}</p>
          <p className="text-[10px] font-bold opacity-60 uppercase mt-1">
            {med.dosage} • {med.timing?.join(" & ")} • {med.relationToFood}
          </p>
          <p className="text-[9px] font-black text-primary mt-1 uppercase">For {med.durationDays} Days</p>
        </div>
      ))}
    </div>
  </div>
);

export default PatientDetails;