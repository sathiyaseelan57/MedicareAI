import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Clock, Info } from "lucide-react";
import api from "../api/axios";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const CreateAppointment = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const isDoctor = currentUser?.role === "DOCTOR";

  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);

  const [formData, setFormData] = useState({
    patientId: isDoctor ? "" : currentUser?._id,
    doctorId: isDoctor ? currentUser?._id : "",
    appointmentDate: "",
    appointmentTime: "08:00",
    status: "Scheduled",
    reason: "",
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 2);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  const patientTimeSlots = Array.from({ length: 11 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [docsRes, patientsRes] = await Promise.all([
          api.get("/users/doctors"),
          isDoctor ? api.get("/users/patients") : Promise.resolve({ data: [] }),
        ]);
        setDoctors(docsRes.data);
        if (isDoctor) setPatients(patientsRes.data);
      } catch (err) {
        toast.error("Data sync failed");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isDoctor]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const combinedDateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`);
    try {
      await api.post("/appointments", { ...formData, appointmentDate: combinedDateTime });
      toast.success("Appointment created");
      navigate(isDoctor ? "/appointments" : "/patient-dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Scheduling failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Header Area */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold">New Appointment</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-base-100 border border-base-300 rounded-lg shadow-sm">
        <div className="p-5 space-y-4">
          
          {/* Row 1: Participants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-bold text-xs opacity-70">PATIENT</span></label>
              {isDoctor ? (
                <select 
                  className="select select-bordered select-sm rounded-md"
                  value={formData.patientId}
                  onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                  required
                >
                  <option value="">Choose Patient...</option>
                  {patients.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              ) : (
                <input className="input input-bordered input-sm rounded-md bg-base-200" value={currentUser?.name} disabled />
              )}
            </div>

            <div className="form-control">
              <label className="label py-1"><span className="label-text font-bold text-xs opacity-70">ASSIGN TO DOCTOR</span></label>
              <select 
                className="select select-bordered select-sm rounded-md"
                value={formData.doctorId}
                onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                required
              >
                <option value="">Select Doctor...</option>
                {doctors.map(d => (
                  <option key={d._id} value={d._id}>Dr. {d.name} ({d.specialization || "GP"})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-bold text-xs opacity-70">DATE</span></label>
              <input 
                type="date" min={todayStr} max={maxDateStr}
                className="input input-bordered input-sm rounded-md"
                value={formData.appointmentDate}
                onChange={(e) => setFormData({...formData, appointmentDate: e.target.value})}
                required
              />
            </div>

            <div className="form-control">
              <label className="label py-1"><span className="label-text font-bold text-xs opacity-70 uppercase tracking-tighter">Time Slot</span></label>
              {isDoctor ? (
                <input 
                  type="time"
                  className="input input-bordered input-sm rounded-md"
                  value={formData.appointmentTime}
                  onChange={(e) => setFormData({...formData, appointmentTime: e.target.value})}
                  required
                />
              ) : (
                <select 
                  className="select select-bordered select-sm rounded-md"
                  value={formData.appointmentTime}
                  onChange={(e) => setFormData({...formData, appointmentTime: e.target.value})}
                  required
                >
                  {patientTimeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* Row 3: Reason (Full Width) */}
          <div className="form-control flex items-start">
            <label className="label py-1 pr-2"><span className="label-text font-bold text-xs opacity-70">REASON FOR VISIT</span></label>
            <textarea 
              className="textarea textarea-bordered rounded-md h-24 resize-none"
              placeholder="Symptoms or purpose..."
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              required
            />
          </div>

          {/* Submit Row */}
          <div className="pt-2 flex justify-end">
            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary btn-md px-8 rounded-md"
            >
              {loading ? <span className="loading loading-spinner"></span> : <Save size={18} />}
              Confirm Appointment
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateAppointment;