import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const Login = () => {
  // States
  const [role, setRole] = useState("PATIENT");
  const [email, setEmail] = useState("");
  const [mrn, setMrn] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Refs for request management
  const isSubmitting = useRef(false);
  const abortControllerRef = useRef(null);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Prevent double-submission via Ref Guard
    if (isSubmitting.current) return;

    // 2. Cancel any existing pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 3. Setup new controller and UI state
    abortControllerRef.current = new AbortController();
    isSubmitting.current = true;
    setLoading(true);
    toast.dismiss(); // Remove any previous error/success toasts

    try {
      const loginData = {
        loginId: role === "DOCTOR" ? email : mrn,
        password,
        role, // Already UPPERCASE from state
      };

      const { data } = await api.post("/users/login", loginData, {
        signal: abortControllerRef.current.signal,
      });

      // 4. Successful Login
      login(data);
      toast.success(`Welcome back, ${data.name}!`);

      // 5. Navigate based on Enum
      if (data.role === "DOCTOR") {
        navigate("/doctor-dashboard", { replace: true });
      } else {
        navigate("/patient-dashboard", { replace: true });
      }

    } catch (err) {
      // 6. Ignore errors caused by our own AbortController
      if (err.name === "CanceledError" || err.name === "AbortError") {
        return;
      }

      const errorMessage = err.response?.data?.message || "Login failed";
      toast.error(errorMessage);
      
      // 7. Reset guards ONLY on actual failure so user can try again
      isSubmitting.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-base-200 p-4 font-sans">
      {/* Fixed dimensions to prevent layout shift */}
      <div className="card w-96 h-[520px] shadow-2xl bg-base-100 border border-base-300">
        <div className="card-body flex flex-col justify-between p-8">
          <div>
            <h2 className="text-3xl font-bold text-center text-primary mb-2">
              MedicareAI
            </h2>
            <p className="text-center text-gray-500 text-sm mb-8">
              Sign in to your portal
            </p>

            {/* Role Toggle Tabs */}
            <div className="tabs tabs-boxed mb-8 flex justify-center bg-base-200 p-1">
              <button
                type="button"
                className={`tab flex-1 transition-all ${
                  role === "PATIENT" ? "tab-active !bg-primary !text-white" : ""
                }`}
                onClick={() => setRole("PATIENT")}
              >
                Patient
              </button>
              <button
                type="button"
                className={`tab flex-1 transition-all ${
                  role === "DOCTOR" ? "tab-active !bg-primary !text-white" : ""
                }`}
                onClick={() => setRole("DOCTOR")}
              >
                Doctor
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Login ID Input */}
              <div className="form-control w-full">
                <label className="label pt-0">
                  <span className="label-text font-bold uppercase text-[11px] text-gray-500">
                    {role === "DOCTOR" ? "Medical Email" : "MRN Number"}
                  </span>
                </label>
                <input
                  type={role === "DOCTOR" ? "email" : "text"}
                  placeholder={role === "DOCTOR" ? "dr.smith@hospital.com" : "MRN-12345"}
                  className="input input-bordered w-full focus:input-primary bg-base-200 border-none"
                  value={role === "DOCTOR" ? email : mrn}
                  onChange={(e) => role === "DOCTOR" ? setEmail(e.target.value) : setMrn(e.target.value)}
                  required
                />
              </div>

              {/* Password Input */}
              <div className="form-control w-full">
                <label className="label pt-0">
                  <span className="label-text font-bold uppercase text-[11px] text-gray-500">
                    Password
                  </span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input input-bordered w-full focus:input-primary bg-base-200 border-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className={`btn btn-primary w-full mt-4 text-white ${loading ? "loading" : ""}`}
                disabled={loading}
              >
                {loading ? "Verifying..." : `Login as ${role}`}
              </button>
            </form>
          </div>

          <div className="text-center space-y-3">
            {role === "DOCTOR" && (
              <p className="text-xs text-gray-500">
                New staff member?{" "}
                <Link to="/register" className="link link-primary font-bold no-underline hover:underline">
                  Register
                </Link>
              </p>
            )}
            <div className="flex items-center justify-center gap-2 opacity-40">
              <div className="h-[1px] w-8 bg-gray-400"></div>
              <p className="text-[10px] uppercase tracking-widest font-bold">Secure Access</p>
              <div className="h-[1px] w-8 bg-gray-400"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;