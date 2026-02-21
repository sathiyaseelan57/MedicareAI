/* eslint-disable no-unused-vars */
import { create } from "zustand";
import api from "../api/axios";

// 1. Create a helper to handle the "undefined" edge case
const getInitialUser = () => {
  try {
    const item = localStorage.getItem("user");
    // Check if item is null, or the literal string "undefined"
    if (!item || item === "undefined") return null;
    return JSON.parse(item);
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return null;
  }
};

export const useAuthStore = create((set) => ({
  // 2. Use the helper instead of raw JSON.parse
  user: getInitialUser(),
  profileDetails: null,
  isAuthenticated: !!getInitialUser(),
  isCheckingAuth: true, // New loading state

  // Function to call on app start
  checkAuth: async () => {
    try {
      const { data } = await api.get("/users/profile");
      set({
        user: data.user,
        profileDetails: data,
        isAuthenticated: true,
        isCheckingAuth: false,
      });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isCheckingAuth: false });
    }
  },

  login: (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    set({ user: userData, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("user");
    set({ user: null, isAuthenticated: false });
  },
}));
