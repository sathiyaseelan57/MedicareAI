import React, { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import {
  LayoutDashboard,
  Calendar,
  Bot,
  FileText,
  UserCircle,
  Menu,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
  UserPlus,
} from "lucide-react";

const Layout = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [theme, setTheme] = useState(
    localStorage.getItem("app-theme") || "light"
  );
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("app-theme", newTheme);
  }; // This is a comment

  const navLinks =
    user?.role === "DOCTOR"
      ? [
          {
            name: "Dashboard",
            path: "/doctor-dashboard",
            icon: <LayoutDashboard size={20} />,
          },
          {
            name: "Add Patient",
            path: "/add-patient",
            icon: <UserPlus size={20} />,
          },
          {
            name: "Appointments",
            path: "/appointments",
            icon: <Calendar size={20} />,
          },
          {
            name: "AI Assistant",
            path: "/ai-assistant",
            icon: <Bot size={20} />,
          },
          {
            name: "My Reports",
            path: "/reports",
            icon: <ClipboardList size={20} />,
          },
          { name: "Profile", path: "/doctor-profile", icon: <UserCircle size={20} /> },
        ]
      : [
          {
            name: "Dashboard",
            path: "/patient-dashboard",
            icon: <LayoutDashboard size={20} />,
          },
          {
            name: "Appointments",
            path: "/view-appointments",
            icon: <Calendar size={20} />,
          },
          {
            name: "AI Assistant",
            path: "/ai-assistant",
            icon: <Bot size={20} />,
          },
          {
            name: "Prescriptions",
            path: "/prescriptions",
            icon: <FileText size={20} />,
          },
          {
            name: "My Reports",
            path: "/reports",
            icon: <ClipboardList size={20} />,
          },
          { name: "Profile", path: "/patient-profile", icon: <UserCircle size={20} /> },
        ];

  return (
    <div className="drawer lg:drawer-open font-['DM_Sans']">
      <input id="my-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col min-h-screen transition-all duration-300 bg-base-200">
        {/* TOP NAVBAR */}
        <header className="navbar bg-base-100/60 backdrop-blur-md border-b border-base-300 px-4 h-16 sticky top-0 z-[40] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label
              htmlFor="my-drawer"
              className="btn btn-ghost btn-circle lg:hidden"
            >
              <Menu size={22} />
            </label>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="btn btn-ghost btn-circle hidden lg:flex"
            >
              {isCollapsed ? (
                <PanelLeftOpen size={20} />
              ) : (
                <PanelLeftClose size={20} />
              )}
            </button>

            <h1 className="text-md font-bold text-base-content/60 uppercase tracking-widest ml-2">
              {navLinks.find((link) => link.path === location.pathname)?.name ||
                "MedicareAI"}
            </h1>
          </div>

          <div className="flex items-center gap-1">
            <div className="hidden sm:flex flex-col items-end mr-3">
              <span className="text-xs font-bold">{user?.name}</span>
              <span className="text-[10px] text-primary font-bold uppercase">
                {user?.role}
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className="btn btn-ghost btn-circle hover:bg-base-300 transition-colors"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button
              onClick={logout}
              className="btn btn-ghost btn-circle text-error hover:bg-error/10"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* PAGE CONTENT - This renders the nested routes */}
        <main className="p-4 md:p-6 lg:p-6 flex-1">
          <Outlet />
        </main>
      </div>

      {/* SIDEBAR DRAWER */}
      <div className="drawer-side z-[100]">
        <label htmlFor="my-drawer" className="drawer-overlay"></label>
        <aside
          className={`bg-base-100 h-full border-r border-base-300 flex flex-col transition-all duration-300 shadow-xl ${
            isCollapsed ? "lg:w-20 w-64" : "w-64"
          }`}
        >
          {/* Sidebar Header */}
          <div
            className={`p-6 border-b border-base-300 h-16 flex items-center bg-base-100 ${
              isCollapsed ? "lg:justify-center" : "justify-start"
            }`}
          >
            <Link
              to="/"
              className="flex items-center gap-2 font-black text-primary"
            >
              <span className="text-2xl min-w-[32px]">🩺</span>
              <span
                className={`text-xl tracking-tight transition-opacity duration-300 ${
                  isCollapsed ? "lg:hidden block" : "block"
                }`}
              >
                Medicare.AI
              </span>
            </Link>
          </div>

          {/* Nav Links */}
          <ul className="menu p-3 gap-2 flex-1 overflow-hidden items-start pl-4">
            <li
              className={`menu-title opacity-40 uppercase text-[10px] tracking-widest mb-2 px-4 ${
                isCollapsed ? "lg:hidden block" : "block"
              }`}
            >
              General
            </li>

            {navLinks.map((link) => (
              <li
                key={link.path}
                className={`w-full ${
                  isCollapsed ? "lg:tooltip lg:tooltip-right" : ""
                } z-1000`}
                data-tip={link.name}
              >
                <Link
                  to={link.path}
                  className={`flex items-center rounded-lg transition-all h-11 w-full ${
                    isCollapsed ? "lg:justify-center lg:px-3" : "px-4 gap-4"
                  } ${
                    location.pathname === link.path
                      ? "bg-primary text-primary-content font-bold shadow-md shadow-primary/20"
                      : "hover:bg-base-200 text-base-content/80"
                  }`}
                >
                  <span className="flex-shrink-0">{link.icon}</span>
                  <span
                    className={`flex-1 truncate ${
                      isCollapsed ? "lg:hidden block" : "block"
                    }`}
                  >
                    {link.name}
                  </span>
                  {!isCollapsed && location.pathname === link.path && (
                    <ChevronRight size={14} className="opacity-50" />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {/* Footer */}
          <div
            className={`p-4 border-t border-base-300 bg-base-200/20 ${
              isCollapsed ? "lg:items-center" : "items-start"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="avatar">
                <div className="w-9 rounded-lg bg-primary text-primary-content flex items-center justify-center font-bold">
                  {user?.name?.[0]}
                </div>
              </div>
              <div
                className={`flex flex-col truncate ${
                  isCollapsed ? "lg:hidden block" : "block"
                }`}
              >
                <span className="text-sm font-bold truncate leading-none">
                  {user?.name}
                </span>
                <span className="text-[10px] opacity-50 font-bold uppercase mt-1">
                  Status: Online
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Layout;
