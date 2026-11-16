import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  ChartNoAxesColumnIncreasing,
  UserRound,
  Settings,
  GraduationCap,
  LogOut,
  X,
  Loader2,
} from "lucide-react";

import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navigationItems = [
    {
      title: "MAIN MENU",
      items: [
        {
          name: "Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          name: "My Subjects",
          path: "/subjects",
          icon: BookOpen,
        },
        {
          name: "My Timetable",
          path: "/timetable",
          icon: CalendarDays,
        },
        {
          name: "Attendance",
          path: "/attendance",
          icon: ClipboardCheck,
        },
        {
          name: "Reports",
          path: "/reports",
          icon: ChartNoAxesColumnIncreasing,
        },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        {
          name: "My Profile",
          path: "/profile",
          icon: UserRound,
        },
        {
          name: "Settings",
          path: "/settings",
          icon: Settings,
        },
      ],
    },
  ];

  // Logout Function
  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);

      onClose?.();

      await logout();

      toast.success("Logged out successfully!");

      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Sidebar Logout Error:", error);

      toast.error(
        "Your local session was cleared, but the server could not confirm logout.",
      );

      // AuthContext clears local authentication in finally.
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <GraduationCap size={23} />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                SmartAttend
              </h1>

              <p className="text-[10px] font-medium tracking-wider text-slate-400">
                STUDENT PORTAL
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {navigationItems.map((section) => (
            <div key={section.title} className="mb-8">
              <p className="mb-3 px-3 text-[10px] font-bold tracking-[1.5px] text-slate-400">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold transition-all ${
                          isActive
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon size={19} strokeWidth={isActive ? 2.3 : 1.8} />

                          <span>{item.name}</span>

                          {isActive && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Student Profile & Logout */}
        <div className="border-t border-slate-100 p-4">
          {/* Student Information */}
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold uppercase text-indigo-700">
              {user?.name?.charAt(0) || "S"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {user?.name || "Student"}
              </p>

              <p className="truncate text-[11px] text-slate-400">
                {user?.email || "Student Account"}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <LogOut size={18} />
            )}

            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
