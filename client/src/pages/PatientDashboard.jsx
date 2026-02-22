import React, { useEffect, useState } from "react";
import { CheckCircle2, Circle, Calendar, User, Activity, Clock, AlertCircle } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const PatientDashboard = () => {
  const [data, setData] = useState(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    const formattedDate = viewDate.toISOString().split('T')[0];
    try {
      const res = await api.get(`/users/patient-dashboard?date=${formattedDate}`);
      setData(res.data);
    } catch (err) {
      toast.error("Dashboard sync failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, [viewDate]);

  const handleLog = async (pId, medName, time) => {
    try {
      await api.post("/prescriptions/log-medication", {
        prescription: pId,
        medicineName: medName,
        timing: time,
        date: viewDate,
        status: "Taken"
      });
      fetchDashboard(); // Refresh UI
    } catch (err) {
      toast.error("Failed to update log");
    }
  };

  if (loading || !data) return <div className="loading">...</div>;

  // Process medications for the UI
  const medsForDay = [];
  data.activePrescriptions.forEach(p => {
    p.medicines.forEach(m => {
      m.timing.forEach(t => {
        const log = data.logs.find(l => l.medicineName === m.name && l.timing === t);
        medsForDay.push({ ...m, currentTiming: t, pId: p._id, status: log?.status });
      });
    });
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* HEADER: Next Follow-up & Dr. Name */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-2 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl">
          <h1 className="text-3xl font-bold">Welcome Back!</h1>
          <div className="mt-4 flex items-center gap-6">
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <Calendar size={18} />
              <span>Next Follow-up: {data.nextFollowUp ? new Date(data.nextFollowUp).toLocaleDateString() : 'TBD'}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
              <User size={18} />
              <span>Dr. {data.assignedDoctor?.name || 'Assigned'}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center shadow-sm">
          <div className="text-sm font-bold text-slate-400 uppercase">Adherence Score</div>
          <div className="text-5xl font-black text-blue-600 mt-2">{data.adherenceScore}%</div>
        </div>
      </div>

      {/* WEEK SELECTOR */}
      <div className="flex justify-between p-2 bg-slate-100 rounded-2xl">
        {[...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const isActive = d.toDateString() === viewDate.toDateString();
          return (
            <button key={i} onClick={() => setViewDate(d)} className={`flex-1 py-3 rounded-xl flex flex-col items-center ${isActive ? 'bg-white shadow-md text-blue-600' : 'text-slate-500'}`}>
              <span className="text-[10px] font-bold uppercase">{d.toLocaleDateString('en', { weekday: 'short' })}</span>
              <span className="text-lg font-bold">{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      {/* MEDICATION LISTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section: To Be Taken */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2"><Clock className="text-orange-500" /> Pending Doses</h3>
          {medsForDay.filter(m => !m.status).map((m, i) => (
            <div key={i} className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-500 transition-all">
              <div>
                <h4 className="font-bold text-lg">{m.name}</h4>
                <p className="text-sm text-slate-500">{m.dosage} • {m.currentTiming} • {m.relationToFood}</p>
              </div>
              <button onClick={() => handleLog(m.pId, m.name, m.currentTiming)} className="btn btn-circle btn-ghost text-slate-300 hover:text-blue-600">
                <Circle size={32} />
              </button>
            </div>
          ))}
        </div>

        {/* Section: History/Completed */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2"><CheckCircle2 className="text-emerald-500" /> Logged History</h3>
          {medsForDay.filter(m => m.status).map((m, i) => (
            <div key={i} className={`flex items-center justify-between p-5 rounded-2xl border ${m.status === 'Taken' ? 'bg-emerald-50 border-emerald-100 opacity-80' : 'bg-red-50 border-red-100'}`}>
              <div className="flex items-center gap-4">
                {m.status === 'Taken' ? <CheckCircle2 className="text-emerald-500" /> : <AlertCircle className="text-red-500" />}
                <div>
                  <h4 className={`font-bold ${m.status === 'Taken' ? 'line-through' : ''}`}>{m.name}</h4>
                  <p className="text-xs uppercase font-bold">{m.currentTiming} - {m.status}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;