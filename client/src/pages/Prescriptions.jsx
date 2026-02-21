import React, { useEffect, useState } from "react";
import { Pill, Calendar, User, FileText, Clock, ExternalLink, X } from "lucide-react";
import api from "../api/axios";

const Prescriptions = () => {
  const [data, setData] = useState({ active: null, history: [] });
  const [selected, setSelected] = useState(null); // For Modal
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const res = await api.get("/prescriptions/my-checklist");
        setData(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchPrescriptions();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center"><span className="loading loading-spinner text-primary"></span></div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10 pb-20">
      <header>
        <h1 className="text-3xl font-black">My Prescriptions</h1>
        <p className="opacity-50 text-sm">Manage your current medications and medical history</p>
      </header>

      {/* --- ACTIVE PRESCRIPTION SECTION --- */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <Clock size={14}/> Currently Active
        </h2>
        {data.active ? (
          <div className="bg-primary text-primary-content rounded-3xl p-8 shadow-xl shadow-primary/20 relative overflow-hidden">
             <div className="absolute right-[-20px] top-[-20px] opacity-10"><Pill size={150}/></div>
             <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <p className="text-[10px] font-black uppercase opacity-70">Prescribed By</p>
                      <h3 className="text-2xl font-bold">Dr. {data.active.doctor?.name}</h3>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black uppercase opacity-70">Start Date</p>
                      <p className="font-bold">{new Date(data.active.createdAt).toLocaleDateString()}</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.active.medicines.map((med, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl">
                       <div className="flex justify-between items-start">
                          <p className="font-black text-lg">{med.name}</p>
                          <span className="badge badge-sm bg-white text-primary border-none font-bold uppercase">{med.durationDays} Days</span>
                       </div>
                       <p className="text-xs opacity-80 mt-1 font-medium">{med.dosage} • {med.timing.join(", ")}</p>
                       <p className="text-[10px] italic mt-2 opacity-60">Take {med.relationToFood}</p>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        ) : (
          <div className="p-10 border-2 border-dashed border-base-300 rounded-3xl text-center opacity-40 italic">
            No active medications found.
          </div>
        )}
      </section>

      {/* --- HISTORY SECTION --- */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest opacity-50 flex items-center gap-2">
          <FileText size={14}/> Previous Prescriptions
        </h2>
        <div className="bg-base-100 border border-base-300 rounded-3xl overflow-hidden divide-y divide-base-300">
           {data.history.map((h) => (
             <div 
                key={h._id} 
                onClick={() => setSelected(h)}
                className="p-5 flex items-center justify-between hover:bg-base-200 cursor-pointer transition-colors"
             >
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-base-300 rounded-xl flex items-center justify-center text-base-content/50">
                      <Calendar size={20}/>
                   </div>
                   <div>
                      <p className="font-bold">Dr. {h.doctor?.name}</p>
                      <p className="text-xs opacity-50">{new Date(h.createdAt).toLocaleDateString()}</p>
                   </div>
                </div>
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase">
                  Details <ExternalLink size={14}/>
                </div>
             </div>
           ))}
           {data.history.length === 0 && <div className="p-10 text-center opacity-30 italic">No history available</div>}
        </div>
      </section>

      {/* --- DETAIL DIALOG (MODAL) --- */}
      {selected && (
        <div className="modal modal-open modal-bottom sm:modal-middle bg-black/60 transition-all">
          <div className="modal-box rounded-3xl border border-base-300 p-0 overflow-hidden">
            <div className="bg-base-200 p-6 flex justify-between items-center border-b border-base-300">
               <div>
                  <h3 className="font-black text-lg">Prescription Summary</h3>
                  <p className="text-xs opacity-50">Visit Date: {new Date(selected.createdAt).toLocaleDateString()}</p>
               </div>
               <button onClick={() => setSelected(null)} className="btn btn-sm btn-circle btn-ghost"><X size={20}/></button>
            </div>
            
            <div className="p-6 space-y-6">
               <div className="flex items-center gap-3">
                  <div className="avatar placeholder">
                    <div className="bg-primary text-primary-content rounded-full w-12">
                      <span className="text-xl font-bold">{selected.doctor?.name[0]}</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-black text-lg">Dr. {selected.doctor?.name}</p>
                    <p className="text-xs opacity-60">In-person consultation</p>
                  </div>
               </div>

               <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">Medications</h4>
                  {selected.medicines.map((med, i) => (
                    <div key={i} className="bg-base-200 p-4 rounded-2xl border border-base-300">
                       <p className="font-bold text-base-content">{med.name} <span className="text-primary text-xs ml-2 font-normal">({med.dosage})</span></p>
                       <div className="flex flex-wrap gap-2 mt-2">
                         {med.timing.map(t => <span key={t} className="badge badge-sm font-bold bg-base-300 border-none">{t}</span>)}
                         <span className="badge badge-sm badge-outline opacity-50">{med.relationToFood}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="p-6 bg-base-200 border-t border-base-300 flex justify-end">
               <button onClick={() => setSelected(null)} className="btn btn-primary rounded-xl px-8">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prescriptions;