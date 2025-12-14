import React from "react";

export default function TextAnimate({ text, className = "" }) {
  return (
    <span className={`inline-block ${className}`}>
      {text.split("").map((char, index) => (
        <span
          key={index}
          className="inline-block animate-char"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}

      <style>
        {`
          @keyframes blurInUp {
            0% {
              opacity: 0;
              transform: translateY(20px);
              filter: blur(8px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
              filter: blur(0);
            }
          }

          .animate-char {
            animation: blurInUp 0.6s ease forwards;
            opacity: 0;
          }
        `}
      </style>
    </span>
  );
}
