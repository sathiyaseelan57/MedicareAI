import React, { useState } from "react";
import {
  Users,
  UserCog,
  Plus,
  Search,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("DOCTORS");

  // Mock Data
  const doctors = [
    {
      id: 1,
      name: "Dr. Sarah Jenkins",
      email: "s.jenkins@hospital.com",
      dept: "Cardiology",
    },
    {
      id: 2,
      name: "Dr. Mark Wilson",
      email: "m.wilson@hospital.com",
      dept: "Neurology",
    },
  ];

  const patients = [
    { id: 1, name: "John Doe", mrn: "MRN-8821", lastVisit: "2024-02-15" },
    { id: 2, name: "Alice Cooper", mrn: "MRN-3301", lastVisit: "2024-02-28" },
  ];

  return (
    <div className="p-6 bg-base-200 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-base-100 p-8 rounded-[2rem] shadow-sm border border-base-300">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <ShieldCheck size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                Administrative Portal
              </span>
            </div>
            <h1 className="text-3xl font-black">System Control</h1>
          </div>
          <button
            onClick={() => navigate("/add-patient")}
            className="btn btn-primary rounded-2xl gap-2 font-black"
          >
            <Plus size={20} /> Add New Patient
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed bg-base-100 p-2 rounded-2xl border border-base-300 w-fit mx-auto md:mx-0">
          <button
            className={`tab gap-2 font-bold px-8 ${
              activeTab === "DOCTORS"
                ? "tab-active !bg-primary !text-white"
                : ""
            }`}
            onClick={() => setActiveTab("DOCTORS")}
          >
            <UserCog size={18} /> Staff (Doctors)
          </button>
          <button
            className={`tab gap-2 font-bold px-8 ${
              activeTab === "PATIENTS"
                ? "tab-active !bg-primary !text-white"
                : ""
            }`}
            onClick={() => setActiveTab("PATIENTS")}
          >
            <Users size={18} /> Patients
          </button>
        </div>

        {/* Table Container */}
        <div className="bg-base-100 rounded-[2rem] shadow-sm border border-base-300 overflow-hidden">
          <div className="p-6 border-b border-base-200 flex justify-between items-center">
            <h2 className="font-black text-lg">
              {activeTab === "DOCTORS"
                ? "Medical Staff List"
                : "Patient Directory"}
            </h2>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30"
                size={16}
              />
              <input
                type="text"
                placeholder="Search records..."
                className="input input-sm bg-base-200 rounded-lg pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-base-200/50">
                <tr className="text-[10px] font-black uppercase opacity-50 border-none">
                  <th>
                    {activeTab === "DOCTORS" ? "Name / Dept" : "Name / MRN"}
                  </th>
                  <th>Contact/Visit</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeTab === "DOCTORS"
                  ? doctors.map((doc) => (
                      <tr key={doc.id} className="hover:bg-base-200/30">
                        <td>
                          <div className="font-bold">{doc.name}</div>
                          <div className="text-[10px] opacity-50 font-black">
                            {doc.dept}
                          </div>
                        </td>
                        <td className="text-sm">{doc.email}</td>
                        <td className="text-right">
                          <button className="btn btn-ghost btn-xs text-error">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  : patients.map((pat) => (
                      <tr key={pat.id} className="hover:bg-base-200/30">
                        <td>
                          <div className="font-bold">{pat.name}</div>
                          <div className="text-[10px] opacity-50 font-black">
                            {pat.mrn}
                          </div>
                        </td>
                        <td className="text-sm">Last Seen: {pat.lastVisit}</td>
                        <td className="text-right">
                          <button className="btn btn-ghost btn-xs text-error">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
