import { useState } from "react";
import toast from "react-hot-toast";
import {
  User,
  Lock,
  Bell,
  ShieldCheck,
  Palette,
  Eye,
  EyeOff,
  Save,
  Mail,
  Smartphone,
  CalendarDays,
  BookOpen,
  Clock,
  Monitor,
  Sun,
  Moon,
  ChevronRight,
  Check,
  KeyRound,
  Globe,
  AlertCircle,
} from "lucide-react";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("account");

  const [profileSettings, setProfileSettings] = useState({
    language: "English",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    classReminders: true,
    attendanceReminders: true,
    weeklyReports: true,
    importantUpdates: true,
    pushNotifications: false,
  });

  const [privacy, setPrivacy] = useState({
    showEmail: false,
    showAcademicInfo: true,
    loginAlerts: true,
  });

  const [appearance, setAppearance] = useState("light");

  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [saving, setSaving] = useState(false);

  const tabs = [
    { id: "account", label: "Account", icon: User },
    { id: "password", label: "Password", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy & Security", icon: ShieldCheck },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  const updateNotification = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const updatePrivacy = (key) => {
    setPrivacy((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAccountSave = () => {
    setSaving(true);

    // Frontend demo: Backend integration will be added later.
    setTimeout(() => {
      setSaving(false);
      toast.success("Account preferences saved locally!");
    }, 500);
  };

  const handleNotificationSave = () => {
    setSaving(true);

    // Frontend demo: Backend integration will be added later.
    setTimeout(() => {
      setSaving(false);
      toast.success("Notification preferences saved locally!");
    }, 500);
  };

  const handlePrivacySave = () => {
    setSaving(true);

    // Frontend demo: Backend integration will be added later.
    setTimeout(() => {
      setSaving(false);
      toast.success("Privacy preferences saved locally!");
    }, 500);
  };

  const handleAppearanceSave = () => {
    toast.success(
      "Appearance preference selected. Global theme support will be connected later.",
    );
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();

    const { currentPassword, newPassword, confirmPassword } = password;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must contain at least 8 characters.");
      return;
    }

    if (newPassword === currentPassword) {
      toast.error("New password must be different from current password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    toast.success(
      "Password form validated. Actual password change will work after backend integration.",
    );

    setPassword({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const Toggle = ({ checked, onChange }) => (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${
        checked ? "bg-indigo-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );

  const SettingRow = ({
    icon: Icon,
    title,
    description,
    checked,
    onChange,
  }) => (
    <div className="flex items-center justify-between gap-4 py-5 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Icon size={19} />
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-5">
            {description}
          </p>
        </div>
      </div>

      <Toggle checked={checked} onChange={onChange} />
    </div>
  );

  const PasswordField = ({ label, field, placeholder }) => {
    const visibilityKey =
      field === "currentPassword"
        ? "current"
        : field === "newPassword"
          ? "new"
          : "confirm";

    const isVisible = showPasswords[visibilityKey];

    return (
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>

        <div className="relative">
          <input
            type={isVisible ? "text" : "password"}
            value={password[field]}
            onChange={(e) =>
              setPassword((prev) => ({
                ...prev,
                [field]: e.target.value,
              }))
            }
            placeholder={placeholder}
            className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-sm transition"
          />

          <button
            type="button"
            onClick={() => togglePasswordVisibility(visibilityKey)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600"
          >
            {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
    );
  };

  const SaveButton = ({ onClick, label = "Save Changes" }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold shadow-md shadow-indigo-100 transition"
    >
      <Save size={17} />
      {saving ? "Saving..." : label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fc] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
            <span>Dashboard</span>
            <ChevronRight size={13} />
            <span className="text-indigo-600 font-medium">Settings</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Settings
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                Manage your account, security and personal preferences.
              </p>
            </div>

            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
              <ShieldCheck size={18} className="text-indigo-600" />
              <span className="text-xs font-semibold text-indigo-700">
                Student Account
              </span>
            </div>
          </div>
        </div>

        {/* Settings Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          {/* Sidebar */}
          <aside className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm h-fit">
            <p className="text-[10px] uppercase tracking-[1.5px] font-bold text-gray-400 px-3 pt-3 pb-3">
              Settings Menu
            </p>

            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                        : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{tab.label}</span>

                    {isActive && <ChevronRight size={16} className="ml-auto" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-indigo-600 mb-3 shadow-sm">
                <ShieldCheck size={19} />
              </div>
              <h4 className="text-sm font-bold text-gray-800">
                Your account matters
              </h4>
              <p className="text-xs text-gray-500 mt-1 leading-5">
                Keep your account preferences updated and protect your
                information.
              </p>
            </div>
          </aside>

          {/* Main Content */}
          <main className="min-w-0">
            {/* ACCOUNT SETTINGS */}
            {activeTab === "account" && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 sm:p-7 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <User size={21} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Account Preferences
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">
                        Customize your account settings.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-7 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Globe
                        size={15}
                        className="inline mr-2 text-indigo-500"
                      />
                      Language
                    </label>

                    <select
                      value={profileSettings.language}
                      onChange={(e) =>
                        setProfileSettings((prev) => ({
                          ...prev,
                          language: e.target.value,
                        }))
                      }
                      className="w-full sm:max-w-md px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-sm"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Clock
                        size={15}
                        className="inline mr-2 text-indigo-500"
                      />
                      Time Zone
                    </label>

                    <select
                      value={profileSettings.timezone}
                      onChange={(e) =>
                        setProfileSettings((prev) => ({
                          ...prev,
                          timezone: e.target.value,
                        }))
                      }
                      className="w-full sm:max-w-md px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-sm"
                    >
                      <option value="Asia/Kolkata">
                        India Standard Time (IST)
                      </option>
                      <option value="UTC">UTC</option>
                      <option value="Asia/Dubai">Dubai</option>
                      <option value="Europe/London">London</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <CalendarDays
                        size={15}
                        className="inline mr-2 text-indigo-500"
                      />
                      Date Format
                    </label>

                    <select
                      value={profileSettings.dateFormat}
                      onChange={(e) =>
                        setProfileSettings((prev) => ({
                          ...prev,
                          dateFormat: e.target.value,
                        }))
                      }
                      className="w-full sm:max-w-md px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-sm"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <SaveButton onClick={handleAccountSave} />
                  </div>
                </div>
              </div>
            )}

            {/* PASSWORD SETTINGS */}
            {activeTab === "password" && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 sm:p-7 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <KeyRound size={21} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">
                          Change Password
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                          Update your account password.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form
                    onSubmit={handlePasswordChange}
                    className="p-5 sm:p-7 space-y-5"
                  >
                    <PasswordField
                      label="Current Password"
                      field="currentPassword"
                      placeholder="Enter your current password"
                    />

                    <PasswordField
                      label="New Password"
                      field="newPassword"
                      placeholder="Enter your new password"
                    />

                    <PasswordField
                      label="Confirm New Password"
                      field="confirmPassword"
                      placeholder="Re-enter your new password"
                    />

                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-3">
                      <AlertCircle
                        size={19}
                        className="text-amber-600 shrink-0 mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">
                          Password requirements
                        </p>
                        <ul className="text-xs text-amber-700 mt-2 space-y-1">
                          <li>• Minimum 8 characters</li>
                          <li>• Use a strong and unique password</li>
                          <li>• Avoid sharing your password with anyone</li>
                        </ul>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-100 transition"
                    >
                      <Lock size={17} />
                      Update Password
                    </button>
                  </form>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">
                        Keep your account secure
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 leading-5">
                        Never share your password or login credentials. Use a
                        unique password for your SmartAttend account.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATION SETTINGS */}
            {activeTab === "notifications" && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 sm:p-7 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Bell size={21} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Notification Preferences
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">
                        Choose which notifications you want to receive.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-5 sm:px-7">
                  <div className="pt-5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                      General Notifications
                    </p>

                    <SettingRow
                      icon={Mail}
                      title="Email Notifications"
                      description="Receive important updates through email."
                      checked={notifications.emailNotifications}
                      onChange={() => updateNotification("emailNotifications")}
                    />

                    <SettingRow
                      icon={Smartphone}
                      title="Push Notifications"
                      description="Receive notifications on supported devices."
                      checked={notifications.pushNotifications}
                      onChange={() => updateNotification("pushNotifications")}
                    />

                    <SettingRow
                      icon={Bell}
                      title="Important Updates"
                      description="Get important announcements and account updates."
                      checked={notifications.importantUpdates}
                      onChange={() => updateNotification("importantUpdates")}
                    />
                  </div>

                  <div className="pt-6">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                      Academic Notifications
                    </p>

                    <SettingRow
                      icon={CalendarDays}
                      title="Class Reminders"
                      description="Receive reminders about your upcoming classes."
                      checked={notifications.classReminders}
                      onChange={() => updateNotification("classReminders")}
                    />

                    <SettingRow
                      icon={BookOpen}
                      title="Attendance Reminders"
                      description="Receive reminders about your academic attendance."
                      checked={notifications.attendanceReminders}
                      onChange={() => updateNotification("attendanceReminders")}
                    />

                    <SettingRow
                      icon={Clock}
                      title="Weekly Reports"
                      description="Get a weekly summary of your academic progress."
                      checked={notifications.weeklyReports}
                      onChange={() => updateNotification("weeklyReports")}
                    />
                  </div>

                  <div className="py-6 border-t border-gray-100 mt-4">
                    <SaveButton onClick={handleNotificationSave} />
                  </div>
                </div>
              </div>
            )}

            {/* PRIVACY SETTINGS */}
            {activeTab === "privacy" && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 sm:p-7 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <ShieldCheck size={21} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Privacy & Security
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">
                        Manage your privacy preferences.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-5 sm:px-7">
                  <div className="pt-5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                      Privacy Preferences
                    </p>

                    <SettingRow
                      icon={Mail}
                      title="Show Email"
                      description="Allow your email to be visible in permitted student views."
                      checked={privacy.showEmail}
                      onChange={() => updatePrivacy("showEmail")}
                    />

                    <SettingRow
                      icon={BookOpen}
                      title="Academic Information"
                      description="Allow permitted users to view your academic information."
                      checked={privacy.showAcademicInfo}
                      onChange={() => updatePrivacy("showAcademicInfo")}
                    />
                  </div>

                  <div className="pt-6">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                      Security Preferences
                    </p>

                    <SettingRow
                      icon={ShieldCheck}
                      title="Login Alerts"
                      description="Enable alerts for important account login activity."
                      checked={privacy.loginAlerts}
                      onChange={() => updatePrivacy("loginAlerts")}
                    />
                  </div>

                  <div className="py-6 border-t border-gray-100 mt-4">
                    <SaveButton onClick={handlePrivacySave} />
                  </div>
                </div>
              </div>
            )}

            {/* APPEARANCE SETTINGS */}
            {activeTab === "appearance" && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 sm:p-7 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Palette size={21} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Appearance
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">
                        Choose your preferred application appearance.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-7">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4">
                    Theme Preference
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      {
                        id: "light",
                        label: "Light Mode",
                        description: "Clean and bright",
                        icon: Sun,
                      },
                      {
                        id: "dark",
                        label: "Dark Mode",
                        description: "Easy on the eyes",
                        icon: Moon,
                      },
                      {
                        id: "system",
                        label: "System",
                        description: "Follow device settings",
                        icon: Monitor,
                      },
                    ].map((theme) => {
                      const Icon = theme.icon;
                      const selected = appearance === theme.id;

                      return (
                        <button
                          type="button"
                          key={theme.id}
                          onClick={() => setAppearance(theme.id)}
                          className={`relative p-5 rounded-2xl border-2 text-left transition ${
                            selected
                              ? "border-indigo-600 bg-indigo-50/50"
                              : "border-gray-100 hover:border-gray-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-5">
                            <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-indigo-600">
                              <Icon size={20} />
                            </div>

                            {selected && (
                              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                                <Check size={14} />
                              </div>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-gray-800">
                            {theme.label}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {theme.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
                    <Monitor size={19} className="text-blue-600 shrink-0" />
                    <p className="text-xs text-blue-700 leading-5">
                      Your theme selection is currently a frontend preference
                      only. Global light and dark theme switching will be
                      implemented during the UI integration stage.
                    </p>
                  </div>

                  <div className="mt-6">
                    <SaveButton
                      onClick={handleAppearanceSave}
                      label="Save Appearance"
                    />
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Settings;
