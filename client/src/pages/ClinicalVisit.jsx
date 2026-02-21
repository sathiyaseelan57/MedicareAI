import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  Pill,
  FileText,
  Upload,
  CheckCircle,
  ArrowLeft,
  Activity,
  Calendar,
  Stethoscope,
  FileIcon,
  X,
  Clock,
  Info,
  AlertCircle,
} from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const ClinicalVisit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [appointment, setAppointment] = useState(null);

  // --- FORM STATE ---
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [vitals, setVitals] = useState({
    temp: "",
    bp: "",
    pulse: "",
    weightKg: "",
  });
  const [medicines, setMedicines] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const fetchAppt = async () => {
      try {
        const { data } = await api.get(`/appointments/${id}`);
        setAppointment(data);
        if (data.vitalsAtVisit) setVitals(data.vitalsAtVisit);
      } catch (err) {
        toast.error("Failed to load appointment");
      } finally {
        setFetching(false);
      }
    };
    fetchAppt();
  }, [id]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedReports = [...reports];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      // USE THE EXACT NAME OF THE UNSIGNED PRESET YOU JUST CREATED
      formData.append("upload_preset", "Medicareai_reports");

      try {
        // Use your specific Cloud Name in the URL
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/dcmnb3kqh/auto/upload`,
          {
            method: "POST",
            body: formData, // Do NOT add headers like Authorization or API-Key
          }
        );

        const data = await res.json();

        if (data.error) {
          throw new Error(data.error.message);
        }

        uploadedReports.push({
          reportName: file.name.split(".")[0],
          fileUrl: data.secure_url,
          publicId: data.public_id,
          status: "Analyzed",
        });
      } catch (err) {
        console.error(err);
        toast.error(`Upload failed: ${err.message}`);
      }
    }
    setReports(uploadedReports);
    setUploading(false);
  };

  const updateReport = (idx, field, val) => {
    const newReps = [...reports];
    newReps[idx][field] = val;
    setReports(newReps);
  };

  // --- MEDICINE HANDLERS ---
  const addMedicine = () => {
    setMedicines([
      ...medicines,
      {
        name: "",
        dosage: "",
        durationDays: "",
        timing: [],
        relationToFood: "After Food",
      },
    ]);
  };

  const updateMed = (idx, field, val) => {
    const newMeds = [...medicines];
    newMeds[idx][field] = val;
    setMedicines(newMeds);
  };

  const toggleTiming = (idx, time) => {
    const newMeds = [...medicines];
    const timings = newMeds[idx].timing;
    newMeds[idx].timing = timings.includes(time)
      ? timings.filter((t) => t !== time)
      : [...timings, time];
    setMedicines(newMeds);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/appointments/${id}/complete`, {
        diagnosis,
        notes,
        vitalsAtVisit: vitals,
        followUpDate,
        medicines,
        reports,
      });
      toast.success("Consultation record saved");
      navigate("/appointments");
    } catch (err) {
      toast.error("Submission failed");
    } finally {
      setLoading(false);
    }
  };

  if (fetching)
    return (
      <div className="h-screen flex items-center justify-center bg-base-100 text-primary">
        Loading Clinical Data...
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-40 space-y-8">
      {/* COMPACT TOP NAV */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-base-300 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-sm btn-ghost bg-base-200 rounded-lg"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 className="text-2xl font-black text-base-content tracking-tight">
              Visit Record: {appointment?.patient?.name}
            </h1>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || uploading}
          className="btn btn-primary rounded-xl px-12 shadow-md"
        >
          {loading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            "Save & Close"
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: MEDICAL DETAILS */}
        <div className="lg:col-span-8 space-y-6">
          {/* ASSESSMENT */}
          <div className="card bg-base-100 border border-base-300 shadow-sm rounded-2xl">
            <div className="card-body p-6">
              <h2 className="text-sm font-black uppercase opacity-50 mb-4 flex items-center gap-2">
                <Stethoscope size={16} /> Vitals & Diagnosis
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {["temp", "bp", "pulse", "weightKg"].map((k) => (
                  <div key={k} className="form-control">
                    <label className="label-text text-[10px] font-bold uppercase opacity-60 mb-1">
                      {k}
                    </label>
                    <input
                      className="input input-bordered input-sm rounded-lg bg-base-200 focus:bg-base-100"
                      value={vitals[k]}
                      onChange={(e) =>
                        setVitals({ ...vitals, [k]: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="form-control mb-4">
                <label className="label-text font-bold mb-1">
                  Final Diagnosis
                </label>
                <input
                  className="input input-bordered rounded-xl bg-base-100 border-primary/30 font-bold"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Enter primary diagnosis..."
                  required
                />
              </div>
              <div className="form-control">
                <label className="label-text font-bold mb-1">Visit Notes</label>
                <textarea
                  className="textarea textarea-bordered rounded-xl bg-base-200 h-24"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Clinical observations..."
                />
              </div>
            </div>
          </div>

          {/* PRESCRIPTION */}
          <div className="card bg-base-100 border border-base-300 shadow-sm rounded-2xl">
            <div className="card-body p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-black uppercase opacity-50 flex items-center gap-2">
                  <Pill size={16} /> Medication
                </h2>
                <button
                  type="button"
                  onClick={addMedicine}
                  className="btn btn-xs btn-primary"
                >
                  + Add New
                </button>
              </div>
              <div className="space-y-4">
                {medicines.map((m, i) => (
                  <div
                    key={i}
                    className="p-4 bg-base-200 rounded-2xl relative group border border-base-300"
                  >
                    <button
                      onClick={() =>
                        setMedicines(medicines.filter((_, idx) => idx !== i))
                      }
                      className="absolute top-2 right-2 btn btn-xs btn-circle btn-ghost text-error"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      <div className="md:col-span-1">
                        <input
                          className="input input-sm w-full bg-base-100 font-bold"
                          value={m.name}
                          onChange={(e) => updateMed(i, "name", e.target.value)}
                          placeholder="Drug Name"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <input
                          className="input input-sm w-full bg-base-100"
                          value={m.dosage}
                          onChange={(e) =>
                            updateMed(i, "dosage", e.target.value)
                          }
                          placeholder="Dosage"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <input
                          type="number"
                          className="input input-sm w-full bg-base-100"
                          value={m.durationDays}
                          onChange={(e) =>
                            updateMed(i, "durationDays", e.target.value)
                          }
                          placeholder="Days"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      <div className="flex gap-1">
                        {["Morning", "Afternoon", "Evening", "Night"].map(
                          (t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => toggleTiming(i, t)}
                              className={`btn btn-xs rounded-md ${
                                m.timing.includes(t)
                                  ? "btn-primary"
                                  : "bg-base-100"
                              }`}
                            >
                              {t[0]}
                            </button>
                          )
                        )}
                      </div>
                      <select
                        className="select select-xs select-bordered bg-base-100"
                        value={m.relationToFood}
                        onChange={(e) =>
                          updateMed(i, "relationToFood", e.target.value)
                        }
                      >
                        <option>Before Food</option>
                        <option>After Food</option>
                        <option>Early Morning</option>
                        <option>With Food</option>
                        <option>Before Sleep</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DIAGNOSTICS */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card bg-base-100 border border-base-300 shadow-sm rounded-2xl">
            <div className="card-body p-6">
              <h2 className="text-sm font-black uppercase opacity-50 mb-4 flex items-center gap-2">
                <Upload size={16} /> Diagnostics
              </h2>

              <div className="space-y-4 mb-4">
                {reports.map((r, i) => (
                  <div
                    key={i}
                    className="p-4 bg-base-200 rounded-xl border-l-4 border-primary shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-primary font-bold">
                        <FileIcon size={16} />
                        <span className="text-[10px] uppercase tracking-tighter">
                          Report #{i + 1}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setReports(reports.filter((_, idx) => idx !== i))
                        }
                        className="btn btn-xs btn-circle btn-ghost text-error"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* REPORT NAME FIELD */}
                    <div className="form-control">
                      <label className="text-[9px] font-bold uppercase opacity-50 ml-1 mb-1">
                        Report Name
                      </label>
                      <input
                        className="input input-sm bg-base-100 border-base-300 font-bold w-full"
                        value={r.reportName}
                        onChange={(e) =>
                          updateReport(i, "reportName", e.target.value)
                        }
                        placeholder="e.g. Lipid Profile"
                      />
                    </div>

                    {/* STATUS DROPDOWN (Fixed Opacity & UI) */}
                    <div className="form-control">
                      <label className="text-[9px] font-bold uppercase opacity-50 ml-1 mb-1">
                        Status
                      </label>
                      <select
                        className={`select select-sm w-full font-bold border-none ${
                          r.status === "Analyzed"
                            ? "bg-success text-success-content"
                            : "bg-warning text-warning-content"
                        }`}
                        value={r.status}
                        onChange={(e) =>
                          updateReport(i, "status", e.target.value)
                        }
                      >
                        <option
                          value="Pending"
                          className="bg-base-100 text-base-content"
                        >
                          Pending
                        </option>
                        <option
                          value="Analyzed"
                          className="bg-base-100 text-base-content"
                        >
                          Analyzed
                        </option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-base-300 rounded-2xl cursor-pointer hover:bg-base-200 transition-all">
                <Upload className="opacity-30 mb-1" size={24} />
                <span className="text-[10px] font-black uppercase opacity-40">
                  Add Files
                </span>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
              {uploading && (
                <div className="mt-2 text-center text-xs text-primary animate-pulse font-bold">
                  Uploading...
                </div>
              )}
            </div>
          </div>

          <div className="card bg-base-100 border border-base-300 shadow-sm rounded-2xl">
            <div className="card-body p-6">
              <h2 className="text-sm font-black uppercase opacity-50 mb-4 flex items-center gap-2">
                <Calendar size={16} /> Follow Up
              </h2>
              <input
                type="date"
                className="input input-bordered w-full rounded-xl bg-base-200"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalVisit;
