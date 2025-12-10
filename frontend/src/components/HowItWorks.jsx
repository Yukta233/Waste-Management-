import React, { useState, useEffect, useRef } from "react";

import step1 from "../assets/step1.png";
import step2 from "../assets/step2.png";
import step3 from "../assets/step3.png";
import step4 from "../assets/step4.png";

const steps = [
  {
    title: "1. Waste Collection",
    text: "Garbage is collected from homes, offices, and public areas using modern, eco-friendly trucks, ensuring minimal carbon emissions and hygienic handling.",
    img: step1,
  },
  {
    title: "2. Sorting & Categorization",
    text: "Collected waste is carefully sorted into categories — plastic, metal, organic, e-waste, and more — for efficient recycling and proper disposal.",
    img: step2,
  },
  {
    title: "3. Cleaning & Processing",
    text: "Materials undergo thorough cleaning, crushing, shredding, or melting in specialized recycling units to prepare them for reuse in manufacturing new products.",
    img: step3,
  },
  {
    title: "4. Dispatch & Delivery",
    text: "Processed and recycled materials are packed securely and delivered to certified recyclers, manufacturers, or facilities for creating new sustainable products.",
    img: step4,
  },
];


export default function HowItWorksModal() {
  const [index, setIndex] = useState(0);
  const modalRef = useRef(null);

  // Auto slide
  useEffect(() => {
    const auto = setInterval(() => {
      setIndex((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(auto);
  }, []);

  // 3D tilt
  const handleMouseMove = (e) => {
    const modal = modalRef.current;
    const rect = modal.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    modal.style.transform = `
      perspective(1200px)
      rotateX(${(-y / 20)}deg)
      rotateY(${(x / 20)}deg)
      scale(1.02)
    `;
  };

  const resetTilt = () => {
    modalRef.current.style.transform =
      "perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)";
  };

  return (
    <div className="w-full flex justify-center mt-16">
      <div
        ref={modalRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={resetTilt}
        className="
          w-[90%] max-w-5xl rounded-3xl 
          bg-white/20 backdrop-blur-xl shadow-2xl 
          border border-white/30 p-10 flex flex-col items-center
          transition-all duration-500
          scale-100 animate-[fadeIn_0.4s_ease-out]
        "
      >
        <h2 className="text-4xl font-bold text-black mb-6">
          How It Works
        </h2>

        <div className="w-full flex items-center justify-between gap-10">
          {/* LEFT TEXT */}
          <div className="w-1/2">
            <h3 className="text-2xl font-semibold text-green-700 mb-3">
              {steps[index].title}
            </h3>
            <p className="text-gray-900/90 text-lg leading-relaxed">
              {steps[index].text}
            </p>
          </div>

          {/* RIGHT IMAGE */}
          <div className="w-1/2 flex justify-center">
            <div
              className="
                w-full max-w-[380px] h-[260px]
                rounded-2xl overflow-hidden shadow-xl
                bg-white/30 backdrop-blur-md border border-white/40
              "
            >
              <img
                src={steps[index].img}
                alt="process"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* DOTS */}
        <div className="flex gap-2 mt-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                i === index ? "bg-green-600 scale-110" : "bg-white/50"
              }`}
            />
          ))}
        </div>

        {/* ARROWS */}
        <div className="flex gap-6 mt-6">
          <button
            onClick={() =>
              setIndex((prev) => (prev - 1 + steps.length) % steps.length)
            }
            className="
              p-3 w-12 h-12 flex items-center justify-center
              border border-white rounded-full text-black
              hover:bg-green-700 hover:text-black transition-all
            "
          >
            ❮
          </button>
          <button
            onClick={() =>
              setIndex((prev) => (prev + 1) % steps.length)
            }
            className="
              p-3 w-12 h-12 flex items-center justify-center
              border border-white rounded-full text-black
              hover:bg-green-700 hover:text-black transition-all
            "
          >
            ❯
          </button>
        </div>
      </div>
    </div>
  );
}
