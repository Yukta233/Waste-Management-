import React from 'react';
import { Link } from 'react-router-dom';
import Header from './components/Header';
export default function ContactUs() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-5xl w-full grid md:grid-cols-2 gap-10">

        {/* Left side: Get in Touch + Support Info */}
        <div className="flex flex-col justify-center space-y-6">
          <h1 className="text-3xl font-extrabold mb-2 text-green-700">Get in Touch</h1>
          <p className="text-gray-700 text-base">
            We are here to help! Whether you have a question, suggestion, or want to collaborate, fill out the form and our team will respond as soon as possible.
          </p>

          <div className="mt-6 space-y-3">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Support Hours:</h2>
            <p className="text-gray-700">Mon - Fri: 9:00 AM - 6:00 PM</p>
            <p className="text-gray-700">Sat: 10:00 AM - 4:00 PM</p>
          </div>

          <div className="mt-4 space-y-1">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Email:</h2>
            <a href="mailto:support@wastemanagement.com" className="text-green-700 font-medium hover:underline">
              support@wastemanagement.com
            </a>
          </div>
        </div>

        {/* Right side: Form */}
        <div className="bg-gray-50 p-6 rounded-2xl shadow-inner">
          <form className="space-y-5">
            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm" htmlFor="name">Name</label>
              <input type="text" id="name" placeholder="Your Name" className="w-full p-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm" htmlFor="email">Email</label>
              <input type="email" id="email" placeholder="you@example.com" className="w-full p-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm" htmlFor="message">Message</label>
              <textarea id="message" rows="5" placeholder="Your message..." className="w-full p-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
            </div>

            <button type="submit" className="w-full bg-green-700 text-white p-3 rounded-xl font-semibold hover:bg-green-600 transition text-sm">
              Send Message
            </button>
          </form>
        </div>

      </div>
      </div>
    </div>
  );
}
