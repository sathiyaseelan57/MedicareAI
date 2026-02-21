import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Search,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Plus,
  Eye,
  ChevronRight,
} from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <p className="text-2xl font-mono font-bold text-base-content tabular-nums">
      {time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
    </p>
  );
};

const Appointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("scheduled");

  const todayStr = new Date().toISOString().split("T")[0];
  const [dateRange, setDateRange] = useState({
    start: todayStr,
    end: todayStr,
  });

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/appointments?start=${dateRange.start}&end=${dateRange.end}`
      );
      setAppointments(data);
    } catch (err) {
      toast.error("Failed to sync schedule");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [dateRange]);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Completed":
        return "bg-success/20 text-success border-success/30";
      case "Cancelled":
        return "bg-error/20 text-error border-error/30";
      default:
        return "bg-primary/20 text-primary border-primary/30";
    }
  };

  const filtered = appointments.filter((a) =>
    a.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const scheduledApps = filtered.filter((a) => a.status === "Scheduled");
  const historyApps = filtered.filter((a) => a.status !== "Scheduled");
  const displayList = activeTab === "scheduled" ? scheduledApps : historyApps;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-base-content/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary text-primary-content rounded-xl shadow-md">
            <Calendar size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-base-content tracking-tight">
              Schedule
            </h1>
            <p className="text-sm font-medium opacity-60">
              Manage your clinical consultations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold opacity-50 uppercase tracking-widest mb-1">
              Live Clock
            </p>
            <LiveClock />
          </div>
          <Link to="/appointments/create" className="w-full sm:w-auto">
            <button className="btn btn-primary btn-md md:btn-lg rounded-xl shadow-lg w-full gap-2">
              <Plus size={20} /> <span className="text-base">Book Visit</span>
            </button>
          </Link>
        </div>
      </div>

      {/* FILTER & TAB BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-base-200/50 p-3 rounded-2xl border border-base-300">
        <div className="tabs tabs-boxed bg-base-300 p-1 rounded-xl flex-none">
          <button
            onClick={() => setActiveTab("scheduled")}
            className={`tab tab-lg flex-1 md:flex-none font-bold transition-all ${
              activeTab === "scheduled"
                ? "tab-active !bg-primary !text-primary-content shadow-md"
                : "text-base-content/60"
            }`}
          >
            Scheduled ({scheduledApps.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`tab tab-lg flex-1 md:flex-none font-bold transition-all ${
              activeTab === "history"
                ? "tab-active !bg-primary !text-primary-content shadow-md"
                : "text-base-content/60"
            }`}
          >
            History ({historyApps.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-base-100 p-2 rounded-xl border border-base-300 flex-1 md:flex-none">
            <input
              type="date"
              className="bg-transparent text-sm font-bold focus:outline-none"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
            />
            <ChevronRight size={14} className="opacity-30" />
            <input
              type="date"
              className="bg-transparent text-sm font-bold focus:outline-none"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
            />
          </div>

          <div className="relative flex-1 md:w-64">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40"
            />
            <input
              type="text"
              placeholder="Search patients..."
              className="input input-bordered input-md pl-10 w-full rounded-xl bg-base-100 font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="bg-base-100 border border-base-300 rounded-2xl shadow-sm overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto overflow-y-visible">
          <table className="table table-lg w-full">
            <thead className="bg-base-200 text-base-content/70">
              <tr>
                <th className="py-5 font-bold text-sm uppercase">Patient</th>
                <th className="font-bold text-sm uppercase">Time</th>
                <th className="font-bold text-sm uppercase">Reason</th>
                <th className="font-bold text-sm uppercase">Status</th>
                <th className="text-right font-bold text-sm uppercase pr-10">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-300">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-20">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                  </td>
                </tr>
              ) : displayList.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-20 opacity-50 italic text-lg font-medium"
                  >
                    No records found for this period.
                  </td>
                </tr>
              ) : (
                displayList.map((app) => (
                  <tr
                    key={app._id}
                    className="hover:bg-base-200/40 transition-colors"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg border border-primary/20">
                          {app.patient?.name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-lg text-base-content leading-tight">
                            {app.patient?.name}
                          </div>
                          <div className="text-xs opacity-50 font-bold uppercase tracking-wider">
                            {app.patient?.email?.split("@")[0]}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="font-bold text-base text-primary">
                      {new Date(app.appointmentDate).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      <div className="text-[10px] text-base-content/40 font-bold uppercase tracking-tighter">
                        {new Date(app.appointmentDate).toLocaleDateString(
                          "en-GB",
                          { day: "numeric", month: "short" }
                        )}
                      </div>
                    </td>
                    <td className="text-sm opacity-70 font-medium max-w-[200px] truncate italic">
                      "{app.reason}"
                    </td>
                    <td>
                      <span
                        className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase border ${getStatusStyle(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="text-right pr-10">
                      <details className="dropdown dropdown-left dropdown-end">
                        <summary className="btn btn-ghost btn-circle list-none cursor-pointer hover:bg-base-300">
                          <MoreVertical size={20} />
                        </summary>
                        <ul className="dropdown-content z-[100] menu p-2 shadow-2xl bg-base-100 border border-base-300 rounded-xl w-56 mt-2">
                          {app.status === "Scheduled" ? (
                            <>
                              <li>
                                <button
                                  onClick={() =>
                                    navigate(`/clinical-visit/${app._id}`)
                                  }
                                  className="text-success text-sm font-bold py-3 hover:bg-success/10"
                                >
                                  <CheckCircle2 size={18} /> Complete Visit
                                </button>
                              </li>
                              <li>
                                <button className="text-error text-sm font-bold py-3 hover:bg-error/10">
                                  <XCircle size={18} /> Cancel Visit
                                </button>
                              </li>
                            </>
                          ) : (
                            <li>
                              <button
                                onClick={() => navigate(`/summary/${app._id}`)}
                                className="text-sm font-bold py-3 hover:bg-primary/10"
                              >
                                <Eye size={18} /> View Summary
                              </button>
                            </li>
                          )}
                        </ul>
                      </details>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View (Card Layout) */}
        <div className="md:hidden divide-y divide-base-300">
          {displayList.map((app) => (
            <div key={app._id} className="p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary text-primary-content flex items-center justify-center font-bold text-sm">
                    {app.patient?.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-base-content">
                      {app.patient?.name}
                    </h3>
                    <p className="text-xs font-bold text-primary">
                      {new Date(app.appointmentDate).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div
                  className={`px-2 py-0.5 rounded text-[10px] font-black border ${getStatusStyle(
                    app.status
                  )}`}
                >
                  {app.status}
                </div>
              </div>
              <p className="text-sm opacity-70 italic line-clamp-2">
                "{app.reason}"
              </p>
              <div className="flex gap-2 mt-2">
                {app.status === "Scheduled" ? (
                  <>
                    <button
                      onClick={() => navigate(`/clinical-visit/${app._id}`)}
                      className="btn btn-sm btn-success flex-1 rounded-lg font-bold"
                    >
                      Complete
                    </button>
                    <button className="btn btn-sm btn-outline btn-error rounded-lg font-bold">
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => navigate(`/summary/${app._id}`)}
                    className="btn btn-sm btn-outline w-full rounded-lg font-bold text-primary"
                  >
                    View Summary
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Appointments;
