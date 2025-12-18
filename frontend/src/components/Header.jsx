import React, { useState, useEffect, useRef } from "react";
import { FaUser } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import logo from "../assets/swachhsetu.png";

export default function Header() {
    const [openUserMenu, setOpenUserMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
    const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setOpenUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load current user from storage
  useEffect(() => {
    const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (stored) {
      try { setCurrentUser(JSON.parse(stored)); } catch {}
    } else {
      setCurrentUser(null);
    }
  }, []);

  const roleToPath = (role) => {
    switch (role) {
      case 'admin': return '/admin';
      case 'expert': return '/expert';
      case 'provider': return '/provider';
      default: return '/dashboard';
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (_) {}
    // Clear storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    setCurrentUser(null);
    setOpenUserMenu(false);
    navigate('/');
  };

  
  return (
    <header className="w-full flex justify-center mt-4">
      <div className="w-[95%] bg-white rounded-3xl py-4 px-8 flex items-center justify-between relative">

        {/* LOGO */}
        <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition">
          <img src={logo} alt="SwachhSetu logo" className="w-18 h-18 md:w-20 md:h-26 object-contain" />
          <h1 className="text-3xl font-bold text-gray-800">
            Swachh<span className="text-green-600">Setu</span>
          </h1>
        </Link>

        {/* NAVIGATION */}
        <nav className="flex items-center space-x-3 relative">
          
          {/* SERVICE LISTING BUTTON */}
          <button
            className="px-6 py-2 rounded-full border border-green-600 text-green-600 font-semibold bg-white hover:bg-green-50 transition"
            onClick={() => navigate('/services')}
          >
            Service Listing
          </button>

          {/* DROPDOWN MENU */}
          
          {/* SELL WASTE */}
          <a
            href="#"
            className="px-6 py-2 rounded-full border border-green-600 text-green-600 font-semibold bg-white hover:bg-green-50 transition"
          >
            Sell Waste
          </a>
        </nav>

        {/* AUTH AREA */}
        {currentUser ? (
          <div className="flex items-center gap-3" ref={userMenuRef}>
            <NotificationBell token={localStorage.getItem('token') || localStorage.getItem('accessToken') || sessionStorage.getItem('token') || sessionStorage.getItem('accessToken')} />
            {/* User Menu */}
            <button
              onClick={() => setOpenUserMenu((v) => !v)}
              className="px-4 py-2 rounded-full border border-green-600 bg-white text-green-700 font-semibold hover:bg-green-50 transition"
            >
              <span className="hidden sm:inline">{currentUser.fullName || currentUser.name || 'User'}</span>
              <span className="sm:hidden">Dashboard</span>
            </button>
            {openUserMenu && (
              <div className="absolute top-16 right-40 sm:right-44 bg-white border border-gray-200 rounded-xl shadow z-50 w-64 p-3">
                <div className="text-xs text-gray-500">Signed in as</div>
                <div className="font-semibold text-gray-800 truncate">{currentUser.fullName || currentUser.name || 'User'}</div>
                <div className="text-sm text-gray-600 truncate">{currentUser.email}</div>
                <button
                  onClick={() => navigate(roleToPath(currentUser.role))}
                  className="mt-3 w-full px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700"
                >
                  Go to Dashboard
                </button>
              </div>
            )}
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full border border-red-500 bg-white text-red-600 font-semibold hover:bg-red-50 transition"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center space-x-2 px-6 py-2 rounded-full border border-green-600 bg-white text-green-600 font-semibold hover:bg-green-50 transition"
          >
            <FaUser className="text-lg text-green-600" />
            <span>Login</span>
          </Link>
        )}

      </div>
    </header>
  );
}
