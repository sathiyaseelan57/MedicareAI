import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "DOCTOR",
    code: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/users", formData);
      toast.success("Doctor account created successfully!");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md shadow-2xl bg-base-100">
        <form className="card-body" onSubmit={handleSubmit}>
          <div className="flex flex-col items-center mb-4">
            <span className="text-4xl">👨‍⚕️</span>
            <h2 className="text-2xl font-bold text-primary">
              Doctor Registration
            </h2>
            <p className="text-sm text-gray-500">
              Enter hospital credentials to join
            </p>
          </div>

          <div className="form-control">
            <label className="label w-1/5">
              <span className="label-text">Full Name</span>
            </label>
            <input
              type="text"
              placeholder="Dr. John Doe"
              className="input input-bordered"
              required
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="form-control">
            <label className="label w-1/5">
              <span className="label-text">Email</span>
            </label>
            <input
              type="email"
              placeholder="john.doe@hospital.com"
              className="input input-bordered"
              required
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className="form-control">
            <label className="label w-1/5">
              <span className="label-text">Password</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="input input-bordered"
              required
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>

          <div className="form-control border-t border-base-300 mt-4 pt-4">
            <label className="label w-1/5">
              <span className="label-text font-bold text-error">Code</span>
            </label>
            <input
              type="text"
              placeholder="Enter Secret Code"
              className="input input-bordered border-error"
              required
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
            />
          </div>

          <div className="form-control mt-6 flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                "Register as Doctor"
              )}
            </button>
          </div>

          <p className="text-center mt-4 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="link link-primary">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
