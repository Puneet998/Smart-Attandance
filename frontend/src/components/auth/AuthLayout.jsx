import { CalendarCheck, ShieldCheck, ChartNoAxesCombined } from "lucide-react";

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 p-12 flex-col justify-between text-white">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white/15 flex items-center justify-center">
              <CalendarCheck size={26} />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              Smart<span className="text-indigo-200">Attend</span>
            </span>
          </div>
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">
            <ShieldCheck size={16} />
            Your attendance, simplified
          </div>

          <h1 className="text-5xl font-bold leading-tight">
            Take control of your
            <span className="block text-indigo-200">attendance journey.</span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-indigo-100">
            Track your daily attendance, monitor your progress, manage your
            schedule and stay ahead of your goals.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
              <ChartNoAxesCombined size={25} />
              <h3 className="mt-3 font-semibold">Smart Analytics</h3>
              <p className="mt-1 text-sm text-indigo-100">
                Understand your attendance trends.
              </p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
              <CalendarCheck size={25} />
              <h3 className="mt-3 font-semibold">Easy Tracking</h3>
              <p className="mt-1 text-sm text-indigo-100">
                Manage your attendance every day.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-indigo-200">
          © {new Date().getFullYear()} SmartAttend. All rights reserved.
        </div>
      </div>

      {/* Right Section */}
      <div className="flex min-h-screen w-full lg:w-1/2 items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center justify-center gap-2 text-indigo-600">
              <CalendarCheck size={30} />
              <span className="text-2xl font-bold">SmartAttend</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              {title}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
          </div>

          {children}

          <p className="mt-8 text-center text-xs text-slate-400">
            Secure attendance management platform
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
