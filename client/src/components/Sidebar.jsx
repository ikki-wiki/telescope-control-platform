import React, { useState } from 'react';
import { Home, Settings, Menu, Telescope } from 'lucide-react';

export default function Sidebar({ activePage, setActivePage }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { icon: <Home />, label: "Home" },
    { icon: <Telescope />, label: "Control" },
    { icon: <Settings />, label: "Settings" },
  ];

  return (
    <>
      {/* Mobile menu button, only visible on small screens */}
      <button
        className="md:hidden p-3 m-2 text-gray-100 bg-gray-800 rounded-md fixed top-2 left-2 z-50"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <nav
        className={`
          fixed top-0 left-0 h-full w-50 bg-gray-900 text-gray-100
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:flex-shrink-0
          z-40
        `}
      >
        <div className="p-4 border-b border-gray-700 flex items-center justify-between md:justify-center">
          <h1 className="text-lg font-bold">Menu</h1>
          {/* Close button for mobile */}
          <button
            className="md:hidden p-2"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <ul className="mt-4">
          {menuItems.map(({ icon, label }) => (
            <li
              key={label}
              className={`flex items-center cursor-pointer pl-4 py-3 hover:bg-gray-800 ${
                activePage === label ? "bg-gray-800 font-semibold" : ""
              }`}
              onClick={() => {
                setActivePage(label);
                setSidebarOpen(false); // close sidebar on mobile after click
              }}
            >
              <span className="mr-3">{icon}</span>
              <span className="capitalize">{label}</span>
            </li>
          ))}
        </ul>
      </nav>

      {/* Overlay behind sidebar when open on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
