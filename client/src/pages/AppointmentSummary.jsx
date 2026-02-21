import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Activity, Pill, FileIcon, Download, Calendar } from "lucide-react";
import api from "../api/axios";

const AppointmentSummary = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      const res = await api.get(`/appointments/${id}`);
      setData(res.data);
    };
    fetchDetails();
  }, [id]);

  if (!data) return <span className="loading loading-spinner"></span>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 pb-20">
      <header className="border-b border-base-300 pb-6">
        <h1 className="text-3xl font-black text-primary">Visit Summary</h1>
        <p className="opacity-60">Consultation with Dr. {data.doctor?.name} on {new Date(data.appointmentDate).toLocaleDateString()}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* VITALS SIDEBAR */}
        <div className="space-y-4">
          <div className="bg-base-200 p-6 rounded-3xl space-y-4">
            <h2 className="font-bold flex items-center gap-2"><Activity size={18}/> Vitals</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-sm"><p className="opacity-50 uppercase text-[10px] font-bold">Temp</p><p className="font-bold">{data.vitalsAtVisit?.temp}°C</p></div>
              <div className="text-sm"><p className="opacity-50 uppercase text-[10px] font-bold">BP</p><p className="font-bold">{data.vitalsAtVisit?.bp}</p></div>
              <div className="text-sm"><p className="opacity-50 uppercase text-[10px] font-bold">Weight</p><p className="font-bold">{data.vitalsAtVisit?.weightKg}kg</p></div>
              <div className="text-sm"><p className="opacity-50 uppercase text-[10px] font-bold">Pulse</p><p className="font-bold">{data.vitalsAtVisit?.pulse} bpm</p></div>
            </div>
          </div>
          
          {data.followUpDate && (
            <div className="bg-primary/10 border border-primary/20 p-6 rounded-3xl text-primary">
              <p className="text-[10px] font-black uppercase">Next Follow-up</p>
              <p className="font-bold text-lg flex items-center gap-2"><Calendar size={18}/> {new Date(data.followUpDate).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        {/* MAIN CONTENT */}
        <div className="md:col-span-2 space-y-6">
          <section className="space-y-2">
            <h2 className="text-xl font-bold text-base-content">Diagnosis</h2>
            <div className="p-4 bg-base-100 border border-base-300 rounded-2xl font-bold text-lg">{data.diagnosis}</div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><Pill size={20}/> Prescription</h2>
            <div className="space-y-3">
              {data.prescription?.medicines?.map((med, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-base-200 rounded-2xl">
                  <div>
                    <p className="font-bold">{med.name} ({med.dosage})</p>
                    <p className="text-xs opacity-60">{med.timing.join(", ")} — {med.relationToFood}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{med.durationDays} Days</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* REPORTS SECTION */}
          {data.reports && data.reports.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold">Diagnostic Reports</h2>
              <div className="grid grid-cols-1 gap-2">
                {data.reports.map((rep, i) => (
                  <a href={rep.fileUrl} target="_blank" rel="noreferrer" key={i} className="flex items-center justify-between p-4 bg-base-100 border border-base-300 rounded-2xl hover:bg-base-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileIcon className="text-primary" />
                      <span className="font-bold">{rep.reportName}</span>
                    </div>
                    <Download size={18} className="opacity-40" />
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentSummary;