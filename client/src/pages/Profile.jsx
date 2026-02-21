import React, { useState, useEffect } from "react";
import { User, Calendar, Lock, Phone, Save, Edit3, Heart, ShieldAlert, Activity, Ruler, Weight } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [data, setData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [role, setRole] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/users/profile");
        // We include password as an empty string for the form
        const initialData = { ...data, password: "" };
        setData(initialData);
        setOriginalData(JSON.stringify(initialData));
        setRole(data.user?.role || data.role);
      } catch (err) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = (path, value) => {
    const newData = { ...data };
    const keys = path.split(".");
    let current = newData;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {}; 
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setData(newData);
  };

  // Compare current state to original state to enable/disable Save button
  const isDirty = JSON.stringify(data) !== originalData;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Intl.DateTimeFormat('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric' 
    }).format(new Date(dateString));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isDirty) return;
    if (!window.confirm("Confirm profile updates?")) return;

    setUpdating(true);
    try {
      const { data: updatedResponse } = await api.put("/users/profile", data);
      toast.success("Changes saved successfully");
      
      const resetData = { ...updatedResponse, password: "" };
      setData(resetData);
      setOriginalData(JSON.stringify(resetData));
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><span className="loading loading-spinner text-primary"></span></div>;

  const editableClass = "group relative border border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 rounded-xl p-3 cursor-text bg-base-200/30";

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 pb-24 space-y-8 animate-in fade-in duration-500">
      
      {/* --- HEADER (Read-Only Joined Date) --- */}
      <div className="flex flex-col md:flex-row items-center gap-6 bg-base-100 p-6 md:p-10 rounded-[2.5rem] border border-base-300 shadow-sm">
        <div className="avatar placeholder">
          {/* Centering Fix for Avatar Alphabet */}
          <div className="bg-primary text-primary-content rounded-3xl w-24 h-24 md:w-32 md:h-32 flex items-center justify-center shadow-2xl shadow-primary/20">
            <span className="text-4xl md:text-5xl font-black leading-none uppercase select-none">
              {(data.user?.name || data.name)?.[0]}
            </span>
          </div>
        </div>

        <div className="text-center md:text-left space-y-3">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">{data.user?.name || data.name}</h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center">
            <span className="badge badge-primary badge-lg font-bold py-4 px-6">{role}</span>
            <div className="flex items-center gap-2 px-4 py-2 bg-base-200 rounded-2xl text-xs font-black uppercase tracking-wider opacity-70">
              <Calendar size={14} className="text-primary"/>
              Joined {formatDate(data.user?.createdAt || data.createdAt)}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMN 1: SECURITY & VITALS */}
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-4">Account Security</h2>
            <div className="bg-base-100 border border-base-300 p-6 rounded-[2rem] space-y-4">
              <div className={editableClass}>
                <label className="text-[10px] font-black uppercase opacity-40 flex items-center gap-1">Display Name <Edit3 size={10}/></label>
                <input className="bg-transparent w-full font-bold outline-none" value={data.user?.name || data.name} onChange={(e) => handleUpdate(data.user ? 'user.name' : 'name', e.target.value)} />
              </div>
              <div className={editableClass}>
                <label className="text-[10px] font-black uppercase opacity-40 text-primary">New Password</label>
                <input type="password" placeholder="Leave empty to keep current" className="bg-transparent w-full font-bold outline-none" value={data.password} onChange={(e) => handleUpdate('password', e.target.value)} />
              </div>
            </div>
          </section>

          {role === "PATIENT" && (
            <section className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-4">Physical Vitals</h2>
              <div className="bg-base-100 border border-base-300 p-6 rounded-[2rem] grid grid-cols-2 gap-4">
                <div className={editableClass}>
                  <label className="text-[10px] font-black uppercase opacity-40"><Ruler size={10}/> Height (cm)</label>
                  <input type="number" className="bg-transparent w-full font-bold outline-none" value={data.heightCm || ""} onChange={(e) => handleUpdate('heightCm', e.target.value)} />
                </div>
                <div className={editableClass}>
                  <label className="text-[10px] font-black uppercase opacity-40"><Weight size={10}/> Weight (kg)</label>
                  <input type="number" className="bg-transparent w-full font-bold outline-none" value={data.weightKg || ""} onChange={(e) => handleUpdate('weightKg', e.target.value)} />
                </div>
              </div>
            </section>
          )}
        </div>

        {/* COLUMN 2: CONTACT & EMERGENCY */}
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-4">Contact Info</h2>
            <div className="bg-base-100 border border-base-300 p-6 rounded-[2rem] space-y-4">
              <div className={editableClass}>
                <label className="text-[10px] font-black uppercase opacity-40">Personal Phone</label>
                <input className="bg-transparent w-full font-bold outline-none" value={data.contactNumber || ""} onChange={(e) => handleUpdate('contactNumber', e.target.value)} />
              </div>
              {role === "DOCTOR" && (
                <div className={editableClass}>
                  <label className="text-[10px] font-black uppercase opacity-40">Practice Location</label>
                  <input className="bg-transparent w-full font-bold outline-none" value={data.practiceLocation || ""} onChange={(e) => handleUpdate('practiceLocation', e.target.value)} />
                </div>
              )}
            </div>
          </section>

          {role === "PATIENT" && (
            <section className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-error/60 ml-4">Emergency Contact</h2>
              <div className="bg-base-100 border-2 border-error/5 p-6 rounded-[2rem] space-y-4">
                <div className={editableClass}>
                  <label className="text-[10px] font-black uppercase opacity-40 text-error/60">Full Name</label>
                  <input className="bg-transparent w-full font-bold outline-none" value={data.emergencyContact?.name || ""} onChange={(e) => handleUpdate('emergencyContact.name', e.target.value)} />
                </div>
                <div className={editableClass}>
                  <label className="text-[10px] font-black uppercase opacity-40 text-error/60">Phone Number</label>
                  <input className="bg-transparent w-full font-bold outline-none" value={data.emergencyContact?.phone || ""} onChange={(e) => handleUpdate('emergencyContact.phone', e.target.value)} />
                </div>
              </div>
            </section>
          )}
        </div>

        {/* COLUMN 3: MEDICAL PROFILE & ACTIONS */}
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-4">System Details</h2>
            <div className="bg-base-100 border border-base-300 p-6 rounded-[2rem] space-y-4">
              {role === "DOCTOR" ? (
                <div className={editableClass}>
                  <label className="text-[10px] font-black uppercase opacity-40">Specialization</label>
                  <input className="bg-transparent w-full font-bold outline-none" value={data.specialization || ""} onChange={(e) => handleUpdate('specialization', e.target.value)} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className={editableClass}>
                    <label className="text-[10px] font-black uppercase opacity-40">Age</label>
                    <input type="number" className="bg-transparent w-full font-bold outline-none" value={data.age || ""} onChange={(e) => handleUpdate('age', e.target.value)} />
                  </div>
                  <div className={editableClass}>
                    <label className="text-[10px] font-black uppercase opacity-40">Blood</label>
                    <input className="bg-transparent w-full font-bold outline-none" value={data.bloodGroup || ""} onChange={(e) => handleUpdate('bloodGroup', e.target.value)} />
                  </div>
                </div>
              )}
              <div className="p-3">
                <label className="text-[10px] font-black uppercase opacity-40 italic">System Email (Permanent)</label>
                <p className="font-bold opacity-40">{data.user?.email || data.email}</p>
              </div>
            </div>
          </section>

          <button 
            type="submit" 
            disabled={!isDirty || updating} 
            className={`btn btn-lg w-full rounded-[2rem] shadow-2xl gap-3 transition-all duration-500 ${isDirty ? 'btn-primary shadow-primary/30 scale-100' : 'btn-disabled opacity-40 grayscale scale-[0.98]'}`}
          >
            {updating ? <span className="loading loading-spinner"></span> : <Save size={20}/>}
            {updating ? "Processing..." : isDirty ? "Save Changes" : "No Changes Detected"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;