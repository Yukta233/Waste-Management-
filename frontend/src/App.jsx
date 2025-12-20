import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import HowItWorks from "./components/HowItWorks";
import Footer from "./components/Footer";
import Testimonials from "./components/Testimonials";
import TextAnimate from "./components/TextAnimate";
import LoginPage from "./login";
import CreateUserAccount from "./signup";
import AboutUs from "./aboutus";
import ContactUs from "./ContactUs";
import ServicesPage from "./ServiceListing";
import AdminDashboard from "./dashboards/AdminDashboard";
import ExpertDashboard from "./dashboards/ExpertDashboard";
import ProviderDashboard from "./dashboards/ProviderDashboard";
import UserDashboard from "./dashboards/UserDashboard";
import BookingPage from "./pages/BookingPage";
import BlogPage from "./blog";
import ForgotPassword from "./ForgotPassword.jsx";
import ResetPassword from "./ResetPassword.jsx";
import WhyChooseUs from "./components/whychooseus.jsx";
import ProfilesDirectory from "./profile.jsx";
function HomeLanding() {
  const navigate = useNavigate();
  return (
    <div className="font-pop min-h-screen bg-gradient-to-br from-white via-[#E9F8F1] to-[#BFF0D1]">
      {/* HEADER */}
      <Header />

      {/* HERO SECTION */}
      <section className="flex flex-col items-center text-center px-6 min-h-[65vh] py-20 md:py-28">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
          <TextAnimate text="Smart Waste" />
          <span className="block text-green-600 mt-3">
            <TextAnimate text="Management System" />
          </span>
        </h1>

        <p className="text-xl text-gray-700 max-w-2xl mt-6 animate-slide-up">
          A minimal, eco-friendly platform that transforms waste into reusable resources
          through a transparent and efficient digital marketplace.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mt-10 animate-pop">
          <button
            className="px-10 py-4 bg-green-600 text-white rounded-xl text-lg font-semibold hover:bg-green-700 transition shadow-lg hover-lift"
            onClick={() => navigate('/services')}
          >
            Explore Marketplace
          </button>
          <button
            className="px-10 py-4 bg-white text-green-600 border border-green-600 rounded-xl text-lg font-semibold hover:bg-green-600 hover:text-white transition shadow hover-lift"
            onClick={() => navigate('/blog')}
          >
            Learn More
          </button>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <HowItWorks />

      {/* WHY CHOOSE SECTION */}
      <WhyChooseUs />

      {/* TESTIMONIALS */}
      <Testimonials />

      {/* FOOTER */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeLanding />} />

        {/* ROUTES */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<CreateUserAccount />} />
        <Route path="/aboutus" element={<AboutUs />} />
        <Route path="/ContactUs" element={<ContactUs />} />
        <Route path="/ServiceListing" element={<ServicesPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        {/* DASHBOARDS */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/expert" element={<ExpertDashboard />} />
        <Route path="/provider" element={<ProviderDashboard />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/book/:serviceId" element={<BookingPage />} />
        <Route path="/profile" element={<ProfilesDirectory />} />
        <Route path="/blog" element={<BlogPage />} />
      </Routes>
    </Router>
  );
}
