
import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleOpenSidebar = () => {
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
      />

      {/* Main Content Area */}
      <div className="min-h-screen lg:pl-[270px]">

        {/* Navbar */}
        <Navbar onMenuClick={handleOpenSidebar} />

        {/* Page Content */}
        <main className="min-h-[calc(100vh-76px)] p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
};

export default MainLayout;
