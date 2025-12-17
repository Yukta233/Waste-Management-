import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";
import Header from "./components/Header";
export default function ServicesPage() {
  const [services, setServices] = useState([]);
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
  const [isOpen, setIsOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Second-level subcategory state
  const [subcategory, setSubcategory] = useState("");
  const [isSubOpen, setIsSubOpen] = useState(false);

  // FILTERS
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  // Availability/Pricing form (for providers)
  const [addr, setAddr] = useState("");
  const [availability, setAvailability] = useState({});

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
      if (priceMin) params.minPrice = priceMin;
      if (priceMax) params.maxPrice = priceMax;
      if (location) params.city = location;
      const mappedCat = mapFrontToBackendCategory(subcategory || type);
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
        provider: { name: svc.provider?.fullName || svc.provider?.companyName || 'Service Expert' },
        domain: 'Residential',
      }));

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
  }, [search, location, type, priceMin, priceMax]);

  const openModal = (service) => {
    setSelectedService(service);
    setIsOpen(false);
  };

  // Close dropdowns on outside click
  const categoryRef = useRef(null);
  const subcategoryRef = useRef(null);
  useEffect(() => {
    const onDocClick = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setIsOpen(false);
      }
      if (subcategoryRef.current && !subcategoryRef.current.contains(e.target)) {
        setIsSubOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const closeModal = () => {
    setSelectedService(null);
  };

  // BOOK NOW LOGIC
  const handleBookNow = (id) => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("⚠️ Please login first.");
      return;
    }

    navigate(`/book/${id}`);
  };

  return (
    <div className="min-h-screen w-full bg-green-50">
      <Header />
      <div className="p-6">
      <section className="relative max-w-6xl mx-auto h-56 md:h-72 lg:h-80 rounded-2xl overflow-hidden shadow mt-2">
        <img
          src="https://www.wm.com/content/dam/wm/assets/global/datapage/omr-truck-collecting-containers-curbside-nav-featured.jpg"
          alt="Waste management hero"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 h-full flex items-center px-6 md:px-10">
          <div>
            <div className="text-xs uppercase tracking-wider text-green-200 mb-1">{domain}</div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{heading}</h1>
            <p className="text-sm text-green-100 mt-1">Find certified providers near you</p>
          </div>
        </div>
      </section>

      {subcategory && [
        "Household waste collection",
        "Recycling pickup (plastic, paper, glass, metal)",
        "E-waste collection (mobiles, chargers, batteries)",
        "Garden waste removal",
        "Waste segregation assistance",
        "Zero-waste event management",
      ].includes(subcategory) && (
        <div className="relative z-20 -mt-8 md:-mt-10">
          <div className="bg-white rounded-2xl shadow-xl p-5 border border-gray-100 max-w-5xl mx-auto">
            <div className="text-base font-semibold text-gray-900 mb-3">Check service availability and pricing</div>
            <div className="flex gap-3">
              <input
                className="flex-1 p-3 rounded-lg border bg-white"
                placeholder="Address (Street, City, PIN)"
                value={addr}
                onChange={(e) => setAddr(e.target.value)}
              />
              <button
                onClick={() => {
                  if (!addr.trim()) {
                    return setAvailability((prev) => ({ ...prev, global: { ok: false, msg: "Enter address to check availability." } }));
                  }
                  const priceDelta = addr.length % 3 === 0 ? 150 : 0;
                  const base = services[0]?.price || 800;
                  setAvailability((prev) => ({ ...prev, global: { ok: true, msg: `Available in your area. Estimated price from ₹ ${base + priceDelta}` } }));
                }}
                className="bg-gray-800 text-white px-6 py-3 rounded-full hover:bg-gray-900"
              >
                Check Availability
              </button>
            </div>
            {availability.global && (
              <div className={`mt-3 text-sm ${availability.global.ok ? "text-green-700" : "text-red-600"}`}>
                {availability.global.msg}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ⭐ CATEGORY DROPDOWN (left aligned, no shadow) */}
      <div ref={categoryRef} className="flex justify-start mt-6 mb-3 relative max-w-6xl mx-auto">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-green-800 hover:bg-gray-100 transition border"
        >
          {domain} Services <FaChevronDown />
        </button>

        {isOpen && (
          <div className="absolute left-0 top-12 bg-white rounded-lg w-56 border z-50">
            {["Residential", "Commercial", "Municipal"].map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDomain(d);
                  setSubcategory("");
                  setSearchParams({ domain: d.toLowerCase() });
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-black hover:bg-gray-100 transition ${
                  domain === d ? "font-bold text-green-700" : ""
                }`}
              >
                {d} Services
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ⭐ SUBCATEGORY DROPDOWN (left aligned, no shadow) */}
      <div ref={subcategoryRef} className="flex justify-start mt-2 mb-6 relative max-w-6xl mx-auto">
        <button
          onClick={() => setIsSubOpen(!isSubOpen)}
          className="bg-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold text-green-800 hover:bg-gray-100 transition disabled:opacity-60 disabled:cursor-not-allowed border"
          disabled={!domain}
        >
          {subcategory ? subcategory : "Choose a sub-service"} <FaChevronDown />
        </button>

        {isSubOpen && (
          <div className="absolute left-0 top-12 bg-white rounded-lg w-[22rem] border z-50 p-2">
            <div className="text-xs uppercase text-gray-500 px-3 py-1">Service Experts</div>
            {[
              "Home compost bin setup",
              "Kitchen waste composting",
              "Garden waste composting",
              "Society/community composting",
              "Composting workshops",
              "Selling organic compost",
            ].map((sub) => (
              <button
                key={sub}
                onClick={() => {
                  setSubcategory(sub);
                  setSearchParams({ domain: domain.toLowerCase(), subcategory: sub });
                  setIsSubOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-black hover:bg-gray-100 transition ${
                  subcategory === sub ? "font-bold text-green-700" : ""
                }`}
              >
                {sub}
              </button>
            ))}

            <div className="text-xs uppercase text-gray-500 px-3 py-2 mt-2 border-t">Waste Management Service Providers</div>
            {[
              "Household waste collection",
              "Recycling pickup (plastic, paper, glass, metal)",
              "E-waste collection (mobiles, chargers, batteries)",
              "Garden waste removal",
              "Waste segregation assistance",
              "Zero-waste event management",
            ].map((sub) => (
              <button
                key={sub}
                onClick={() => {
                  setSubcategory(sub);
                  setSearchParams({ domain: domain.toLowerCase(), subcategory: sub });
                  setIsSubOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-black hover:bg-gray-100 transition ${
                  subcategory === sub ? "font-bold text-green-700" : ""
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
      </div>

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

      {/* FILTERS - modern UI, white inputs, auto-apply */}
      <div className="bg-white p-4 rounded-2xl shadow-md max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-3 mb-8">
        <input
          placeholder="Search services..."
          className="p-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          placeholder="City / PIN"
          className="p-2 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <select
          className="p-2 border rounded-lg bg-white text-gray-900"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">Service Type</option>
          <option>Home Compost Setup</option>
          <option>Waste Collection</option>
          <option>Buy Compost</option>
          <option>Workshop</option>
        </select>

        <input
          placeholder="Min Price"
          type="number"
          className="p-2 border rounded-lg bg-white text-gray-900 w-full"
          value={priceMin}
          onChange={(e) => setPriceMin(e.target.value)}
        />
        <input
          placeholder="Max Price"
          type="number"
          className="p-2 border rounded-lg bg-white text-gray-900 w-full"
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
        />
      </div>

      {subcategory && (
        <div className="text-center mt-2 text-sm text-gray-700">
          Showing "{subcategory}" in {domain}
        </div>
      )}

      {/* CATEGORY MODELS GRID */}
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
            
      {/* MODAL */}
      {selectedService && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl p-6 w-[90%] max-w-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={
                selectedService.photos?.[0] ||
                "https://via.placeholder.com/600"
              }
              className="w-full h-60 object-cover rounded-xl"
            />

            <h2 className="mt-4 text-2xl font-bold text-green-900">
              {selectedService.title}
            </h2>

            <p className="text-gray-700 mt-2">
              {selectedService.description}
            </p>

            <p className="mt-4 font-bold text-green-700 text-xl">
              Price: ₹ {selectedService.price}
            </p>

            <p className="mt-1 text-gray-600">
              📍 Location: {selectedService.location}
            </p>

            <div className="mt-1 text-gray-600">
              👤 Provider: {selectedService.provider?.name || "Unknown"}
            </div>

            <button
              onClick={() => handleBookNow(selectedService._id)}
              className="bg-green-700 text-white w-full py-3 rounded-xl mt-6 hover:bg-green-800 transition"
            >
              Book Now
            </button>

            <button
              onClick={closeModal}
              className="w-full mt-2 text-center text-red-500 font-semibold hover:text-red-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
