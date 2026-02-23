import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Calendar,
  User,
  Activity,
  Clock,
  AlertCircle,
  Stethoscope,
  ClipboardList,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const PatientDashboard = () => {
  const [data, setData] = useState(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    const formattedDate = viewDate.toISOString().split("T")[0];
    try {
      const res = await api.get(
        `/users/patient-dashboard?date=${formattedDate}`
      );
      setData(res.data);
    } catch (err) {
      toast.error("Dashboard sync failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [viewDate]);

  const handleLog = async (pId, medName, time) => {
    // Only allow logging for today (prevent logging future/past from this button)
    const isToday = new Date().toDateString() === viewDate.toDateString();
    if (!isToday) return toast.error("You can only log medications for today");

    try {
      await api.post("/prescriptions/log-medication", {
        prescription: pId,
        medicineName: medName,
        timing: time,
        date: viewDate,
        status: "Taken",
      });
      toast.success(`${medName} logged!`);
      fetchDashboard();
    } catch (err) {
      toast.error("Failed to update log");
    }
  };

  if (loading || !data)
    return (
      <div className="h-screen flex items-center justify-center bg-base-300">
        <span className="loading loading-infinity loading-lg text-primary"></span>
      </div>
    );

  return (
    <div className="min-h-screen bg-base-200/50 pb-20 transition-colors duration-500">
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        {/* TOP SECTION: WELCOME & ADHERENCE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 relative overflow-hidden bg-primary rounded-[2.5rem] p-8 text-primary-content shadow-2xl shadow-primary/20">
            <div className="relative z-10">
              <h1 className="text-4xl font-black tracking-tight">
                How's your health, today?
              </h1>
              <p className="mt-2 opacity-90 font-medium max-w-md">
                You have{" "}
                {data.logs.filter((l) => l.status === "Pending").length}{" "}
                medications remaining for today.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <div className="badge badge-lg py-5 px-6 bg-white/10 border-none backdrop-blur-md gap-2 rounded-2xl">
                  <Calendar size={18} />
                  <span>
                    Next:{" "}
                    {data.nextFollowUp
                      ? new Date(data.nextFollowUp).toLocaleDateString()
                      : "No follow-up"}
                  </span>
                </div>
                <div className="badge badge-lg py-5 px-6 bg-white/10 border-none backdrop-blur-md gap-2 rounded-2xl">
                  <User size={18} />
                  <span>Dr. {data.assignedDoctor?.name}</span>
                </div>
              </div>
            </div>
            <TrendingUp className="absolute -right-8 -bottom-8 w-64 h-64 opacity-10 rotate-12" />
          </div>

          <div className="bg-base-100 dark:bg-neutral rounded-[2.5rem] p-8 flex flex-col items-center justify-center border border-base-300 shadow-xl">
            <div
              className="radial-progress text-primary"
              style={{
                "--value": data.adherenceScore,
                "--size": "10rem",
                "--thickness": "12px",
              }}
            >
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black">
                  {data.adherenceScore}%
                </span>
                <span className="text-[10px] uppercase font-bold opacity-50 tracking-widest">
                  Score
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* WEEK SELECTOR STRIP */}
        <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
          {[...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const isActive = d.toDateString() === viewDate.toDateString();
            return (
              <button
                key={i}
                onClick={() => setViewDate(d)}
                className={`flex-none w-20 py-4 rounded-[2rem] flex flex-col items-center transition-all duration-300 border
                ${
                  isActive
                    ? "bg-primary border-primary text-primary-content shadow-lg shadow-primary/30 scale-105"
                    : "bg-base-100 border-base-300 hover:border-primary/50"
                }`}
              >
                <span
                  className={`text-[10px] font-black uppercase mb-1 ${
                    isActive ? "opacity-70" : "opacity-40"
                  }`}
                >
                  {d.toLocaleDateString("en", { weekday: "short" })}
                </span>
                <span className="text-xl font-black">{d.getDate()}</span>
              </button>
            );
          })}
        </div>

        {/* MAIN CONTENT: MEDS & VITALS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: MEDICATION TRACKER */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-2xl font-black flex items-center gap-3">
                <Clock className="text-primary" /> Today's Schedule
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.logs.length > 0 ? (
                data.logs.map((log, i) => {
                  const isTaken = log.status === "Taken";
                  const isMissed = log.status === "Missed";
                  const isPending = log.status === "Pending";

                  return (
                    <div
                      key={i}
                      className={`relative overflow-hidden p-6 rounded-[2.5rem] border transition-all duration-300 bg-base-100
                      ${isTaken ? "border-emerald-500/30 bg-emerald-50/5" : ""}
                      ${isMissed ? "border-rose-500/30 bg-rose-50/5" : ""}
                      ${isPending ? "border-base-300" : ""}
                    `}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div
                          className={`p-3 rounded-2xl ${
                            isTaken
                              ? "bg-emerald-500/10 text-emerald-500"
                              : isMissed
                              ? "bg-rose-500/10 text-rose-500"
                              : "bg-base-200 opacity-50"
                          }`}
                        >
                          <Clock size={20} />
                        </div>
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full 
                        ${
                          isTaken
                            ? "bg-emerald-500 text-white"
                            : isMissed
                            ? "bg-rose-500 text-white"
                            : "bg-base-300 opacity-50"
                        }`}
                        >
                          {log.timing}
                        </span>
                      </div>

                      <h4
                        className={`text-xl font-bold ${
                          isTaken ? "opacity-40 line-through" : ""
                        }`}
                      >
                        {log.medicineName}
                      </h4>
                      <p className="text-sm opacity-50 mb-6 font-medium">
                        Daily dose required
                      </p>

                      {isPending ? (
                        <button
                          onClick={() =>
                            handleLog(
                              log.prescription,
                              log.medicineName,
                              log.timing
                            )
                          }
                          className="btn btn-block btn-primary rounded-2xl normal-case font-bold group"
                        >
                          Mark as Taken
                          <ChevronRight
                            size={18}
                            className="group-hover:translate-x-1 transition-transform"
                          />
                        </button>
                      ) : (
                        <div
                          className={`flex items-center gap-2 font-black text-sm ${
                            isTaken ? "text-emerald-500" : "text-rose-500"
                          }`}
                        >
                          {isTaken ? (
                            <CheckCircle2 size={18} />
                          ) : (
                            <AlertCircle size={18} />
                          )}
                          {isTaken ? "COMPLETED" : "MISSED DOSE"}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-12 text-center bg-base-100 rounded-[2.5rem] border border-dashed border-base-300">
                  <p className="opacity-30 font-bold italic">
                    No medications scheduled for this date.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: VITALS & NOTES */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-base-100 rounded-[2.5rem] p-8 border border-base-300 shadow-sm space-y-6">
              <h3 className="text-xl font-black flex items-center gap-3">
                <Stethoscope className="text-secondary" /> Recent Vitals
              </h3>
              <div className="space-y-4">
                {/* Example Vitals - mapped from data.lastAppointment.vitalsAtVisit if available */}
                <div className="flex justify-between items-center p-4 bg-base-200 rounded-2xl">
                  <span className="text-sm font-bold opacity-50">BP</span>
                  <span className="font-black text-lg">120/80</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-base-200 rounded-2xl">
                  <span className="text-sm font-bold opacity-50">
                    Heart Rate
                  </span>
                  <span className="font-black text-lg">72 bpm</span>
                </div>
              </div>

              <div className="divider"></div>

              <h3 className="text-xl font-black flex items-center gap-3">
                <ClipboardList className="text-accent" /> Doctor's Note
              </h3>
              <div className="p-4 bg-amber-50/10 border border-amber-500/20 rounded-2xl">
                <p className="text-sm opacity-80 leading-relaxed italic">
                  "Ensure you take the medication exactly after food to avoid
                  stomach irritation."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
