import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import NotificationBar from './NotificationBar';

export default function Layout({ module = 'rental' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NotificationBar />
      <Navbar onMenuClick={() => setSidebarOpen(true)} module={module} />

      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} module={module} />

        <main className="flex-1 p-4 md:p-6 md:ml-64 mt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
