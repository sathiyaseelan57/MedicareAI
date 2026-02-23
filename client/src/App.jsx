import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";

// Components & Pages
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AddPatient from "./pages/AddPatient";
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

const NotFound = () => (
  <div className="p-8 text-center">
    <h1>404 - Page Not Found</h1>
  </div>
);

// --- PROTECTED ROUTE WRAPPER ---
const ProtectedRoute = ({ allowedRole }) => {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRole && user?.role !== allowedRole)
    return <Navigate to="/" replace />;
  return <Layout />; // This renders the shell for all sub-routes
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
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />

      <Routes>
        {/* Root Logic */}
        <Route
          path="/"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : user.role === "DOCTOR" ? (
              <Navigate to="/doctor-dashboard" replace />
            ) : (
              <Navigate to="/patient-dashboard" replace />
            )
          }
        />

        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* --- SHARED PROTECTED ROUTES (Both Doctor & Patient) --- */}
        <Route
          element={<ProtectedRoute allowedRoles={["DOCTOR", "PATIENT"]} />}
        >
          <Route path="/appointments/create" element={<CreateAppointment />} />
        </Route>

        {/* --- DOCTOR ONLY ROUTES --- */}
        <Route element={<ProtectedRoute allowedRole="DOCTOR" />}>
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/add-patient" element={<AddPatient />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/clinical-visit/:id" element={<ClinicalVisit />} />
          <Route path="/doctor-profile" element={<Profile />} />
          <Route path="/patient-details/:id" element={<PatientDetails />} />
        </Route>

        {/* --- PATIENT ONLY ROUTES --- */}
        <Route element={<ProtectedRoute allowedRole="PATIENT" />}>
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/view-appointments" element={<PatientAppointments />} />
          <Route path="/appointment/:id" element={<AppointmentSummary />} />
          <Route path="/prescriptions" element={<Prescriptions />} />
          <Route path="/patient-profile" element={<Profile />} />
          <Route path="/reports" element={<PatientReports />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
