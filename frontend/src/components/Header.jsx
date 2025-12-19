import React, { useState, useEffect, useRef } from "react";
import { FaUser, FaBars, FaTimes } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import NotificationBell from "./NotificationBell";
import logo from "../assets/swachhsetu.png";

export default function Header() {
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api/v1";

  /* Close dropdown */
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setOpenUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* Load user */
  useEffect(() => {
    const stored =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const roleToPath = (role) => {
    switch (role) {
      case "admin":
        return "/admin";
      case "expert":
        return "/expert";
      case "provider":
        return "/provider";
      default:
        return "/dashboard";
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (_) {}
    localStorage.clear();
    sessionStorage.clear();
    setCurrentUser(null);
    navigate("/");
  };

  return (
    <>
      {/* ===== NAVBAR ===== */}
      <header className="sticky top-0 w-full z-50 flex justify-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-[96%] bg-white rounded-2xl px-6 py-2.5 flex items-center justify-between shadow-sm"
        >
          {/* LOGO (left) */}
          <div className="flex-1">
            <Link to="/" className="flex items-center gap-2">
              <img
                src={logo}
                alt="SwachhSetu"
                className="w-12 h-12 object-contain"
              />
              <h1 className="text-2xl font-bold text-gray-800">
                Swachh<span className="text-green-600">Setu</span>
              </h1>
            </Link>
          </div>

          {/* DESKTOP NAV (center) */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-3">
            <button
              onClick={() => navigate("/services")}
              className="px-5 py-1.5 rounded-full border border-green-600 text-green-600 font-semibold hover:bg-green-50 transition"
            >
              Service Listing
            </button>

            <button
              onClick={() => navigate("/aboutus")}
              className="px-5 py-1.5 rounded-full border border-green-600 text-green-600 font-semibold hover:bg-green-50 transition"
            >
              About
            </button>
          </nav>

          {/* AUTH (right) */}
          <div className="hidden md:flex flex-1 items-center justify-end gap-3" ref={userMenuRef}>
            {currentUser ? (
              <>
                <NotificationBell
                  token={
                    localStorage.getItem("accessToken") ||
                    sessionStorage.getItem("accessToken")
                  }
                />

                <button
                  onClick={() => setOpenUserMenu(!openUserMenu)}
                  className="px-4 py-1.5 rounded-full border border-green-600 text-green-700 font-semibold hover:bg-green-50"
                >
                  {currentUser.fullName || "User"}
                </button>

                <AnimatePresence>
                  {openUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute top-16 right-32 bg-white border rounded-xl shadow w-64 p-4"
                    >
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="font-semibold truncate">
                        {currentUser.email}
                      </p>

                      <button
                        onClick={() =>
                          navigate(roleToPath(currentUser.role))
                        }
                        className="mt-3 w-full py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700"
                      >
                        Go to Dashboard
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={handleLogout}
                  className="px-4 py-1.5 rounded-full border border-red-500 text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-5 py-1.5 rounded-full border border-green-600 text-green-600 font-semibold hover:bg-green-50"
              >
                <FaUser />
                Login
              </Link>
            )}
          </div>

          {/* MOBILE TOGGLE */}
          <button
            className="md:hidden text-xl text-green-600"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? <FaTimes /> : <FaBars />}
          </button>
        </motion.div>
      </header>

      {/* ===== GLOBAL SPACER (IMPORTANT FIX) ===== */}
      
      {/* This ensures page content never hides behind navbar */}
    </>
  );
}
