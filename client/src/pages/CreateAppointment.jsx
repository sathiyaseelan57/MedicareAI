import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Calendar, User, Stethoscope } from "lucide-react";
import api from "../api/axios";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const CreateAppointment = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  
  // Role checks
  const isAdmin = currentUser?.role === "ADMIN";
  const isDoctor = currentUser?.role === "DOCTOR";
  const isPatient = currentUser?.role === "PATIENT";

  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);

  const [formData, setFormData] = useState({
    patientId: isPatient ? currentUser?._id : "",
    doctorId: isDoctor ? currentUser?._id : (currentUser?.assignedDoctor || ""),
    appointmentDate: "",
    appointmentTime: "08:00",
    reason: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const promises = [api.get("/users/doctors")];
        // Admins and Doctors need to see the patient list
        if (isAdmin || isDoctor) {
          promises.push(api.get("/users/patients"));
        }
        
        const [docsRes, patientsRes] = await Promise.all(promises);
        setDoctors(docsRes.data);
        if (patientsRes) setPatients(patientsRes.data);
      } catch (err) {
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin, isDoctor]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.doctorId || !formData.patientId) {
      return toast.error("Please select both patient and doctor");
    }

    setLoading(true);
    const combinedDateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`);
    
    try {
      await api.post("/appointments", { ...formData, appointmentDate: combinedDateTime });
      toast.success("Appointment Scheduled");
      navigate(-1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-circle">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Schedule Appointment</h1>
      </div>

      <form onSubmit={handleSubmit} className="card bg-base-100 shadow-xl border border-base-200">
        <div className="card-body gap-6">
          
          {/* Section: Participants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient Selection (Visible to Admin/Doctor) */}
            <div className="form-control">
              <label className="label font-bold text-xs opacity-60 uppercase tracking-wider">Patient</label>
              {isAdmin || isDoctor ? (
                <select 
                  className="select select-bordered"
                  value={formData.patientId}
                  onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                  required
                >
                  <option value="">Select Patient...</option>
                  {patients.map(p => <option key={p._id} value={p._id}>{p.name} (MRN: {p.mrn})</option>)}
                </select>
              ) : (
                <div className="input input-bordered bg-base-200 flex items-center gap-2">
                  <User size={16} className="opacity-50" />
                  <span>{currentUser?.name}</span>
                </div>
              )}
            </div>

            {/* Doctor Selection (Always visible, but pre-filled for Patients/Doctors) */}
            <div className="form-control">
              <label className="label font-bold text-xs opacity-60 uppercase tracking-wider">Assigned Doctor</label>
              {isDoctor ? (
                <div className="input input-bordered bg-base-200 flex items-center gap-2">
                  <Stethoscope size={16} className="opacity-50" />
                  <span>Dr. {currentUser?.name}</span>
                </div>
              ) : (
                <select 
                  className="select select-bordered border-primary/30"
                  value={formData.doctorId}
                  onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                  required
                >
                  <option value="">Choose Doctor...</option>
                  {doctors.map(d => (
                    <option key={d._id} value={d._id}>Dr. {d.name} ({d.specialization || "General"})</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Section: Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-base-200/50 p-4 rounded-xl">
            <div className="form-control">
              <label className="label font-bold text-xs opacity-60">DATE</label>
              <input 
                type="date" 
                className="input input-bordered"
                value={formData.appointmentDate}
                onChange={(e) => setFormData({...formData, appointmentDate: e.target.value})}
                required
              />
            </div>
            <div className="form-control">
              <label className="label font-bold text-xs opacity-60">TIME SLOT</label>
              <input 
                type="time" 
                className="input input-bordered"
                value={formData.appointmentTime}
                onChange={(e) => setFormData({...formData, appointmentTime: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label font-bold text-xs opacity-60">REASON FOR VISIT</label>
            <textarea 
              className="textarea textarea-bordered h-24"
              placeholder="Describe symptoms or purpose of visit..."
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary w-full mt-4"
          >
            {loading ? <span className="loading loading-spinner"></span> : <Save size={18} />}
            Confirm Appointment
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAppointment;