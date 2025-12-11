import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function BlogPage() {
  const posts = [
    { 
      id: 1, 
      title: 'Sustainable Living Tips #1', 
      content: 'Full details about sustainable living tip 1. This includes reducing single-use plastics, starting composting at home, saving energy, and adopting a plant-based diet.',
      image: 'https://source.unsplash.com/400x300/?sustainable,eco,1'
    },
    { 
      id: 2, 
      title: 'Sustainable Living Tips #2', 
      content: 'Full details about sustainable living tip 2. Focus on water conservation, recycling household waste, upcycling old materials, and using eco-friendly products.',
      image: 'https://source.unsplash.com/400x300/?sustainable,eco,2'
    },
    { 
      id: 3, 
      title: 'Sustainable Living Tips #3', 
      content: 'Full details about sustainable living tip 3. Emphasize public transportation, biking, and walking to reduce carbon footprint. Also support local farmers.',
      image: 'https://source.unsplash.com/400x300/?sustainable,eco,3'
    },
    { 
      id: 4, 
      title: 'Sustainable Living Tips #4', 
      content: 'Full details about sustainable living tip 4. Switch to renewable energy, use energy-efficient appliances, and practice mindful consumption.',
      image: 'https://source.unsplash.com/400x300/?sustainable,eco,4'
    },
    { 
      id: 5, 
      title: 'Sustainable Living Tips #5', 
      content: 'Full details about sustainable living tip 5. Educate community about recycling, participate in clean-up drives, and spread awareness about waste management.',
      image: 'https://source.unsplash.com/400x300/?sustainable,eco,5'
    },
    { 
      id: 6, 
      title: 'Sustainable Living Tips #6', 
      content: 'Full details about sustainable living tip 6. Plant trees, create green spaces, and maintain biodiversity in local areas. Encourage community gardens, native plants, and green rooftops for a sustainable environment.',
      image: 'https://source.unsplash.com/400x300/?sustainable,eco,6'
    },
  ];

  const [selectedPost, setSelectedPost] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6">
      {/* Header */}
      <header className="relative py-6 bg-green-700 text-white rounded-2xl shadow mb-10 flex items-center justify-center">
        {/* Home Button - Left side */}
        <Link 
          to="/" 
          className="absolute left-6 bg-white text-green-700 font-semibold px-5 py-2 rounded-full shadow hover:bg-gray-200 transition"
        >
          Home
        </Link>

        <div className="text-center">
          <h1 className="text-5xl font-bold mb-2">Eco Blog</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Explore articles on waste management, recycling tips, sustainability hacks, and more.
          </p>
        </div>
      </header>

      {/* Blog Cards */}
      <section className="grid md:grid-cols-3 gap-10 max-w-7xl mx-auto">
        {posts.map((post) => (
          <div 
            key={post.id} 
            className="relative rounded-2xl overflow-hidden shadow-lg bg-white border border-gray-200 cursor-pointer transform transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl group"
            onClick={() => setSelectedPost(post)}
          >
            <div className="relative h-48 overflow-hidden rounded-t-2xl">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-2 text-green-700">{post.title}</h2>
              <p className="text-gray-600">{post.content.substring(0, 100)}...</p>
              <button className="mt-4 text-green-700 font-semibold hover:underline">Read More →</button>
            </div>
          </div>
        ))}
      </section>

      {/* Modal */}
      {selectedPost && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setSelectedPost(null)}
          ></div>
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 relative shadow-2xl z-10 transform scale-90 animate-scaleIn">
            <button
              className="absolute top-4 right-4 text-gray-600 font-bold text-2xl"
              onClick={() => setSelectedPost(null)}
            >
              ×
            </button>
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4 text-green-700">{selectedPost.title}</h2>
              <img src={selectedPost.image} alt={selectedPost.title} className="w-full rounded-lg mb-4" />
              <p className="text-gray-700">{selectedPost.content}</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center mt-16 py-6 text-gray-600">
        © 2025 EcoWaste Blog — All Rights Reserved
      </footer>

      <style>
        {`
          @keyframes scaleIn {
            0% { transform: scale(0.9); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          .animate-scaleIn { animation: scaleIn 0.3s ease-out forwards; }
        `}
      </style>
    </div>
  );
}
