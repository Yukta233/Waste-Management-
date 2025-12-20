import React, { useState } from 'react';
import Header from "./components/Header";

export default function BlogPage() {
  const posts = [
    { 
      id: 1, 
      title: 'Blueprint for Zero Waste', 
      category: 'Lifestyle',
      time: '5 min read',
      content: 'Transitioning to a zero-waste lifestyle starts in the kitchen. Replace paper towels with durable cloth rags, use glass jars for bulk shopping, and invest in silicone lids. By auditing your trash for one week, you can identify major plastic sources and swap them for compostable or reusable alternatives. Carrying your own cutlery and water bottle alone can divert hundreds of pounds of waste annually.',
      image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800',
      gridSize: 'md:col-span-2 md:row-span-2' // Big Feature
    },
    { 
      id: 2, 
      title: 'Solar Power Revolution', 
      category: 'Energy',
      time: '3 min read',
      content: 'Solar energy is now more affordable than ever. Modern photovoltaic cells work efficiently even on cloudy days. From full rooftop arrays to portable balcony kits for renters, solar is decentralizing power and cutting fossil fuel reliance.',
      image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=800',
      gridSize: 'md:col-span-1 md:row-span-1' 
    },
    { 
      id: 3, 
      title: 'Water Wise Habits', 
      category: 'Resource',
      time: '4 min read',
      content: 'A single leaking faucet can waste 3,000 gallons of water a year. Switch to low-flow showerheads and start harvesting rainwater for your garden to significantly lower your footprint and preserve our most vital resource.',
      image: 'https://images.unsplash.com/photo-1527067829737-40299c5895bc?auto=format&fit=crop&q=80&w=800',
      gridSize: 'md:col-span-1 md:row-span-1' 
    },
    { 
      id: 4, 
      title: 'Eco-Friendly Commuting', 
      category: 'Transport',
      time: '4 min read',
      content: 'Cycling and e-scooters are transforming urban travel. By choosing micro-mobility, you reduce city congestion, eliminate tailpipe emissions, and improve your personal health while saving on rising fuel costs.',
      image: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&q=80&w=800',
      gridSize: 'md:col-span-2 md:row-span-1' // Wide
    },
    { 
      id: 5, 
      title: 'Composting 101', 
      category: 'Gardening',
      time: '6 min read',
      content: 'Don’t throw away veggie scraps! Composting creates "black gold" for soil. Whether you use a backyard pile or a small indoor Bokashi bin, you can turn waste into nutrients and reduce landfill methane emissions.',
      image: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&q=80&w=800',
      gridSize: 'md:col-span-1 md:row-span-2' // Tall
    },
    { 
      id: 6, 
      title: 'Healing Urban Forests', 
      category: 'Nature',
      time: '2 min read',
      content: 'Trees are the lungs of our cities. Urban forestry supports biodiversity, provides natural cooling during heatwaves, and cleans the air we breathe. Planting even one native tree makes a difference.',
      image: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&q=80&w=800',
      gridSize: 'md:col-span-1 md:row-span-1' 
    },
    { 
      id: 7, 
      title: 'The Ocean Plastic Crisis', 
      category: 'Marine',
      time: '8 min read',
      content: 'Millions of tons of plastic enter our oceans yearly. We explore how community-led beach cleanups and new interceptor technologies are fighting to protect marine life and the human food chain.',
      image: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&q=80&w=800',
      gridSize: 'md:col-span-2 md:row-span-2' // Big Feature
    },
    { 
      id: 8, 
      title: 'Cost of Fast Fashion', 
      category: 'Style',
      time: '4 min read',
      content: 'Fast fashion is the second-largest polluter globally. Learn how to switch to ethical brands, organic cotton, and recycled polyester to end the cycle of textile waste and support fair labor.',
      image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800',
      gridSize: 'md:col-span-1 md:row-span-1' 
    },
    { 
      id: 9, 
      title: 'Regenerative Farming', 
      category: 'Food',
      time: '5 min read',
      content: 'Regenerative agriculture actively restores soil health and sequesters carbon. By supporting farmers who use cover crops and zero-tillage, we can eat healthier and help mitigate climate change.',
      image: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&q=80&w=800',
      gridSize: 'md:col-span-1 md:row-span-2' // Tall
    },
    { 
      id: 10, 
      title: 'The Circular Economy', 
      category: 'Business',
      time: '10 min read',
      content: 'The "take-make-waste" model is over. Circular business models focus on repair, reuse, and long-term durability. From tool libraries to repair cafes, the way we own items is changing for the better.',
      image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=800',
      gridSize: 'md:col-span-2 md:row-span-1' // Wide
    },
    { 
      id: 11, 
      title: 'Pollinators in Peril', 
      category: 'Biodiversity',
      time: '4 min read',
      content: 'One-third of our food depends on bees. Avoid pesticides and plant native wildflowers to provide habitats for these essential pollinators who are currently facing sharp declines in population.',
      image: 'https://images.unsplash.com/photo-1473973266408-ed4e27abdd47?auto=format&fit=crop&q=80&w=800',
      gridSize: 'md:col-span-1 md:row-span-1' 
    },
    { 
      id: 12, 
      title: 'Eco-Conscious Travel', 
      category: 'Travel',
      time: '7 min read',
      content: 'Explore the world without leaving a footprint. From carbon-offsetting flights to staying in locally-owned eco-lodges, learn how to be a traveler who gives back to the destination.',
      image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=800',
      gridSize: 'md:col-span-2 md:row-span-1' // Wide
    },
    { 
      id: 13, 
      title: 'The E-Waste Challenge', 
      category: 'Tech',
      time: '5 min read',
      content: 'Our gadgets are poisoning the earth. Discover certified recycling centers that strip electronics for rare minerals safely, preventing lead and mercury from leaching into our soil and water.',
      image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=800',
      gridSize: 'md:col-span-1 md:row-span-1' 
    },
   
  ];

  const [selectedPost, setSelectedPost] = useState(null);

  return (
    <div className="min-h-screen bg-[#F9FBFA] text-gray-800 font-sans selection:bg-green-100">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
                The Green <span className="text-green-600 underline decoration-green-200 underline-offset-8">Journal</span>
            </h1>
            <p className="mt-4 text-gray-500 font-medium max-w-xl leading-relaxed">
              Curated insights and actionable guides to help you transition into a more sustainable, earth-conscious lifestyle.
            </p>
        </div>

        {/* Bento Grid with Perfect Alignment */}
        <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[250px] gap-6">
          {posts.map((post) => (
            <div 
              key={post.id} 
              onClick={() => setSelectedPost(post)}
              className={`${post.gridSize} group relative rounded-[2.5rem] overflow-hidden cursor-pointer bg-white border border-gray-100 shadow-sm transition-all duration-700 hover:shadow-2xl hover:-translate-y-1`}
            >
              <img
                src={post.image}
                alt={post.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-70 group-hover:opacity-80 transition-opacity"></div>
              
              <div className="absolute bottom-0 left-0 p-8 w-full transform transition-transform duration-500 group-hover:-translate-y-2">
                <span className="text-[10px] font-bold tracking-[0.2em] text-white uppercase bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
                    {post.category}
                </span>
                <h3 className="text-white text-xl md:text-2xl font-bold mt-4 leading-tight">
                    {post.title}
                </h3>
                <div className="flex items-center mt-4 text-gray-300 text-xs font-medium space-x-3 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                    <span>{post.time}</span>
                    <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                    <span className="text-green-400 font-bold">Read Full Story →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modern Side Drawer */}
      <div 
        className={`fixed inset-0 z-[100] transition-opacity duration-500 ${selectedPost ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setSelectedPost(null)}></div>

        <div className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-500 ease-out ${selectedPost ? 'translate-x-0' : 'translate-x-full'}`}>
          {selectedPost && (
            <div className="h-full flex flex-col overflow-y-auto">
              <div className="relative h-80 flex-shrink-0">
                <img src={selectedPost.image} className="w-full h-full object-cover" alt="" />
                <button 
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-6 left-6 w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-800 shadow-xl hover:bg-green-600 hover:text-white transition-all"
                >✕</button>
              </div>
              
              <div className="p-10">
                <div className="flex items-center space-x-2 text-green-600 font-bold text-xs uppercase tracking-[0.2em] mb-4">
                    <span>{selectedPost.category}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-400 font-medium lowercase italic">{selectedPost.time}</span>
                </div>
                <h2 className="text-3xl font-black text-gray-900 leading-tight mb-6">{selectedPost.title}</h2>
                <div className="w-12 h-1 bg-green-500 mb-8 rounded-full"></div>
                <p className="text-gray-600 leading-relaxed text-lg mb-8">{selectedPost.content}</p>
                
                <div className="p-6 bg-neutral-50 rounded-3xl border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-2 italic">Impact Statement:</h4>
                    <p className="text-gray-600 text-sm">By sharing this knowledge and applying even one tip today, you are actively participating in the restoration of our global ecosystem.</p>
                </div>
              </div>
              
              <footer className="mt-auto p-8 border-t border-gray-100">
                 <button className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all">
                    Bookmark This Insight
                 </button>
              </footer>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-20 py-16 text-center border-t border-gray-100 bg-white">
        <h2 className="text-2xl font-black text-green-700 mb-2">SwachhSetu</h2>
        <p className="text-gray-400 text-sm font-medium">© 2025 — Bridging the gap to a greener future.</p>
      </footer>
    </div>
  );
}