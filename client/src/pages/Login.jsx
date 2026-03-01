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
  const [secretCode, setSecretCode] = useState(""); // New state for Admin
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

    if (isSubmitting.current) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    isSubmitting.current = true;
    setLoading(true);
    toast.dismiss();

    try {
      const loginData = {
        // Use email for DOCTOR/ADMIN, mrn for PATIENT
        loginId: role === "PATIENT" ? mrn : email,
        password,
        role,
        ...(role === "ADMIN" && { secretCode }), // Only add secretCode if Admin
      };

      const { data } = await api.post("/users/login", loginData, {
        signal: abortControllerRef.current.signal,
      });

      login(data);
      toast.success(`Welcome back, ${data.name}!`);

      // Navigation Logic
      if (data.role === "DOCTOR") {
        navigate("/doctor-dashboard", { replace: true });
      } else if (data.role === "ADMIN") {
        navigate("/admin-dashboard", { replace: true });
      } else {
        navigate("/patient-dashboard", { replace: true });
      }
    } catch (err) {
      if (err.name === "CanceledError" || err.name === "AbortError") return;

      const errorMessage = err.response?.data?.message || "Login failed";
      toast.error(errorMessage);

      isSubmitting.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-base-200 p-4 font-sans">
      {/* Increased height slightly to 580px to accommodate Secret Code field */}
      <div className="card w-96 min-h-[540px] shadow-2xl bg-base-100 border border-base-300">
        <div className="card-body flex flex-col justify-between p-8">
          <div>
            <h2 className="text-3xl font-bold text-center text-primary mb-2">
              MedicareAI
            </h2>
            <p className="text-center text-gray-500 text-sm mb-6">
              Sign in to your portal
            </p>

            {/* Role Toggle Tabs - Updated for 3 roles */}
            <div className="tabs tabs-boxed mb-6 flex justify-center bg-base-200 p-1">
              {["PATIENT", "DOCTOR", "ADMIN"].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`tab flex-1 transition-all text-[11px] font-bold ${
                    role === r ? "tab-active !bg-primary !text-white" : ""
                  }`}
                  onClick={() => setRole(r)}
                >
                  {r}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Login ID Input */}
              <div className="form-control w-full">
                <label className="label pt-0">
                  <span className="label-text font-bold uppercase text-[10px] text-gray-500">
                    {role === "PATIENT"
                      ? "MRN Number"
                      : "Administrator/Staff Email"}
                  </span>
                </label>
                <input
                  type={role === "PATIENT" ? "text" : "email"}
                  placeholder={
                    role === "PATIENT" ? "MRN-12345" : "admin@medicare.com"
                  }
                  className="input input-bordered w-full focus:input-primary bg-base-200 border-none h-10 text-sm"
                  value={role === "PATIENT" ? mrn : email}
                  onChange={(e) =>
                    role === "PATIENT"
                      ? setMrn(e.target.value)
                      : setEmail(e.target.value)
                  }
                  required
                />
              </div>

              {/* Password Input */}
              <div className="form-control w-full">
                <label className="label pt-0">
                  <span className="label-text font-bold uppercase text-[10px] text-gray-500">
                    Password
                  </span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input input-bordered w-full focus:input-primary bg-base-200 border-none h-10 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Secret Code Input - ONLY VISIBLE FOR ADMIN */}
              {role === "ADMIN" && (
                <div className="form-control w-full animate-in fade-in slide-in-from-top-2">
                  <label className="label pt-0">
                    <span className="label-text font-bold uppercase text-[10px] text-error">
                      Admin Secret Code
                    </span>
                  </label>
                  <input
                    type="password"
                    placeholder="Enter security key"
                    className="input input-bordered w-full border-error/30 focus:border-error bg-error/5 h-10 text-sm"
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value)}
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className={`btn btn-primary w-full mt-2 text-white h-10 min-h-0 ${
                  loading ? "loading" : ""
                }`}
                disabled={loading}
              >
                {loading ? "Verifying..." : `Login as ${role}`}
              </button>
            </form>
          </div>

          <div className="text-center space-y-3 mt-4">
            {role === "DOCTOR" && (
              <p className="text-xs text-gray-500">
                New staff member?{" "}
                <Link
                  to="/register"
                  className="link link-primary font-bold no-underline hover:underline"
                >
                  Register
                </Link>
              </p>
            )}
            <div className="flex items-center justify-center gap-2 opacity-30">
              <div className="h-[1px] w-8 bg-gray-400"></div>
              <p className="text-[9px] uppercase tracking-widest font-bold">
                Encrypted Session
              </p>
              <div className="h-[1px] w-8 bg-gray-400"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
