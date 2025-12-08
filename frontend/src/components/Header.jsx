import React from "react";
import { FaUser } from "react-icons/fa";

export default function Header() {
  return (
    <header className="w-full flex justify-center mt-4">
      {/* MAIN CONTAINER */}
      <div className="w-[95%] bg-white rounded-3xl py-4 px-8 flex items-center justify-between">

        {/* LOGO */}
        <div className="flex items-center space-x-3">
          <img
            src="/logo.png" 
            alt="logo"
            className="w-10 h-10"
          />
          <h1 className="text-3xl font-bold text-gray-800">
            Waste<span className="text-green-600">Manage</span>
          </h1>
        </div>

        {/* NAVIGATION */}
        <nav className="flex items-center space-x-3">
          {["Service Listing", "Sell Waste"].map((item) => (
            <a
              key={item}
              href="#"
              className="px-6 py-2 rounded-full border border-green-600 text-green-600 font-semibold bg-white hover:bg-green-50 transition"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* LOGIN BUTTON */}
        <button className="flex items-center space-x-2 px-6 py-2 rounded-full border border-green-600 bg-white text-green-600 font-semibold hover:bg-green-50 transition">
          <FaUser className="text-lg text-green-600" />
          <span>Login</span>
        </button>

      </div>
    </header>
  );
}
