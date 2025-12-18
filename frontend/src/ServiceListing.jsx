import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "./components/Header";
export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [keyword, setKeyword] = useState("");
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api/v1";

  // STATIC DEMO DATA
  const staticServices = [
    {
      _id: "static1",
      title: "Home Compost Setup",
      description:
        "A complete composting setup for your home. Includes bins, guides, and expert assistance.",
      price: 500,
      location: "Bangalore",
      photos: [
        "https://images.unsplash.com/photo-1600340675645-6f7c8fbea136?auto=format&fit=crop&w=900&q=60",
      ],
      provider: { name: "Green Living Experts" },
      domain: "Residential",
    },
    {
      _id: "static2",
      title: "Kitchen Waste Weekly Pickup",
      description:
        "Doorstep kitchen waste pickup service for 1 month. Eco-friendly certified.",
      price: 300,
      location: "Delhi",
      photos: [
        "https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=900&q=60",
      ],
      provider: { name: "EcoWaste Collectors" },
      domain: "Residential",
    },
    {
      _id: "static3",
      title: "Corporate Waste Management Plan",
      description:
        "Waste disposal and recycling solution for offices, business parks, and IT companies.",
      price: 1500,
      location: "Mumbai",
      photos: [
        "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=60",
      ],
      provider: { name: "CleanCorp Solutions" },
      domain: "Commercial",
    },
    {
      _id: "static4",
      title: "Municipal Bulk Waste Pickup",
      description:
        "Large-scale bulk waste pickup for municipal bodies and local authorities.",
      price: 5000,
      location: "Chennai",
      photos: [
        "https://images.unsplash.com/photo-1600585154356-596af9009e53?auto=format&fit=crop&w=900&q=60",
      ],
      provider: { name: "UrbanClean India" },
      domain: "Municipal",
    },
  ];

  // Static catalog for sub-services to ensure detailed listings for each selection
  const expertOptions = [
    {
      key: "home-compost-setup",
      title: "Home Compost Setup Service",
      bullets: [
        "Experts visit homes and help set up:",
        "• Compost bins",
        "• Compost pits",
        "• Balcony composters",
        "• Vermicompost units (using earthworms)",
        "They also teach the household how to maintain it.",
      ],
      cta: "Get Home Setup",
      photo: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1200&q=60",
    },
    {
      key: "kitchen-waste-composting",
      title: "Kitchen Waste Composting Service",
      bullets: [
        "Experts collect: vegetable peels, fruit waste, tea powder, leftover cooked food",
        "Composting can be: On-site (at your home) or Off-site (at their facility)",
      ],
      cta: "Schedule Pickup",
      photo: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=60",
    },
    {
      key: "garden-composting",
      title: "Garden Composting Service",
      bullets: [
        "For gardens or farms: turning leaves and plant waste into compost",
        "Setup of large pits and organic manure preparation",
      ],
      cta: "Plan Garden Service",
      photo: "https://images.unsplash.com/photo-1524594227087-1d4eabbf21d7?auto=format&fit=crop&w=1200&q=60",
    },
    {
      key: "community-compost-management",
      title: "Community or Society Compost Management",
      bullets: [
        "For apartments, hostels, schools: install and manage large composters",
        "Provide staff, daily ops, monitoring and quality checks",
      ],
      cta: "Setup for Community",
      photo: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=60",
    },
    {
      key: "composting-workshops",
      title: "Composting Workshops or Training",
      bullets: [
        "Offline/Online sessions, awareness programs, eco-living training",
        "Learn: composting at home, segregation, bin maintenance, avoid smell/flies",
      ],
      cta: "Book a Workshop",
      photo: "https://images.unsplash.com/photo-1543269664-76bc3997d9ea?auto=format&fit=crop&w=1200&q=60",
    },
    {
      key: "sell-compost",
      title: "Sell Compost (Organic Manure)",
      bullets: [
        "Available in 1kg, 5kg, 10kg packs",
        "Vermicompost and organic fertilizer mixes",
      ],
      cta: "Buy Compost",
      photo: "https://images.unsplash.com/photo-1524592380637-41462ba4d87d?auto=format&fit=crop&w=1200&q=60",
    },
  ];

  const subcategoryCatalog = {
    "home compost bin setup": [
      {
        _id: "sub_home_bin_1",
        title: "Home Compost Bin Setup - Basic",
        description:
          "End-to-end compost bin setup for households including bin, starter culture, setup and training.",
        price: 1200,
        location: "Bangalore",
        photos: [
          "https://images.unsplash.com/photo-1524592380637-41462ba4d87d?auto=format&fit=crop&w=900&q=60",
        ],
        provider: { name: "Green Living Experts" },
        domain: "Residential",
      },
      {
        _id: "sub_home_bin_2",
        title: "Home Compost Bin Setup - Premium",
        description:
          "Premium odor-free composting system with aeration kit, training and two follow-up visits.",
        price: 2200,
        location: "Delhi",
        photos: [
          "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=60",
        ],
        provider: { name: "EcoWaste Collectors" },
        domain: "Residential",
      },
    ],
    "kitchen waste composting": [
      {
        _id: "sub_kitchen_1",
        title: "Kitchen Waste Composting - Monthly Support",
        description:
          "Weekly support and monitoring for kitchen waste composting with odor control tips.",
        price: 800,
        location: "Pune",
        photos: [
          "https://images.unsplash.com/photo-1584268804671-5e1b0d4ecb5d?auto=format&fit=crop&w=900&q=60",
        ],
        provider: { name: "CleanCorp Solutions" },
        domain: "Residential",
      },
    ],
    "garden waste composting": [
      {
        _id: "sub_garden_1",
        title: "Garden Waste Composting Service",
        description:
          "On-site garden waste composting with leaf shredding and layering guidance.",
        price: 1500,
        location: "Hyderabad",
        photos: [
          "https://images.unsplash.com/photo-1485406134976-17c4f9b13006?auto=format&fit=crop&w=900&q=60",
        ],
        provider: { name: "UrbanClean India" },
        domain: "Residential",
      },
    ],
    "society/community composting": [
      {
        _id: "sub_society_1",
        title: "Community Composting Setup (Society)",
        description:
          "Turnkey composting solution for housing societies including training of staff/residents.",
        price: 5000,
        location: "Mumbai",
        photos: [
          "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=900&q=60",
        ],
        provider: { name: "Green Living Experts" },
        domain: "Residential",
      },
    ],
    "composting workshops": [
      {
        _id: "sub_workshop_1",
        title: "Composting Workshop (2 Hours)",
        description:
          "Interactive hands-on composting session for families and communities.",
        price: 600,
        location: "Chennai",
        photos: [
          "https://images.unsplash.com/photo-1543269664-76bc3997d9ea?auto=format&fit=crop&w=900&q=60",
        ],
        provider: { name: "EcoWaste Collectors" },
        domain: "Residential",
      },
    ],
    "selling organic compost": [
      {
        _id: "sub_compost_sell_1",
        title: "Organic Compost - 10kg Bag",
        description:
          "High-quality, nutrient-rich compost sourced from verified facilities.",
        price: 450,
        location: "Bangalore",
        photos: [
          "https://images.unsplash.com/photo-1586201375761-83865001e31b?auto=format&fit=crop&w=900&q=60",
        ],
        provider: { name: "UrbanClean India" },
        domain: "Residential",
      },
    ],
    "household waste collection": [
      {
        _id: "sub_household_1",
        title: "Household Waste Collection - Monthly",
        description:
          "Door-to-door segregated waste collection service, 3 days/week.",
        price: 500,
        location: "Delhi",
        photos: [
          "https://images.unsplash.com/photo-1596742578443-7682ef52d7c3?auto=format&fit=crop&w=900&q=60",
        ],
        provider: { name: "City Clean Services" },
        domain: "Residential",
      },
    ],
    "recycling pickup (plastic, paper, glass, metal)": [
      {
        _id: "sub_recycle_1",
        title: "Bulk Recycling Pickup",
        description:
          "Scheduled pickup for recyclable materials with weight-based pricing.",
        price: 900,
        location: "Bangalore",
        photos: [
          "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=900&q=60",
        ],
        provider: { name: "CleanCorp Solutions" },
        domain: "Commercial",
      },
    ],
    "e-waste collection (mobiles, chargers, batteries)": [
      {
        _id: "sub_ewaste_1",
        title: "E-waste Collection Drive",
        description:
          "Certified e-waste pickup and safe disposal for offices and homes.",
        price: 700,
        location: "Pune",
        photos: [
          "https://images.unsplash.com/photo-1561171721-7f8da0de0d1b?auto=format&fit=crop&w=900&q=60",
        ],
        provider: { name: "EcoWaste Collectors" },
        domain: "Commercial",
      },
    ],
    "garden waste removal": [
      {
        _id: "sub_garden_remove_1",
        title: "Garden Waste Removal",
        description:
          "Collection and eco-friendly disposal of garden prunings and leaf litter.",
        price: 600,
        location: "Hyderabad",
        photos: [
          "https://images.unsplash.com/photo-1522171908360-5c3b446f2fd5?auto=format&fit=crop&w=900&q=60",
        ],
        provider: { name: "UrbanClean India" },
        domain: "Residential",
      },
    ],
    "waste segregation assistance": [
      {
        _id: "sub_segregation_1",
        title: "Waste Segregation Assistance",
        description:
          "On-site audit, training, and setup of color-coded bins for better segregation.",
        price: 1100,
        location: "Mumbai",
        photos: [
          "https://images.unsplash.com/photo-1526666923127-b2970f64b422?auto=format&fit=crop&w=900&q=60",
        ],
        provider: { name: "City Clean Services" },
        domain: "Commercial",
      },
    ],
    "zero-waste event management": [
      {
        _id: "sub_zero_waste_1",
        title: "Zero-waste Event Management",
        description:
          "End-to-end planning for zero-waste events: segregation points, volunteers, logistics, and reporting.",
        price: 5000,
        location: "Chennai",
        photos: [
          "https://images.unsplash.com/photo-1485905551120-1c75aa0bdc9c?auto=format&fit=crop&w=900&q=60",
        ],
        provider: { name: "Green Living Experts" },
        domain: "Commercial",
      },
    ],
  };

  const [domain, setDomain] = useState("Residential");
  const [selectedService, setSelectedService] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();

  // Second-level subcategory state
  const [subcategory, setSubcategory] = useState("");
  
  // FILTERS
  
  // Availability/Pricing form (for providers)
  
  const navigate = useNavigate();
  const heading = subcategory || `${domain} Services`;

  const mapFrontToBackendCategory = (sub) => {
    if (!sub) return "";
    const s = String(sub).toLowerCase();
    if (s.includes("home compost")) return "home-setup";
    if (s.includes("kitchen waste")) return "kitchen-compost";
    if (s.includes("garden")) return "garden-compost";
    if (s.includes("society") || s.includes("community")) return "community-compost";
    if (s.includes("workshop")) return "workshop-training";
    if (s.includes("selling organic compost") || s.includes("buy compost") || s.includes("sell compost")) return "compost-product";
    return "";
  };

  const fetchServices = async () => {
    try {
      const params = {
        status: 'active',
      };
      const mappedCat = mapFrontToBackendCategory(subcategory);
      if (mappedCat) params.category = mappedCat;

      const res = await axios.get(`${API_BASE}/services`, { params });
      const payload = res.data?.data?.services || res.data?.services || [];

      const normalized = payload.map(svc => ({
        _id: svc._id,
        title: svc.title,
        description: svc.description,
        price: svc.price,
        location: svc.location?.city || svc.city || '',
        photos: (Array.isArray(svc.images) && svc.images.length ? svc.images : ["https://via.placeholder.com/300"]).slice(0,1),
        images: Array.isArray(svc.images) ? svc.images : [],
        provider: {
          id: svc.provider?._id,
          name: svc.provider?.fullName || svc.provider?.companyName || 'Service Expert',
          photo: svc.provider?.profilePhoto || '',
        },
        domain: 'Residential',
        category: svc.category || '',
        tags: Array.isArray(svc.tags) ? svc.tags : [],
        features: Array.isArray(svc.features) ? svc.features : [],
        specifications: (svc.specifications && typeof svc.specifications === 'object') ? svc.specifications : {},
        availability: svc.availability || '',
        serviceArea: Array.isArray(svc.serviceArea) ? svc.serviceArea : [],
        currency: svc.currency || 'INR',
        priceType: svc.priceType || 'fixed',
        status: svc.status,
      }));

      setAllServices(normalized);

      if (!normalized.length) {
        const byDomain = staticServices.filter((s) => s.domain === domain);
        let fallback = byDomain;
        if (subcategory) {
          const cat = subcategoryCatalog[subcategory.toLowerCase()] || [];
          fallback = cat.length ? cat.filter((s) => !domain || s.domain === domain) : byDomain;
        }
        setServices(fallback);
      } else {
        setServices(normalized);
      }
    } catch {
      const byDomain = staticServices.filter((s) => s.domain === domain);
      let fallback = byDomain;
      if (subcategory) {
        const cat = subcategoryCatalog[subcategory.toLowerCase()] || [];
        fallback = cat.length ? cat.filter((s) => !domain || s.domain === domain) : byDomain;
      }
      setServices(fallback);
    }
  };
66
  // Normalize domain values from query param to canonical labels
  const normalizeDomain = (raw) => {
    if (!raw) return null;
    const val = String(raw).toLowerCase();
    if (["residential", "resident", "home"].includes(val)) return "Residential";
    if (["commercial", "commerical", "business", "corporate"].includes(val)) return "Commercial";
    if (["municipal", "community", "community-services", "communityservice"].includes(val)) return "Municipal";
    return null;
  };

  // Sync domain from query string when URL changes
  useEffect(() => {
    const qDomain = searchParams.get("domain");
    const normalized = normalizeDomain(qDomain) || "Residential";
    setDomain((prev) => (prev !== normalized ? normalized : prev));

    // Read subcategory from URL if present
    const qSub = searchParams.get("subcategory") || "";
    setSubcategory(qSub);
  }, [searchParams]);

  useEffect(() => {
    fetchServices();
  }, [domain, subcategory]);

  // Auto-apply filters whenever any filter input changes
  useEffect(() => {
    const t = setTimeout(() => {
      fetchServices();
    }, 250);
    return () => clearTimeout(t);
  }, []);

  // Compute filtered services based on keyword locally for reliability
  useEffect(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) {
      setServices(allServices);
      return;
    }
    const filtered = allServices.filter(s => {
      const hay = [
        s.title,
        s.description,
        s.location,
        s.provider?.name,
        s.category,
        ...(s.tags || [])
      ]
        .filter(Boolean)
        .join(" \n ")
        .toLowerCase();
      return hay.includes(k);
    });
    setServices(filtered);
  }, [keyword, allServices]);

  const openModal = (service) => {
    setSelectedService(service);
  };

  // Close dropdowns on outside click
    
  const closeModal = () => {
    setSelectedService(null);
  };

  // BOOK NOW LOGIC
  const handleBookNow = (id) => {
    // Read user session
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    let user = null;
    try { user = storedUser ? JSON.parse(storedUser) : null; } catch {}

    if (!user) {
      alert('Please login as a regular user to book the service.');
      navigate('/login');
      return;
    }

    const role = (user.role || '').toLowerCase();
    if (['admin', 'expert', 'provider'].includes(role)) {
      alert('This is not accessible for you. You have to be a regular user to book the service.');
      return;
    }

    // Regular user: route to user dashboard bookings view
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen w-full bg-green-50">
      <Header />
      <div className="p-6">
      <section className="relative max-w-6xl mx-auto h-auto md:h-72 lg:h-80 rounded-2xl overflow-hidden shadow mt-2">
        <img
          src="https://www.wm.com/content/dam/wm/assets/global/datapage/omr-truck-collecting-containers-curbside-nav-featured.jpg"
          alt="Waste management hero"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 w-full h-full flex flex-col md:flex-row md:items-center px-6 md:px-10 py-6 md:py-0 gap-3">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Waste Management Services</h1>
            <p className="text-sm text-green-100 mt-1">Find certified providers near you</p>
          </div>
        </div>
      </section>

      {/* Removed availability and pricing box */}

      {/* Removed domain and subcategory dropdowns */}

      {/* Steps: Simpler, Safer, Smarter */}
      <section className="max-w-6xl mx-auto pt-10 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-base font-semibold text-black">Simpler</h3>
            <p className="text-sm text-gray-600 mt-1">Set up your service in minutes with no long-term contracts.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-base font-semibold text-black">Safer</h3>
            <p className="text-sm text-gray-600 mt-1">Trusted providers trained for safety and compliance.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-base font-semibold text-black">Smarter</h3>
            <p className="text-sm text-gray-600 mt-1">Optimized routes and recycling to minimize impact.</p>
          </div>
        </div>
      </section>

      {/* Search bar */}
      <section className="max-w-6xl mx-auto mt-2 mb-6">
        <div className="bg-white rounded-xl shadow p-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search services, e.g. compost, pickup, e-waste, garden..."
              className="flex-1 bg-transparent px-3 py-2 outline-none text-gray-800 placeholder:text-gray-400"
            />
            <button
              onClick={() => setKeyword((v) => v.trim())}
              className="px-5 py-2 rounded-lg bg-green-700 text-white font-semibold hover:bg-green-800"
            >
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Removed search and pricing filter box */}

      {subcategory && (
        <div className="text-center mt-2 text-sm text-gray-700">
          Showing "{subcategory}" in {domain}
        </div>
      )}

      {/* CATEGORY MODELS GRID */}
      {services.length === 0 ? (
        <div className="max-w-6xl mx-auto mt-8">
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-600">
            No products found
          </div>
        </div>
      ) : (
      <div className="max-w-6xl mx-auto mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {(
          // If subcategory belongs to service experts group, show curated expert cards
          [
            "Home compost bin setup",
            "Kitchen waste composting",
            "Garden waste composting",
            "Society/community composting",
            "Composting workshops",
            "Selling organic compost",
          ].includes(subcategory)
            ? expertOptions
            : services
        ).map((item) => (
          <div
            key={item._id || item.key}
            className="relative bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition h-full flex flex-col"
          >
            {item.photo ? (
              <div className="h-36 w-full rounded-xl overflow-hidden">
                <img src={item.photo} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="absolute -top-8 left-6 w-20 h-20 rounded-full bg-green-50 flex items-center justify-center overflow-hidden shadow">
                <img src={item.photos?.[0] || "https://via.placeholder.com/80"} className="w-full h-full object-cover" />
              </div>
            )}

            <div className={item.photo ? "pt-4 flex-1" : "pt-10 flex-1"}>
              <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
              {item.category && (
                <div className="mt-1 inline-block px-2 py-0.5 text-xs rounded bg-green-50 text-green-700 border border-green-200">
                  {item.category}
                </div>
              )}

              {item.bullets ? (
                <ul className="mt-2 text-sm text-gray-700 space-y-1">
                  {item.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  <div className="mt-3 text-sm text-green-700 font-semibold">₹ {item.price}</div>
                  <div className="text-sm text-gray-500">📍 {item.location}</div>
                </>
              )}
            </div>

            <div className="mt-4 pt-3 flex items-center justify-between border-t">
              {item.bullets ? (
                <button
                  onClick={() => setSelectedService({ title: item.title, description: item.bullets.join(" \n"), price: 0, location: "", provider: { name: "Service Expert" }, photos: [item.photo] })}
                  className="text-green-700 font-semibold hover:underline"
                >
                  Learn more
                </button>
              ) : (
                <button
                  onClick={() => openModal(item)}
                  className="text-green-700 font-semibold hover:underline"
                >
                  View details
                </button>
              )}
              <button
                onClick={() => handleBookNow(item._id || item.key)}
                className="bg-green-700 text-white px-4 py-2 rounded-full hover:bg-green-800"
              >
                {item.cta || "Book Now"}
              </button>
            </div>
          </div>
        ))}
      </div>
      )}
            
      {/* MODAL */}
      {selectedService && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl p-6 w-[95%] max-w-3xl shadow-xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              aria-label="Close"
              className="absolute top-3 right-3 text-black hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <img
                  src={
                    (selectedService.images && selectedService.images[0]) ||
                    selectedService.photos?.[0] ||
                    "https://via.placeholder.com/600"
                  }
                  className="w-full h-60 object-cover rounded-xl"
                />
                {Array.isArray(selectedService.images) && selectedService.images.length > 1 && (
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {selectedService.images.slice(1,5).map((img, idx) => (
                      <img key={idx} src={img} className="w-full h-20 object-cover rounded-lg" />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-900">{selectedService.title}</h2>
                {selectedService.category && (
                  <div className="mt-1 inline-block px-2 py-0.5 text-xs rounded bg-green-50 text-green-700 border border-green-200">
                    {selectedService.category}
                  </div>
                )}
                <p className="text-gray-700 mt-2 whitespace-pre-line">{selectedService.description}</p>
                <div className="mt-3 text-sm text-gray-700 space-y-1">
                  <div><span className="font-semibold text-gray-900">Price:</span> ₹ {selectedService.price} <span className="text-gray-500">({selectedService.priceType || 'fixed'})</span></div>
                  <div><span className="font-semibold text-gray-900">Location:</span> {selectedService.location}</div>
                  <div><span className="font-semibold text-gray-900">Provider:</span> {selectedService.provider?.name || 'Unknown'}</div>
                  {selectedService.availability && (
                    <div><span className="font-semibold text-gray-900">Availability:</span> {selectedService.availability}</div>
                  )}
                  {Array.isArray(selectedService.serviceArea) && selectedService.serviceArea.length > 0 && (
                    <div><span className="font-semibold text-gray-900">Service Area:</span> {selectedService.serviceArea.join(', ')}</div>
                  )}
                  {Array.isArray(selectedService.tags) && selectedService.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedService.tags.map((t, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700 border">#{t}</span>
                      ))}
                    </div>
                  )}
                  {Array.isArray(selectedService.features) && selectedService.features.length > 0 && (
                    <div className="mt-3">
                      <div className="font-semibold text-gray-900">Features</div>
                      <ul className="list-disc list-inside text-gray-700 text-sm mt-1">
                        {selectedService.features.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedService.specifications && Object.keys(selectedService.specifications).length > 0 && (
                    <div className="mt-3">
                      <div className="font-semibold text-gray-900">Specifications</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 text-sm">
                        {Object.entries(selectedService.specifications).map(([k, v]) => (
                          <div key={k} className="bg-gray-50 rounded p-2">
                            <div className="text-gray-500 text-xs uppercase">{k}</div>
                            <div className="text-gray-800">{String(v)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleBookNow(selectedService._id)}
                  className="bg-green-700 text-white w-full py-3 rounded-xl mt-6 hover:bg-green-800 transition"
                >
                  Book Now
                </button>

                </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
