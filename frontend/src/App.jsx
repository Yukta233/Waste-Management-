import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import HowItWorks from "./components/HowItWorks";
import Footer from "./components/Footer";
import LoginPage from "./login"; // Import your Login page
import CreateUserAccount from "./signup"
import AboutUs from "./aboutus";
import ContactUs from "./ContactUs";
import ServicesPage from "./ServiceListing";
import AdminDashboard from "./dashboards/AdminDashboard";
import ExpertDashboard from "./dashboards/ExpertDashboard";
import ProviderDashboard from "./dashboards/ProviderDashboard";
import UserDashboard from "./dashboards/UserDashboard";
import BlogPage from "./Blog";
export default function App() {
  return (
    <Router>
      <Routes>
        {/* Main app route */}
        <Route
          path="/"
          element={
            <div className="font-pop min-h-screen bg-gradient-to-br from-white via-[#E9F8F1] to-[#BFF0D1] ">
              
              {/* HEADER */}
              <Header />

              {/* HERO SECTION */}
              <section className="flex flex-col items-center text-center px-6 min-h-[65vh] py-20 md:py-28">
                <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight animate-fade-in">
                  Smart Waste
                  <span className="block text-green-600 mt-3 animate-slide-up anim-delay-200">
                    Management System
                  </span>
                </h1>

                <p className="text-xl text-gray-700 max-w-2xl mt-6 animate-slide-up anim-delay-400">
                  A minimal, eco-friendly platform that transforms waste into reusable resources
                  through a transparent and efficient digital marketplace.
                </p>

                <div className="flex flex-wrap justify-center gap-4 mt-10 animate-pop anim-delay-600">
                  <button className="px-10 py-4 bg-green-600 text-white rounded-xl text-lg font-semibold hover:bg-green-700 transition shadow-lg hover-lift">
                    Explore Marketplace
                  </button>
                  <button className="px-10 py-4 bg-white text-green-600 border border-green-600 rounded-xl text-lg font-semibold hover:bg-green-600 hover:text-white transition shadow hover-lift">
                    Learn More
                  </button>
                </div>
              </section>

              {/* HOW IT WORKS */}
              <HowItWorks />

              {/* WHY CHOOSE SECTION */}
              <section className="px-6 md:px-10 pt-20 pb-40">
                <h2 className="text-4xl font-extrabold text-center mb-14 text-gray-900 animate-slide-up">
                  Why Choose EcoMarket?
                </h2>

                <div className="cards flex flex-row flex-wrap justify-center gap-6">
                  {[
                    {
                      title: "Certified Recyclers",
                      desc: "We partner only with verified recycling experts for sustainable practices.",
                    },
                    {
                      title: "Transparent Pricing",
                      desc: "Real-time waste value tracking ensures fair pricing for everyone.",
                    },
                    {
                      title: "Digital Tracking",
                      desc: "Track every waste pickup and recycling journey digitally.",
                    },
                    {
                      title: "Reliable Support",
                      desc: "Our team is always available to assist users and recyclers promptly.",
                    },
                  ].map((card, index) => (
                    <div
                      key={index}
                      className={`card p-6 bg-white/20 backdrop-blur-xl rounded-2xl shadow-lg border border-green-300 transition hover-lift animate-slide-up anim-delay-${index * 200}`}
                      style={{ width: "260px", minHeight: "180px" }}
                    >
                      <h3 className="text-2xl font-bold mb-2 text-green-700">{card.title}</h3>
                      <p className="text-gray-700 text-md">{card.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Horizontal hover animation for cards */}
                <style>
                  {`
                    .cards {
                      display: flex;
                      flex-direction: row;
                      gap: 1.5rem;
                    }

                    .card {
                      cursor: pointer;
                      transition: all 0.4s ease;
                    }

                    .cards:hover > .card:not(:hover) {
                      filter: blur(6px);
                      transform: scale(0.95);
                    }

                    .card:hover {
                      transform: scale(1.05);
                    }
                  `}
                </style>
              </section>

              {/* FOOTER */}
              <Footer/>
            </div>
          }
        />

        {/* LOGIN PAGE ROUTE */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<CreateUserAccount />} />
        <Route path="/aboutus" element={<AboutUs />} />
        <Route path="/ContactUs" element={<ContactUs />} />
        {/* <Route path="/marketplace" element={<MarketplacePage />} /> */}
        <Route path="/ServiceListing" element={<ServicesPage />} />
        <Route path="/services" element={<ServicesPage />} />

        {/* DASHBOARDS */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/expert" element={<ExpertDashboard />} />
        <Route path="/provider" element={<ProviderDashboard />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/blog" element={<BlogPage />} />

      </Routes>
    </Router>
  );
}
