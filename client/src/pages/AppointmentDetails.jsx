import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Activity, Pill, FileText, Download, 
  Stethoscope, Calendar, User, Clipboard
} from "lucide-react";
import api from "../api/axios";

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const { data } = await api.get(`/appointments/${id}`);
        setAppt(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center text-primary font-bold uppercase tracking-widest">Retrieving Record...</div>;
  if (!appt) return <div className="p-10 text-center">Record not found.</div>;

  const isCompleted = appt.status === "Completed";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 space-y-8 animate-in fade-in">
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm gap-2">
        <ArrowLeft size={18} /> Back to List
      </button>

      {/* 1. BASIC INFO CARD */}
      <div className="bg-primary text-primary-content p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 opacity-80 uppercase text-xs font-black tracking-widest">
            <Calendar size={14} /> Appointment Details
          </div>
          <h1 className="text-3xl font-black">Dr. {appt.doctor?.name}</h1>
          <p className="font-medium text-lg opacity-90">{new Date(appt.appointmentDate).toLocaleString()}</p>
        </div>
        <div className="bg-white/20 px-6 py-3 rounded-2xl backdrop-blur-md border border-white/10">
          <p className="text-[10px] font-black uppercase opacity-70">Status</p>
          <p className="text-xl font-bold">{appt.status}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: VISUAL VITALS & INFO */}
        <div className="space-y-6">
          <div className="card bg-base-100 border border-base-300 p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold flex items-center gap-2 mb-4 text-primary"><User size={18}/> Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black opacity-40 uppercase">Reason for Visit</p>
                <p className="font-medium">{appt.reason}</p>
              </div>
              {isCompleted && (
                <div className="pt-4 border-t border-base-200 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black opacity-40 uppercase">BP</p>
                    <p className="font-bold">{appt.vitalsAtVisit?.bp || '--'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black opacity-40 uppercase">Temp</p>
                    <p className="font-bold">{appt.vitalsAtVisit?.temp}°C</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!isCompleted && (
            <div className="alert alert-info rounded-2xl border-none bg-blue-50 text-blue-700">
              <Clipboard size={20} />
              <span className="text-xs font-bold uppercase">Clinical notes and prescriptions will appear here after the visit.</span>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: CLINICAL DATA (Only if Completed) */}
        <div className="lg:col-span-2 space-y-6">
          {isCompleted ? (
            <>
              {/* Diagnosis & Notes */}
              <div className="card bg-base-100 border border-base-300 p-6 rounded-2xl">
                <h3 className="text-xl font-black flex items-center gap-2 mb-4">
                  <Stethoscope className="text-primary" size={24}/> Diagnosis
                </h3>
                <div className="p-4 bg-base-200 rounded-xl font-bold text-lg mb-4 text-primary">
                  {appt.diagnosis}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-black opacity-40 uppercase">Doctor's Notes</p>
                  <p className="leading-relaxed opacity-80 whitespace-pre-wrap">{appt.notes || "No notes provided."}</p>
                </div>
              </div>

              {/* Prescription */}
              <div className="card bg-base-100 border border-base-300 p-6 rounded-2xl">
                <h3 className="text-xl font-black flex items-center gap-2 mb-4">
                  <Pill className="text-primary" size={24}/> Prescription
                </h3>
                <div className="space-y-3">
                  {appt.prescription?.medicines?.map((med, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-base-200 rounded-xl">
                      <div>
                        <p className="font-black text-base-content">{med.name}</p>
                        <p className="text-xs font-bold opacity-50 uppercase tracking-tighter">
                          {med.dosage} • {med.timing.join(", ")} • {med.relationToFood}
                        </p>
                      </div>
                      <span className="badge badge-primary badge-outline font-bold">{med.durationDays} Days</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reports */}
              {appt.reports && appt.reports.length > 0 && (
                <div className="card bg-base-100 border border-base-300 p-6 rounded-2xl">
                  <h3 className="text-xl font-black flex items-center gap-2 mb-4">
                    <FileText className="text-primary" size={24}/> Diagnostic Reports
                  </h3>
                  <div className="grid gap-2">
                    {appt.reports.map((rep, i) => (
                      <a 
                        key={i} href={rep.fileUrl} target="_blank" rel="noreferrer"
                        className="flex items-center justify-between p-4 bg-base-100 border border-base-300 rounded-xl hover:bg-base-200 transition-colors"
                      >
                        <span className="font-bold text-sm">{rep.reportName}</span>
                        <Download size={18} className="text-primary" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-64 border-2 border-dashed border-base-300 rounded-3xl flex flex-col items-center justify-center opacity-30">
              <Activity size={48} />
              <p className="font-black uppercase tracking-widest mt-4">Visit Not Yet Completed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;