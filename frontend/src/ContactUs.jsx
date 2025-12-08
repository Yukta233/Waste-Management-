import React from 'react';
import { Link } from 'react-router-dom';
export default function ContactUs() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-5xl w-full grid md:grid-cols-2 gap-12">

        {/* Left side: Get in Touch + Support Info */}
        <div className="flex flex-col justify-center space-y-6">
          <h1 className="text-5xl font-extrabold mb-2 text-green-700">Get in Touch</h1>
          <p className="text-gray-700 text-lg">
            We are here to help! Whether you have a question, suggestion, or want to collaborate, fill out the form and our team will respond as soon as possible.
          </p>

          <div className="mt-6 space-y-3">
            <h2 className="text-xl font-semibold text-gray-800 mb-1">Support Hours:</h2>
            <p className="text-gray-700">Mon - Fri: 9:00 AM - 6:00 PM</p>
            <p className="text-gray-700">Sat: 10:00 AM - 4:00 PM</p>
          </div>

          <div className="mt-4 space-y-1">
            <h2 className="text-xl font-semibold text-gray-800 mb-1">Email:</h2>
            <a href="mailto:support@wastemanagement.com" className="text-green-700 font-medium hover:underline">
              support@wastemanagement.com
            </a>
          </div>
        </div>

        {/* Right side: Form */}
        <div className="bg-gray-50 p-8 rounded-2xl shadow-inner">
          <form className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2" htmlFor="name">Name</label>
              <input type="text" id="name" placeholder="Your Name" className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2" htmlFor="email">Email</label>
              <input type="email" id="email" placeholder="you@example.com" className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2" htmlFor="message">Message</label>
              <textarea id="message" rows="6" placeholder="Your message..." className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
            </div>

            <button type="submit" className="w-full bg-green-700 text-white p-4 rounded-xl font-bold hover:bg-green-600 transition">
              Send Message
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
