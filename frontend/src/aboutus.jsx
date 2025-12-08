import React from "react";
 function AboutUs() {
  return (
    <div className="bg-gray-50 text-gray-800 leading-relaxed">

      <section className="w-full bg-green-700 text-white py-20 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">About Us</h1>
        <p className="max-w-2xl mx-auto text-lg opacity-90">
          Building a cleaner, greener future through responsible waste management,
          sustainability awareness, and community participation.
        </p>
      </section>

      <section className="max-w-6xl mx-auto py-16 px-6">
        <h2 className="text-3xl font-semibold mb-6 text-center">Our Story</h2>
        <p className="text-lg text-gray-700 max-w-4xl mx-auto text-center">
          We started this platform with a mission to simplify waste management and
          encourage eco-friendly practices. From connecting households with trusted
          service providers to spreading awareness about composting and recycling,
          our goal is to make sustainability accessible to everyone.
        </p>
      </section>

      <section className="bg-white py-16 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10">

          <div className="bg-green-100 p-8 rounded-xl shadow">
            <h3 className="text-2xl font-semibold mb-3 text-green-800">Our Mission</h3>
            <p className="text-gray-700 text-lg">
              To reduce waste generation, promote sustainable lifestyle habits, and
              offer reliable waste collection and composting solutions for all users.
            </p>
          </div>

          <div className="bg-blue-100 p-8 rounded-xl shadow">
            <h3 className="text-2xl font-semibold mb-3 text-blue-800">Our Vision</h3>
            <p className="text-gray-700 text-lg">
              To build India’s most trusted digital waste management ecosystem,
              empowering communities to protect the environment.
            </p>
          </div>

        </div>
      </section>

      <section className="py-16 px-6 bg-gray-100">
        <h2 className="text-3xl font-semibold text-center mb-10">Our Impact</h2>
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 text-center">

          <div className="bg-white p-8 shadow rounded-xl">
            <h3 className="text-4xl font-bold text-green-700">500+</h3>
            <p className="mt-2 text-gray-600">Users Educated</p>
          </div>

          <div className="bg-white p-8 shadow rounded-xl">
            <h3 className="text-4xl font-bold text-blue-700">120+</h3>
            <p className="mt-2 text-gray-600">Pickups Completed</p>
          </div>

          <div className="bg-white p-8 shadow rounded-xl">
            <h3 className="text-4xl font-bold text-yellow-600">80+</h3>
            <p className="mt-2 text-gray-600">Composting Experts</p>
          </div>

          <div className="bg-white p-8 shadow rounded-xl">
            <h3 className="text-4xl font-bold text-red-600">95%</h3>
            <p className="mt-2 text-gray-600">Positive Feedback</p>
          </div>

        </div>
      </section>

      <section className="max-w-6xl mx-auto py-16 px-6">
        <h2 className="text-3xl font-semibold text-center mb-10">Meet Our Team</h2>
        <div className="grid md:grid-cols-3 gap-10">

          <div className="bg-white shadow p-6 rounded-xl text-center">
            <div className="w-24 h-24 mx-auto bg-gray-300 rounded-full mb-4"></div>
            <h4 className="text-xl font-bold">Yukta Shree</h4>
            <p className="text-gray-600">Founder & Eco Advocate</p>
          </div>

          <div className="bg-white shadow p-6 rounded-xl text-center">
            <div className="w-24 h-24 mx-auto bg-gray-300 rounded-full mb-4"></div>
            <h4 className="text-xl font-bold">Priyanshu Singh</h4>
            <p className="text-gray-600">Waste Management Expert</p>
          </div>

          <div className="bg-white shadow p-6 rounded-xl text-center">
            <div className="w-24 h-24 mx-auto bg-gray-300 rounded-full mb-4"></div>
            <h4 className="text-xl font-bold">Soham Ghosh</h4>
            <p className="text-gray-600">Community Coordinator</p>
          </div>

        </div>
      </section>

      <section className="bg-green-700 text-white py-14 px-6 text-center">
        <h2 className="text-3xl font-semibold mb-4">Join Our Mission</h2>
        <p className="text-lg mb-6 opacity-90">
          Together, we can create cleaner cities and a healthier earth.
        </p>
        <button className="bg-white text-green-700 px-6 py-3 rounded-full text-lg font-semibold shadow hover:bg-gray-200 transition">
          Get Started
        </button>
      </section>

    </div>
  );
}
export default AboutUs