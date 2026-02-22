import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, ChevronRight, XCircle, Eye, Lock } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAppointments = async () => {
  try {
    const { data } = await api.get("/appointments/my-appointments");
    
    // SORTING: 
    // 1. Scheduled stays at the top.
    // 2. Within statuses, newest dates (DESC) appear first.
    const sorted = [...data].sort((a, b) => {
      // Priority 1: Status (Scheduled first)
      if (a.status === "Scheduled" && b.status !== "Scheduled") return -1;
      if (a.status !== "Scheduled" && b.status === "Scheduled") return 1;
      
      // Priority 2: Date (Descending - Newest to Oldest)
      return new Date(b.appointmentDate) - new Date(a.appointmentDate);
    });
    
    setAppointments(sorted);
  } catch (err) {
    toast.error("Failed to load appointments");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { fetchAppointments(); }, []);

  const handleCancel = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      await api.put(`/appointments/${id}/cancel`);
      toast.success("Appointment cancelled");
      fetchAppointments();
    } catch (err) {
      toast.error("Could not cancel appointment");
    }
  };

  const handleCardClick = (appt) => {
    // ONLY Completed appointments can be viewed
    if (appt.status === "Completed") {
      navigate(`/appointment/${appt._id}`);
    } else {
      // For Scheduled/Cancelled, we do nothing or show a specific message
      toast("Details available once visit is completed", { icon: 'ℹ️' });
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><span className="loading loading-spinner text-primary"></span></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-black tracking-tight">My Appointments</h1>
      
      <div className="grid gap-4">
        {appointments.map((appt) => {
          const isCancelled = appt.status === "Cancelled";
          const isCompleted = appt.status === "Completed";
          const isScheduled = appt.status === "Scheduled";

          return (
            <div 
              key={appt._id} 
              onClick={() => handleCardClick(appt)}
              className={`group bg-base-100 border border-base-300 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between transition-all shadow-sm 
                ${isCompleted ? "hover:border-primary cursor-pointer border-l-4 border-l-success" : "cursor-default border-l-4 border-l-base-300"}
                ${isCancelled ? "opacity-50 grayscale" : ""}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${
                  isCompleted ? 'bg-success/10 text-success' : 
                  isCancelled ? 'bg-base-300 text-base-content/40' : 
                  'bg-primary/10 text-primary'
                }`}>
                  <Calendar size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Dr. {appt.doctor?.name}</h3>
                  <div className="flex flex-wrap gap-3 text-sm opacity-60">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock size={14}/> {new Date(appt.appointmentDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    <span className={`badge badge-sm font-bold ${
                      isCancelled ? 'badge-error' : 
                      isCompleted ? 'badge-success' : 
                      'badge-primary'
                    }`}>
                      {appt.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4 md:mt-0">
                {/* 1. Scheduled: Only Cancel Button, No View */}
                {isScheduled && (
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold opacity-40 flex items-center gap-1">
                       <Lock size={12} /> View locked
                    </span>
                    <button 
                      onClick={(e) => handleCancel(e, appt._id)}
                      className="btn btn-error btn-sm rounded-lg gap-2"
                    >
                      <XCircle size={16} /> Cancel
                    </button>
                  </div>
                )}

                {/* 2. Completed: View Summary Only */}
                {isCompleted && (
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <Eye size={16} /> View Summary
                    <ChevronRight className="opacity-40 group-hover:translate-x-1 transition-all" />
                  </div>
                )}

                {/* 3. Cancelled: Just text */}
                {isCancelled && (
                  <span className="text-xs font-bold opacity-30 italic">No actions available</span>
                )}
              </div>
            </div>
          );
        })}

        {appointments.length === 0 && (
          <div className="text-center py-20 bg-base-200 rounded-3xl italic opacity-50">
            No appointment history found.
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientAppointments;