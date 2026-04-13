import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";

// Components & Pages
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AddPatient from "./pages/AddPatient";
import AdminDashboard from "./pages/AdminDashboard";
import Appointments from "./pages/Appointments";
import CreateAppointment from "./pages/CreateAppointment";
import ClinicalVisit from "./pages/ClinicalVisit";
import AppointmentSummary from "./pages/AppointmentSummary";
import PatientAppointments from "./pages/PatientAppointments";
import Prescriptions from "./pages/Prescriptions";
import Profile from "./pages/Profile";
import PatientReports from "./pages/Reports";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientDetails from "./pages/PatientDetails";
import PatientChatbot from "./components/PatientChatbot"; // Import the chatbot component

const NotFound = () => (
  <div className="flex h-screen flex-col items-center justify-center bg-base-200">
    <h1 className="text-4xl font-black text-primary">404</h1>
    <p className="text-sm opacity-50 uppercase font-bold tracking-widest">
      Page Not Found
    </p>
    <button
      onClick={() => window.history.back()}
      className="btn btn-ghost mt-4"
    >
      Go Back
    </button>
  </div>
);

// --- PROTECTED ROUTE WRAPPER ---
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return <Layout />;
};

// --- PUBLIC ROUTE WRAPPER ---
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

function App() {
  const { user, checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-200">
        <span className="loading loading-infinity loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: "1rem",
            background: "#1f2937",
            color: "#fff",
            fontSize: "14px",
            fontWeight: "bold",
          },
        }}
      />

      <Routes>
        {/* --- ROOT REDIRECTION LOGIC --- */}
        <Route
          path="/"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : user.role === "ADMIN" ? (
              <Navigate to="/admin-dashboard" replace />
            ) : user.role === "DOCTOR" ? (
              <Navigate to="/doctor-dashboard" replace />
            ) : (
              <Navigate to="/patient-dashboard" replace />
            )
          }
        />

        {/* --- PUBLIC ACCESS --- */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* --- ADMIN ONLY ROUTES --- */}
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/add-patient" element={<AddPatient />} />
        </Route>

        {/* --- DOCTOR & ADMIN SHARED ACCESS --- */}
        <Route element={<ProtectedRoute allowedRoles={["DOCTOR", "ADMIN"]} />}>
          <Route path="/appointments/create" element={<CreateAppointment />} />
        </Route>

        {/* --- DOCTOR ONLY ROUTES --- */}
        <Route element={<ProtectedRoute allowedRoles={["DOCTOR"]} />}>
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/clinical-visit/:id" element={<ClinicalVisit />} />
          <Route path="/doctor-profile" element={<Profile />} />
          <Route path="/patient-details/:id" element={<PatientDetails />} />
        </Route>

        {/* --- PATIENT ONLY ROUTES --- */}
        <Route element={<ProtectedRoute allowedRoles={["PATIENT"]} />}>
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/view-appointments" element={<PatientAppointments />} />
          <Route path="/appointment/:id" element={<AppointmentSummary />} />
          <Route path="/prescriptions" element={<Prescriptions />} />
          <Route path="/patient-profile" element={<Profile />} />
          <Route path="/reports" element={<PatientReports />} />
        </Route>

        {/* --- 404 CATCH-ALL --- */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* --- GLOBAL PATIENT CHATBOT --- */}
      {/* This renders the chatbot on every page if the user is a patient */}
      {user?.role === "PATIENT" && (
        <div className="fixed bottom-6 right-6 z-[9999]">
          <PatientChatbot />
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;