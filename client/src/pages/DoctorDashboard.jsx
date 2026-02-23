import React, { useEffect, useState } from "react";
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  PlayCircle,
  User as UserIcon,
  Activity,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

const DoctorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/users/doctor-dashboard");
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading || !data)
    return (
      <div className="h-screen flex items-center justify-center bg-base-300">
        <span className="loading loading-infinity loading-lg text-primary"></span>
      </div>
    );

  return (
    <div className="min-h-screen bg-base-200/50 pb-12 transition-all duration-500">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* TOP SECTION: GRADIENT HERO & RADIAL STATS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-500/20">
            <div className="relative z-10">
              <h1 className="text-4xl font-black tracking-tight">Physician Hub</h1>
              <p className="mt-2 opacity-90 font-medium max-w-md">
                Managing {data.stats.pendingConsultations} upcoming visits. Overview of your current assigned medical cases.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <div className="badge badge-lg py-6 px-6 bg-white/10 border-none backdrop-blur-md gap-3 rounded-2xl">
                  <Calendar size={20} />
                  <span className="font-bold">Queue: {data.appointments.length} Left</span>
                </div>
                <div className="badge badge-lg py-6 px-6 bg-white/10 border-none backdrop-blur-md gap-3 rounded-2xl">
                  <CheckCircle2 size={20} />
                  <span className="font-bold">{data.stats.completedConsultations} Done</span>
                </div>
              </div>
            </div>
            <TrendingUp className="absolute -right-8 -bottom-8 w-64 h-64 opacity-10 rotate-12" />
          </div>

          <div className="bg-base-100 dark:bg-neutral rounded-[2.5rem] p-8 flex flex-col items-center justify-center border border-base-300 shadow-xl">
            <div className="radial-progress text-primary" style={{ "--value": 75, "--size": "10rem", "--thickness": "12px" }}>
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black">{data.stats.totalUniquePatients}</span>
                <span className="text-[10px] uppercase font-bold opacity-50 tracking-widest">Total Patients</span>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* APPOINTMENT QUEUE */}
          <section className="lg:col-span-8 space-y-6">
            <h3 className="text-2xl font-black flex items-center gap-3 px-2">
              <Clock className="text-primary" /> Today's Queue
            </h3>
            
            <div className="bg-base-100/50 backdrop-blur-sm border border-base-300 rounded-[2.5rem] overflow-hidden shadow-sm">
              <table className="table w-full">
                <thead className="bg-base-200/50 text-base-content/50 uppercase text-[11px] font-black tracking-widest">
                  <tr>
                    <th className="py-6 px-8">Patient Identity</th>
                    <th>Appt. Time</th>
                    <th>Reason</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200">
                  {data.appointments.map((app) => (
                    <tr key={app._id} className="hover:bg-primary/5 transition-all group border-none">
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/10 shadow-inner">
                            {app.patient?.profilePic ? (
                              <img src={app.patient.profilePic} className="w-full h-full object-cover rounded-2xl" alt="" />
                            ) : (
                              <UserIcon size={22} />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-base">{app.patient?.name}</div>
                            <div className="text-[10px] uppercase font-black opacity-40">
                              {app.patient?.gender} • {app.patient?.age} Yrs
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="badge badge-outline border-primary/30 text-primary font-black px-4 py-3 rounded-xl font-mono">
                          {app.appointmentTime}
                        </div>
                      </td>
                      <td className="text-sm italic opacity-60 truncate max-w-[180px]">
                        "{app.reason || 'Routine'}"
                      </td>
                      <td className="text-center">
                        <button 
                          onClick={() => navigate(`/doctor/consultation/${app._id}`)}
                          className="btn btn-primary rounded-2xl px-6 normal-case font-bold group-hover:scale-105 transition-transform"
                        >
                          Launch <PlayCircle size={18} className="ml-1" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* SIDEBAR: PATIENT DIRECTORY (Basic Details Only) */}
          <aside className="lg:col-span-4 space-y-6">
            <h3 className="text-2xl font-black flex items-center gap-3 px-2">
              <Users className="text-secondary" /> My Patients
            </h3>
            <div className="bg-base-100/50 backdrop-blur-sm rounded-[2.5rem] border border-base-300 shadow-sm divide-y divide-base-200 overflow-hidden">
              {data.patients.map((p) => (
                <div 
                  key={p._id} 
                  className="p-6 flex items-center justify-between hover:bg-base-200 transition-all cursor-pointer group"
                  onClick={() => navigate(`/patient-details/${p._id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="avatar placeholder">
                      <div className="flex items-center justify-center bg-neutral text-neutral-content rounded-2xl w-12 border border-base-300 shadow-md">
                        <span className="font-bold">{p.name?.charAt(0)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-black group-hover:text-primary transition-colors">{p.name}</div>
                      <div className="text-[10px] uppercase font-bold opacity-40 tracking-wider">
                        {p.gender} • {p.age} Years
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-primary" />
                </div>
              ))}
            </div>
            
            {/* ADDED: QUICK ACTIVITY MINI-STATS (Optional enhancement for sidebar) */}
            <div className="p-6 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-[2.5rem] border border-blue-200/20">
              <h4 className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">Quick Insights</h4>
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-indigo-600">+{data.stats.totalUniquePatients}</span>
                  <span className="text-[10px] font-bold opacity-50">Total Records</span>
                </div>
                <Activity className="text-indigo-600 opacity-20" size={32} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;