import React, { useState } from "react";
import {
  UserPlus,
  User,
  Mail,
  Lock,
  Phone,
  Heart,
  Stethoscope,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  ShieldAlert,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuthStore } from "../store/useAuthStore";

const AddPatient = () => {
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    gender: "Male",
    bloodGroup: "",
    contactNumber: "",
    heightCm: "",
    weightKg: "",
    currentStatus: "OUT_PATIENT",
    emergencyContact: { name: "", relationship: "", phone: "" },
    allergies: [""],
    currentMedications: [{ name: "", dosage: "", timing: "" }],
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredData, setRegisteredData] = useState(null);

  const { user } = useAuthStore();
  const doctor = user;

  // Dynamic Array Handlers
  const handleAddAllergy = () =>
    setFormData({ ...formData, allergies: [...formData.allergies, ""] });
  const handleRemoveAllergy = (index) => {
    const newAllergies = formData.allergies.filter((_, i) => i !== index);
    setFormData({ ...formData, allergies: newAllergies });
  };

  const handleAddMedication = () =>
    setFormData({
      ...formData,
      currentMedications: [
        ...formData.currentMedications,
        { name: "", dosage: "", timing: "" },
      ],
    });

  const handleRemoveMedication = (index) => {
    const newMeds = formData.currentMedications.filter((_, i) => i !== index);
    setFormData({ ...formData, currentMedications: newMeds });
  };

  const handleMedChange = (index, field, value) => {
    const newMeds = [...formData.currentMedications];
    newMeds[index][field] = value;
    setFormData({ ...formData, currentMedications: newMeds });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/users/add-patient", formData);

      // Capture the data from the controller we wrote earlier
      setRegisteredData(response.data.data);
      setShowSuccessModal(true);

      toast.success("Patient successfully registered!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Check all required fields");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    // Reset form to initial state
    setFormData({
      name: "",
      email: "",
      password: "",
      age: "",
      gender: "Male",
      bloodGroup: "",
      contactNumber: "",
      heightCm: "",
      weightKg: "",
      currentStatus: "OUT_PATIENT",
      emergencyContact: { name: "", relationship: "", phone: "" },
      allergies: [""],
      currentMedications: [{ name: "", dosage: "", timing: "" }],
    });
  };

  const handlePrintCustom = (data) => {
    const printWindow = window.open("", "_blank", "width=900,height=1000");

    // Create the modern document
    printWindow.document.write(`
    <html>
      <head>
        <title>Patient Registration Slip - ${data.name}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; }
          @page { margin: 20mm; }
        </style>
      </head>
      <body class="bg-white p-8">
        <div class="flex justify-between items-start border-b-4 border-blue-600 pb-6 mb-8">
          <div>
            <h1 class="text-4xl font-extrabold text-blue-600 tracking-tight">Medicare.AI</h1>
            <p class="text-gray-500 font-semibold uppercase tracking-widest text-xs mt-1">Smart Healthcare Management</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-bold">Registration Slip</p>
            <p class="text-xs text-gray-500 uppercase">${new Date().toLocaleDateString(
              "en-GB"
            )}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-8 mb-10">
          <div>
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Patient Name</p>
            <p class="text-xl font-bold text-gray-800">${data.name}</p>
          </div>
          <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 text-right">
            <p class="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Medical Record Number (MRN)</p>
            <p class="text-2xl font-mono font-black text-blue-700">${
              data.mrn
            }</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-10">
          
          <div class="space-y-6">
            <section>
              <h3 class="text-xs font-black uppercase text-gray-400 border-b pb-1 mb-3">Patient Vitals</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-[10px] text-gray-500">Age / Gender</p>
                  <p class="font-semibold text-sm">${formData.age} Yrs / ${
      formData.gender
    }</p>
                </div>
                <div>
                  <p class="text-[10px] text-gray-500">Blood Group</p>
                  <p class="font-semibold text-sm text-red-600">${
                    formData.bloodGroup
                  }</p>
                </div>
                <div>
                  <p class="text-[10px] text-gray-500">Height / Weight</p>
                  <p class="font-semibold text-sm">${formData.heightCm} cm / ${
      formData.weightKg
    } kg</p>
                </div>
              </div>
            </section>

            <section>
              <h3 class="text-xs font-black uppercase text-gray-400 border-b pb-1 mb-3">Contact Information</h3>
              <p class="text-[10px] text-gray-500">Personal Phone</p>
              <p class="font-semibold text-sm mb-2">${
                formData.contactNumber
              }</p>
              <p class="text-[10px] text-gray-500">Login Email</p>
              <p class="font-semibold text-sm">${data.email}</p>
            </section>
          </div>

          <div class="space-y-6">
            <section class="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 class="text-xs font-black uppercase text-gray-400 mb-3">Emergency Contact</h3>
              <p class="text-[10px] text-gray-500">Guardian Name</p>
              <p class="font-semibold text-sm">${
                formData.emergencyContact.name
              } (${formData.emergencyContact.relationship})</p>
              <p class="text-[10px] text-gray-500 mt-2">Emergency Phone</p>
              <p class="font-semibold text-sm text-blue-600">${
                formData.emergencyContact.phone
              }</p>
            </section>

            <section>
              <h3 class="text-xs font-black uppercase text-gray-400 border-b pb-1 mb-3">Attending Provider</h3>
              <p class="text-[10px] text-gray-500">Doctor Name</p>
              <p class="font-semibold text-sm text-gray-800">Dr. ${
                doctor?.name
              }</p>
            </section>
          </div>

        </div>

        <div class="mt-20 pt-8 border-t border-gray-100 text-center">
          <p class="text-[10px] text-gray-400 leading-relaxed uppercase tracking-widest">
            This is a valid digital registration slip issued by Medicare.AI<br/>
            Please present this MRN for all future consultations.
          </p>
        </div>
      </body>
    </html>
  `);

    printWindow.document.close();

    // Wait for Tailwind to process and fonts to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserPlus className="text-primary" /> Register New Patient
        </h1>
        <p className="text-sm opacity-60 flex items-center gap-1">
          <Info size={14} /> All fields are required unless marked (Optional)
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* LEFT COLUMN */}
        <div className="md:col-span-1 space-y-6">
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-sm uppercase tracking-widest opacity-70">
                Account Details
              </h2>
              <div className="form-control">
                <label className="label text-primary">
                    <User size={14}/>
                  <span className="label-text font-semibold text-primary">
                    Full Name *
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="John Doe"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="form-control">
                <label className="label text-primary">
                    <Mail size={14}/>
                  <span className="label-text font-semibold text-primary">
                    Email *
                  </span>
                </label>
                <input
                  type="email"
                  className="input input-bordered"
                  placeholder="patient@mail.com"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="form-control">
                <label className="label text-primary">
                  <Lock size={14} />
                  <span className="label-text font-semibold text-primary">
                    Password *
                  </span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  className="input input-bordered"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-sm uppercase tracking-widest opacity-70">
                Contact & Vitals
              </h2>
              <div className="form-control">
                <label className="label text-primary">
                    <Phone size={14}/>
                  <span className="label-text font-semibold text-primary">
                    Phone Number *
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="+91 00000 00000"
                  required
                  value={formData.contactNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, contactNumber: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="form-control">
                  <label className="label-text mb-1">Height (cm) *</label>
                  <input
                    type="number"
                    className="input input-bordered"
                    required
                    value={formData.heightCm}
                    onChange={(e) =>
                      setFormData({ ...formData, heightCm: e.target.value })
                    }
                  />
                </div>
                <div className="form-control">
                  <label className="label-text mb-1">Weight (kg) *</label>
                  <input
                    type="number"
                    className="input input-bordered"
                    required
                    value={formData.weightKg}
                    onChange={(e) =>
                      setFormData({ ...formData, weightKg: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="md:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-sm uppercase tracking-widest opacity-70">
                Medical Profile
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="form-control">
                  <label className="label-text mb-1">Age *</label>
                  <input
                    type="number"
                    className="input input-bordered"
                    required
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({ ...formData, age: e.target.value })
                    }
                  />
                </div>
                <div className="form-control">
                  <label className="label-text mb-1">Gender *</label>
                  <select
                    className="select select-bordered"
                    required
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label-text mb-1">Blood Group *</label>
                  <input
                    type="text"
                    placeholder="O+"
                    className="input input-bordered"
                    required
                    value={formData.bloodGroup}
                    onChange={(e) =>
                      setFormData({ ...formData, bloodGroup: e.target.value })
                    }
                  />
                </div>
                <div className="form-control">
                  <label className="label-text mb-1">Status *</label>
                  <select
                    className="select select-bordered"
                    required
                    value={formData.currentStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentStatus: e.target.value,
                      })
                    }
                  >
                    <option value="OUT_PATIENT">Out Patient</option>
                    <option value="ADMITTED">Admitted</option>
                    <option value="UNDER_OBSERVATION">Observation</option>
                  </select>
                </div>
              </div>

              <div className="divider opacity-50 uppercase text-[10px] font-bold">
                Emergency Contact *
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-base-200/50 p-4 rounded-xl border border-base-300">
                <div className="form-control">
                  <label className="label-text mb-1">Guardian Name *</label>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    required
                    value={formData.emergencyContact.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          name: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="form-control">
                  <label className="label-text mb-1">Relationship *</label>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    required
                    value={formData.emergencyContact.relationship}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          relationship: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="form-control">
                  <label className="label-text mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    required
                    value={formData.emergencyContact.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          phone: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="divider opacity-50 uppercase text-[10px] font-bold">
                Health History (Optional)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* Allergies Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="label-text font-bold flex items-center gap-1">
                      <AlertCircle size={14} /> Allergies
                    </label>
                    <button
                      type="button"
                      onClick={handleAddAllergy}
                      className="btn btn-ghost btn-xs text-primary"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                  {formData.allergies.map((allergy, index) => (
                    <div
                      key={index}
                      className="flex gap-2 animate-in slide-in-from-left-2 duration-200"
                    >
                      <input
                        type="text"
                        className="input input-bordered grow input-sm"
                        placeholder="e.g. Peanuts"
                        value={allergy}
                        onChange={(e) => {
                          const updated = [...formData.allergies];
                          updated[index] = e.target.value;
                          setFormData({ ...formData, allergies: updated });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergy(index)}
                        className="btn btn-ghost btn-sm btn-square text-error"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Medications Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="label-text font-bold flex items-center gap-1">
                      <Stethoscope size={14} /> Medications
                    </label>
                    <button
                      type="button"
                      onClick={handleAddMedication}
                      className="btn btn-ghost btn-xs text-primary"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                  {formData.currentMedications.map((med, index) => (
                    <div
                      key={index}
                      className="p-3 border border-base-300 rounded-lg space-y-2 bg-base-100 animate-in slide-in-from-right-2 duration-200"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold opacity-50">
                          MED #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(index)}
                          className="text-error hover:scale-110 transition-transform"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Medicine Name"
                        className="input input-bordered input-sm w-full"
                        value={med.name}
                        onChange={(e) =>
                          handleMedChange(index, "name", e.target.value)
                        }
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Dose"
                          className="input input-bordered input-sm w-1/2"
                          value={med.dosage}
                          onChange={(e) =>
                            handleMedChange(index, "dosage", e.target.value)
                          }
                        />
                        <input
                          type="text"
                          placeholder="Timing"
                          className="input input-bordered input-sm w-1/2"
                          value={med.timing}
                          onChange={(e) =>
                            handleMedChange(index, "timing", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary px-12 shadow-lg shadow-primary/30"
            >
              {loading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                <Save size={18} />
              )}
              Register Patient
            </button>
          </div>
        </div>
      </form>
      {/* Success Dialog */}
      {showSuccessModal && registeredData && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md border-t-4 border-success">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center">
                <Save size={32} />
              </div>
              <h3 className="font-bold text-xl">Registration Successful!</h3>
              <p className="text-sm opacity-70">
                The patient has been added to your records and an account has
                been created.
              </p>
            </div>

            <div className="bg-base-200 p-4 rounded-xl mt-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase font-bold opacity-50">
                  Patient Name
                </span>
                <span className="font-semibold">{registeredData.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase font-bold opacity-50">
                  MRN Number
                </span>
                <span className="badge badge-primary font-mono py-3">
                  {registeredData.mrn}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase font-bold opacity-50">
                  Login Email
                </span>
                <span className="text-sm italic">{registeredData.email}</span>
              </div>
            </div>

            <div className="modal-action flex-col gap-2">
              <button
                className="btn btn-primary w-full"
                onClick={() => {
                  resetForm();
                  setShowSuccessModal(false);
                }}
              >
                Done
              </button>
              <button
                className="btn btn-ghost btn-sm text-xs"
                onClick={() => handlePrintCustom(registeredData)}
              >
                Print Patient Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddPatient;
