import React from "react";
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-green-700 text-white pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-6 md:px-10">

        {/* Top section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">

          {/* Logo / Brand */}
          <div className="flex flex-col max-w-xs">
            <h1 className="text-2xl font-bold">EcoMarket</h1>
            <p className="text-sm mt-1">
              Building a Greener Tomorrow. Transforming waste into valuable resources
              while supporting sustainable communities and eco-friendly practices.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col sm:flex-row gap-8">
            <div>
              <h4 className="font-semibold mb-2">Quick Links</h4>
              <ul className="space-y-1 text-sm">
                <li><a href="#how-it-works" className="hover:underline">About</a></li>
                <li><a href="#marketplace" className="hover:underline">Marketplace</a></li>
                <li><a href="#why-choose" className="hover:underline">Service Listing</a></li>
                <li><a href="#contact" className="hover:underline">Contact</a></li>
              </ul>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="font-semibold mb-2">Follow Us</h4>
              <div className="flex gap-3 text-lg">
                {[
                  { icon: <FaFacebookF />, link: "#" },
                  { icon: <FaTwitter />, link: "#" },
                  { icon: <FaLinkedinIn />, link: "#" },
                  { icon: <FaInstagram />, link: "#" },
                ].map((item, index) => (
                  <a
                    key={index}
                    href={item.link}
                    className="bg-white text-green-600 p-3 rounded-full shadow-lg transform transition hover:scale-110 hover:bg-green-50 hover:text-green-800"
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="flex flex-col mt-4 md:mt-0 max-w-xs">
            <h4 className="font-semibold mb-2">Subscribe</h4>
            <p className="text-sm mb-2">Get the latest updates and news about EcoMarket.</p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="px-4 py-2 rounded-l-lg text-gray-800 outline-none w-full"
              />
              <button className="bg-green-800 px-4 py-2 rounded-r-lg font-semibold hover:bg-green-700 transition">
                Subscribe
              </button>
            </div>
          </div>

        </div>

        {/* Bottom section */}
        <div className="border-t border-green-500 pt-6 text-center text-sm">
          © 2025 EcoMarket — All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
