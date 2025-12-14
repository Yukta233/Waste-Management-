import React from "react";

const testimonials = [
  {
    name: "Ananya Sharma",
    role: "Household User",
    message:
      "EcoMarket has completely changed how we manage waste at home. Pickup scheduling and tracking are effortless.",
  },
  {
    name: "Rahul Mehta",
    role: "Recycling Expert",
    message:
      "The platform ensures transparency and helps us reach genuine users efficiently.",
  },
  {
    name: "Priya Verma",
    role: "Service Provider",
    message:
      "Digital records and fair pricing have improved trust and efficiency in our services.",
  },
  {
    name: "Amit Kapoor",
    role: "Community Partner",
    message:
      "EcoMarket promotes responsible waste disposal and real environmental impact.",
  },
  {
    name: "Sneha Iyer",
    role: "Apartment Resident",
    message:
      "Knowing my waste is recycled properly gives me confidence and peace of mind.",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-white py-28 px-6 md:px-10 overflow-hidden">
      {/* Heading */}
      <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-6">
        What People Say About EcoMarket
      </h2>

      <p className="text-center text-gray-600 max-w-2xl mx-auto mb-16">
        Trusted by households, recyclers, and service providers working together
        for a cleaner, greener future.
      </p>

      {/* Marquee Wrapper */}
      <div className="relative overflow-hidden py-6">
        <div className="flex gap-6 animate-marquee">
          {[...testimonials, ...testimonials].map((item, index) => (
            <div
              key={index}
              className="w-72 shrink-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-md transition hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold">
                  {item.name.charAt(0)}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    {item.name}
                  </h4>
                  <p className="text-xs font-medium text-green-600">
                    {item.role}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                “{item.message}”
              </p>
            </div>
          ))}
        </div>

        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white"></div>
      </div>

      {/* Animation styles */}
      <style>
        {`
          @keyframes marquee {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(-50%);
            }
          }

          .animate-marquee {
            animation: marquee 30s linear infinite;
          }

          .animate-marquee:hover {
            animation-play-state: paused;
          }
        `}
      </style>
    </section>
  );
}
