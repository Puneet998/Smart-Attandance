import {
  Menu,
  Bell,
  ChevronDown,
  Search,
  GraduationCap,
  LogOut,
  User,
  Settings,
  X,
  Loader2,
} from "lucide-react";

import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  const pageTitles = {
    "/dashboard": "Dashboard",
    "/subjects": "My Subjects",
    "/timetable": "My Timetable",
    "/attendance": "Attendance",
    "/reports": "Reports",
    "/profile": "My Profile",
    "/settings": "Settings",
  };

  const pageTitle = pageTitles[location.pathname] || "SmartAttend";

  const studentInitial = user?.name?.charAt(0)?.toUpperCase() || "S";

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Close dropdowns when route changes
  useEffect(() => {
    setShowProfileMenu(false);
    setShowNotifications(false);
  }, [location.pathname]);

  // Logout Function
  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);

      setShowProfileMenu(false);
      setShowNotifications(false);

      await logout();

      toast.success("Logged out successfully!");

      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout Error:", error);

      toast.error("Unable to confirm logout. Please try again.");

      // AuthContext clears local authentication state in its finally block.
      // ProtectedRoute should redirect to login if the user is no longer authenticated.
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleNavigation = (path) => {
    setShowProfileMenu(false);
    setShowNotifications(false);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Left Section */}
      <div className="flex min-w-0 items-center gap-3 sm:gap-5">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={23} />
        </button>

        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
            {pageTitle}
          </h2>

          <p className="mt-0.5 hidden text-xs text-slate-400 sm:block">
            Welcome back! Manage your academic journey.
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search */}
        <button
          type="button"
          className="hidden rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 md:flex"
          aria-label="Search"
          title="Search"
        >
          <Search size={19} />
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => {
              setShowNotifications((prev) => !prev);
              setShowProfileMenu(false);
            }}
            className={`relative rounded-xl p-2.5 transition ${
              showNotifications
                ? "bg-indigo-50 text-indigo-600"
                : "text-slate-500 hover:bg-slate-100"
            }`}
            aria-label="Notifications"
            aria-expanded={showNotifications}
          >
            <Bell size={20} />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-14 z-50 w-72 rounded-2xl border border-slate-200 bg-white shadow-xl sm:w-80">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Notifications
                  </h3>

                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Your latest updates
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                  aria-label="Close notifications"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
                  <Bell size={22} className="text-indigo-400" />
                </div>

                <p className="text-sm font-semibold text-slate-600">
                  No notifications yet
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  You're all caught up!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden h-9 w-px bg-slate-200 sm:block" />

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu((prev) => !prev);
              setShowNotifications(false);
            }}
            className={`flex items-center gap-2 rounded-xl p-1.5 transition sm:gap-3 ${
              showProfileMenu ? "bg-slate-50" : "hover:bg-slate-50"
            }`}
            aria-label="Open profile menu"
            aria-expanded={showProfileMenu}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              {studentInitial}
            </div>

            <div className="hidden text-left sm:block">
              <p className="max-w-[130px] truncate text-xs font-bold text-slate-800">
                {user?.name || "Student"}
              </p>

              <p className="text-[10px] text-slate-400">Student</p>
            </div>

            <ChevronDown
              size={15}
              className={`hidden text-slate-400 transition-transform sm:block ${
                showProfileMenu ? "rotate-180" : ""
              }`}
            />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              {/* User Information */}
              <div className="border-b border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-base font-bold text-indigo-700">
                    {studentInitial}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {user?.name || "Student"}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-400">
                      {user?.email || ""}
                    </p>

                    <span className="mt-1 inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
                      Student Account
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <button
                  type="button"
                  onClick={() => handleNavigation("/profile")}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600"
                >
                  <User size={17} />
                  My Profile
                </button>

                <button
                  type="button"
                  onClick={() => handleNavigation("/settings")}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600"
                >
                  <Settings size={17} />
                  Settings
                </button>

                <div className="my-2 border-t border-slate-100" />

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoggingOut ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <LogOut size={18} />
                  )}

                  {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
