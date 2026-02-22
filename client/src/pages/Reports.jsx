import React, { useEffect, useState } from "react";
import { 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  User, 
  ExternalLink, 
  FileCheck2, 
  Clock 
} from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const PatientReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchReports = async () => {
    try {
      const { data } = await api.get("/reports/my-reports");
      // Sort: Newest first (Descending)
      const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReports(sorted);
    } catch (err) {
      toast.error("Failed to load medical reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  // FORCE DOWNLOAD LOGIC
  // This modifies the Cloudinary URL to include the attachment flag
  const handleDownload = (e, fileUrl, fileName) => {
    e.stopPropagation(); // Prevents any parent click events
    
    if (!fileUrl) return toast.error("File URL not found");

    // We insert 'fl_attachment' into the Cloudinary path to force download
    // Format: .../upload/fl_attachment:custom_name/...
    const sanitizedName = fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const downloadUrl = fileUrl.replace(
      "/upload/",
      `/upload/fl_attachment:${sanitizedName}/`
    );

    // Create a temporary link and trigger it
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", `${sanitizedName}.pdf`);
    link.setAttribute("target", "_blank");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredReports = reports.filter((report) =>
    report.reportName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 pb-24 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <FileText className="text-primary" size={36} /> Medical Reports
          </h1>
          <p className="opacity-60 font-medium mt-1">Manage and download your official clinical results</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={20} />
          <input 
            type="text" 
            placeholder="Search by name or doctor..." 
            className="input input-bordered w-full pl-12 rounded-[1.5rem] bg-base-100 shadow-sm focus:ring-2 focus:ring-primary/20 border-base-300 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* REPORTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => (
          <div 
            key={report._id} 
            className="group bg-base-100 border border-base-300 rounded-[2.5rem] p-7 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-2xl hover:shadow-primary/5 relative overflow-hidden"
          >
            {/* Status Decoration */}
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 blur-2xl ${
              report.status === "Analyzed" ? "bg-success" : "bg-warning"
            }`} />

            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className={`badge badge-md gap-2 font-black uppercase py-4 px-4 rounded-2xl border-none ${
                  report.status === "Analyzed" 
                  ? "bg-success/10 text-success" 
                  : "bg-warning/10 text-warning"
                }`}>
                  {report.status === "Analyzed" ? <FileCheck2 size={14}/> : <Clock size={14}/>}
                  {report.status}
                </span>
                <span className="text-[10px] font-bold opacity-20 uppercase tracking-tighter">
                  Ref: {report._id.slice(-6)}
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black leading-tight group-hover:text-primary transition-colors duration-300">
                  {report.reportName}
                </h3>
                
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm font-bold opacity-60">
                    <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center">
                      <User size={14} />
                    </div>
                    Dr. {report.doctor?.name}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold opacity-60">
                    <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center">
                      <Calendar size={14} />
                    </div>
                    {new Date(report.createdAt).toLocaleDateString(undefined, { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-base-200 flex items-center gap-3">
                <a 
                  href={report.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary flex-1 rounded-2xl gap-2 font-black shadow-lg shadow-primary/20"
                >
                  <ExternalLink size={18} /> View
                </a>
                <button 
                  onClick={(e) => handleDownload(e, report.fileUrl, report.reportName)}
                  className="btn btn-ghost bg-base-200 hover:bg-primary hover:text-white flex-none rounded-2xl px-4 transition-all duration-300"
                  title="Download to Device"
                >
                  <Download size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* EMPTY STATE */}
      {filteredReports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 bg-base-200/30 rounded-[3rem] border-2 border-dashed border-base-300 animate-pulse">
          <FileText size={80} className="opacity-10 mb-4" />
          <h2 className="text-2xl font-black opacity-30 tracking-tight">No Reports Found</h2>
          <p className="opacity-20 font-medium">Reports shared by your healthcare provider will appear here.</p>
        </div>
      )}
    </div>
  );
};

export default PatientReports;