import React, { useState, useEffect, useRef } from "react";
import { FaUser } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

export default function Header() {
  const [openDropdown, setOpenDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOptionSelect = (domain) => {
    navigate(`/services?domain=${domain.toLowerCase()}`);
    setOpenDropdown(false);
  };

  return (
    <header className="w-full flex justify-center mt-4">
      <div className="w-[95%] bg-white rounded-3xl py-4 px-8 flex items-center justify-between relative">

        {/* LOGO */}
        <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition">
          <img
            src="/logo.png"
            alt="logo"
            className="w-10 h-10"
          />
          <h1 className="text-3xl font-bold text-gray-800">
            Waste<span className="text-green-600">Manage</span>
          </h1>
        </Link>

        {/* NAVIGATION */}
        <nav className="flex items-center space-x-3 relative" ref={dropdownRef}>
          
          {/* SERVICE LISTING BUTTON */}
          <button
            className="px-6 py-2 rounded-full border border-green-600 text-green-600 font-semibold bg-white hover:bg-green-50 transition"
            onMouseEnter={() => setOpenDropdown(true)}
          >
            Service Listing
          </button>

          {/* DROPDOWN MENU */}
          {openDropdown && (
            <div
              onMouseLeave={() => setOpenDropdown(false)}
              className="absolute top-14 left-0 w-56 bg-white shadow-lg rounded-xl border border-gray-200 z-50"
            >
              {["Residential", "Commercial", "Municipal"].map((option) => (
                <div
                  key={option}
                  onClick={() => handleOptionSelect(option)}
                  className="px-4 py-3 cursor-pointer text-gray-800 hover:bg-gray-100 transition select-none"
                  style={{ outline: "none" }}
                >
                  {option}
                </div>
              ))}
            </div>
          )}

          {/* SELL WASTE */}
          <a
            href="#"
            className="px-6 py-2 rounded-full border border-green-600 text-green-600 font-semibold bg-white hover:bg-green-50 transition"
          >
            Sell Waste
          </a>
        </nav>

        {/* LOGIN BUTTON */}
        <Link
          to="/login"
          className="flex items-center space-x-2 px-6 py-2 rounded-full border border-green-600 bg-white text-green-600 font-semibold hover:bg-green-50 transition"
        >
          <FaUser className="text-lg text-green-600" />
          <span>Login</span>
        </Link>

      </div>
    </header>
  );
}
