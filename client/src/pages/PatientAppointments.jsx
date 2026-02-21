import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, ChevronRight, XCircle, AlertCircle } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAppointments = async () => {
    try {
      const { data } = await api.get("/appointments/my-appointments");
      setAppointments(data);
    } catch (err) {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const handleCancel = async (e, id) => {
    e.stopPropagation(); // Prevents navigating to details when clicking cancel
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      await api.put(`/appointments/${id}/cancel`);
      toast.success("Appointment cancelled");
      fetchAppointments();
    } catch (err) {
      toast.error("Could not cancel appointment");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><span className="loading loading-spinner text-primary"></span></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-black tracking-tight">My Appointments</h1>
      
      <div className="grid gap-4">
        {appointments.map((appt) => (
          <div 
            key={appt._id} 
            onClick={() => navigate(`/appointment/${appt._id}`)}
            className="group bg-base-100 border border-base-300 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between hover:border-primary transition-all cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${appt.status === 'Completed' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Dr. {appt.doctor?.name}</h3>
                <div className="flex flex-wrap gap-3 text-sm opacity-60">
                  <span className="flex items-center gap-1 font-medium"><Clock size={14}/> {new Date(appt.appointmentDate).toLocaleString()}</span>
                  <span className={`badge badge-sm font-bold ${appt.status === 'Cancelled' ? 'badge-error' : 'badge-ghost'}`}>{appt.status}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4 md:mt-0">
              {appt.status === "Scheduled" && (
                <button 
                  onClick={(e) => handleCancel(e, appt._id)}
                  className="btn btn-ghost btn-sm text-error hover:bg-error/10 gap-2"
                >
                  <XCircle size={16} /> Cancel
                </button>
              )}
              <ChevronRight className="opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}

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