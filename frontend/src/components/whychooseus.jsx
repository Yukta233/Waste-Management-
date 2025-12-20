import React from 'react';
import { ShieldCheck, Banknote, MapPinned, Headset } from 'lucide-react';

export default function WhyChooseUs() {
  const reasons = [
    {
      title: "Certified Recyclers",
      desc: "We partner only with verified recycling experts for sustainable practices.",
      icon: <ShieldCheck className="w-8 h-8 text-green-600" />,
      glow: "group-hover:shadow-green-500/20"
    },
    {
      title: "Transparent Pricing",
      desc: "Real-time waste value tracking ensures fair pricing for everyone.",
      icon: <Banknote className="w-8 h-8 text-emerald-600" />,
      glow: "group-hover:shadow-emerald-500/20"
    },
    {
      title: "Digital Tracking",
      desc: "Track every waste pickup and recycling journey digitally.",
      icon: <MapPinned className="w-8 h-8 text-teal-600" />,
      glow: "group-hover:shadow-teal-500/20"
    },
    {
      title: "Reliable Support",
      desc: "Our team is always available to assist users and recyclers promptly.",
      icon: <Headset className="w-8 h-8 text-green-600" />,
      glow: "group-hover:shadow-green-400/20"
    },
  ];

  return (
    <section className="relative px-6 md:px-10 pt-24 pb-40 overflow-hidden bg-[#f8faf9]">
      {/* Dynamic Background Elements - These make the "Glass" effect visible */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-200/40 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-200/40 rounded-full blur-[120px]"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <span className="text-green-600 font-bold tracking-[0.3em] uppercase text-xs mb-4 block">
            The SwachhSetu Advantage
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Why Choose <span className="text-green-600">Us?</span>
          </h2>
          <div className="w-20 h-1.5 bg-green-500/20 mx-auto mt-6 rounded-full overflow-hidden">
             <div className="w-1/2 h-full bg-green-500 animate-[loading_2s_ease-in-out_infinite]"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {reasons.map((card, index) => (
            <div
              key={index}
              className="group relative h-full"
            >
              {/* Card Container - Transparent Glass Design */}
              <div className={`relative h-full p-8 rounded-[2.5rem] border border-white/60 bg-white/30 backdrop-blur-xl transition-all duration-500 group-hover:-translate-y-4 group-hover:bg-white/50 group-hover:border-green-300 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] ${card.glow} group-hover:shadow-2xl`}>
                
                {/* Floating Icon Wrapper */}
                <div className="relative w-16 h-16 mb-8 flex items-center justify-center">
                  <div className="absolute inset-0 bg-green-200/50 rounded-2xl rotate-6 transition-transform group-hover:rotate-12 group-hover:scale-110 duration-500"></div>
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white flex items-center justify-center group-hover:scale-105 transition-all duration-500">
                    {card.icon}
                  </div>
                </div>

                <h3 className="text-2xl font-black mb-4 text-gray-800 tracking-tight group-hover:text-green-700 transition-colors">
                  {card.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed font-medium text-[15px]">
                  {card.desc}
                </p>

                {/* Decorative Accent */}
                <div className="mt-6 flex items-center text-green-600 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                  <span className="text-xs font-bold tracking-widest uppercase">Verified</span>
                  <div className="ml-2 w-1 h-1 bg-green-500 rounded-full"></div>
                </div>
              </div>

              {/* Bottom Glow Effect */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-green-400/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          ))}
        </div>
      </div>

      <style>
        {`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}
      </style>
    </section>
  );
}