import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import Header from "./components/Header";

// -------------------- TEAM CARD WITH FLIP EFFECT --------------------
const TeamCard = ({ name, role }) => {
  return (
    <FlipCardWrapper>
      <div className="flip-card">
        <div className="flip-inner">

          {/* FRONT */}
          <div className="flip-front">
            <div className="image" />
            <h4 className="name">{name}</h4>
            <p className="role">{role}</p>
          </div>

          {/* BACK */}
          <div className="flip-back">
            <h4 className="name">{name}</h4>
            <p className="role">{role}</p>
            <p className="desc">
              Passionate about sustainability and improving waste management practices.
            </p>
          </div>

        </div>
      </div>
    </FlipCardWrapper>
  );
};

// -------------------- FLIP CARD STYLES --------------------
const FlipCardWrapper = styled.div`
  .flip-card {
    width: 260px;
    height: 330px;
    perspective: 1000px;
  }

  .flip-inner {
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transition: transform 0.8s ease;
    cursor: pointer;
  }

  .flip-card:hover .flip-inner {
    transform: rotateY(180deg);
  }

  .flip-front,
  .flip-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;

    border: 2px solid #888;
    background: white;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
  }

  .flip-front .image {
    width: 100%;
    height: 150px;
    border: 2px solid #888;
    background-color: #ddd;
    border-radius: 12px;
    margin-bottom: 15px;
  }

  .flip-back {
    background: #f0fff0;
    transform: rotateY(180deg);
    padding-top: 50px;
  }

  .name {
    font-size: 1.2rem;
    font-weight: bold;
    color: #333;
  }

  .role {
    color: #555;
    font-size: 0.9rem;
    margin-bottom: 10px;
  }

  .desc {
    color: #444;
    font-size: 0.85rem;
  }
`;

// ----------------------- MAIN ABOUT PAGE ----------------------
function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 leading-relaxed">
      <Header />

      {/* Hero */}
      <section className="w-full bg-green-700 text-white py-20 px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">About Us</h1>
        <p className="max-w-2xl mx-auto text-base opacity-90">
          Building a cleaner, greener future through innovative waste management.
        </p>
      </section>

      {/* Story */}
      <section className="max-w-6xl mx-auto py-16 px-6">
        <h2 className="text-2xl font-semibold mb-6 text-center">Our Story</h2>
        <p className="text-base text-gray-700 max-w-4xl mx-auto text-center">
          What began as a small effort has grown into a complete ecosystem dedicated
          to managing waste responsibly and promoting sustainability.
        </p>
      </section>

      {/* Core Values */}
      <section className="bg-white py-16 px-6">
        <h2 className="text-2xl text-center font-semibold mb-10">Our Core Values</h2>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
          <div className="bg-green-100 p-8 rounded-xl shadow text-center">
            <h3 className="text-xl font-bold mb-3 text-green-800">Sustainability</h3>
            <p className="text-gray-700">Promoting long-term environmental balance.</p>
          </div>

          <div className="bg-yellow-100 p-8 rounded-xl shadow text-center">
            <h3 className="text-xl font-bold mb-3 text-yellow-800">Innovation</h3>
            <p className="text-gray-700">Using technology to improve waste solutions.</p>
          </div>

          <div className="bg-blue-100 p-8 rounded-xl shadow text-center">
            <h3 className="text-xl font-bold mb-3 text-blue-800">Community</h3>
            <p className="text-gray-700">Uniting people for a cleaner future.</p>
          </div>
        </div>
      </section>

      {/* Vision Flowchart */}
<section className="bg-white py-16 px-6">
  <h2 className="text-2xl font-semibold text-center mb-10">Our Vision</h2>

  <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-10 text-center">

    <div className="p-8 bg-green-100 shadow rounded-xl">
      <h3 className="text-green-800 text-xl font-bold">Awareness</h3>
      <p className="text-gray-700 mt-2">Educating people on waste impact.</p>
    </div>

    <div className="p-8 bg-blue-100 shadow rounded-xl">
      <h3 className="text-blue-800 text-xl font-bold">Adoption</h3>
      <p className="text-gray-700 mt-2">Encouraging eco-friendly practices.</p>
    </div>

    <div className="p-8 bg-yellow-100 shadow rounded-xl">
      <h3 className="text-yellow-800 text-xl font-bold">Action</h3>
      <p className="text-gray-700 mt-2">Providing tools for waste reduction.</p>
    </div>

    <div className="p-8 bg-red-100 shadow rounded-xl">
      <h3 className="text-red-800 text-xl font-bold">Impact</h3>
      <p className="text-gray-700 mt-2">Building a cleaner, greener nation.</p>
    </div>

  </div>
</section>


      {/* Team */}
      <section className="max-w-6xl mx-auto py-16 px-6">
        <h2 className="text-2xl font-semibold text-center mb-10">Meet Our Team</h2>
        <div className="grid md:grid-cols-3 gap-10 place-items-center">
          <TeamCard name="Yukta Shree" role="Founder & Eco Advocate" />
          <TeamCard name="Priyanshu Singh" role="Waste Management Expert" />
          <TeamCard name="Soham Ghosh" role="Community Coordinator" />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-700 text-white py-14 px-6 text-center">
        <h2 className="text-2xl font-semibold mb-4">Join Our Mission</h2>
        <p className="text-base mb-6 opacity-90">
          Together, we can create cleaner cities and a healthier earth.
        </p>
        <button className="bg-white text-green-700 px-5 py-2.5 rounded-full text-base font-semibold shadow hover:bg-gray-200 transition">
          Get Started
        </button>
      </section>
    </div>
  );
}

export default AboutUs;
