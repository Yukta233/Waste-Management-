import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaMapMarkerAlt, FaHome, FaImage, FaList, FaRupeeSign, FaCalendarAlt, FaTruck, FaCog, FaUserTag } from 'react-icons/fa';
import { Link } from 'react-router-dom';
const userTypes = ['Admin', 'Composting Experts', 'Waste Management Service Providers', 'Regular Users'];

export default function CreateUserAccount() {
    const [userType, setUserType] = useState('Regular Users');
    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!formData.fullName) return setError('Full Name is required');
        if (!formData.email || !formData.email.includes('@')) return setError('Valid Email is required');
        if (!formData.password) return setError('Password is required');
        if (userType === 'Admin' && !formData.region) return setError('Region is required for Admin');
        if (userType === 'Composting Experts' && !formData.expertise) return setError('Area of Expertise is required for Composting Experts');
        console.log('Account Data:', formData, 'UserType:', userType);
        alert(`Account created for ${formData.fullName} as ${userType}`);
    };

    const renderFields = () => {
        if (userType === 'Admin') {
            return (
                <>
                    <AnimatedInput label="Name" name="fullName" onChange={handleChange} />
                    <AnimatedInput label="Email" name="email" type="email" onChange={handleChange} />
                    <AnimatedInput label="Password" name="password" type="password" onChange={handleChange} />
                    <AnimatedInput label="Region" name="region" onChange={handleChange} />
                </>
            );
        }

        if (userType === 'Composting Experts') {
            return (
                <>
                    <AnimatedInput label="Name" name="fullName" onChange={handleChange} />
                    <AnimatedInput label="Email" name="email" type="email" onChange={handleChange} />
                    <AnimatedInput label="Phone Number" name="phone" type="number" onChange={handleChange} />
                    <DropdownField
                        label="Area of Expertise"
                        name="expertise"
                        value={formData.expertise || ''}
                        onChange={handleChange}
                        options={[
                            'Home Composting',
                            'Community Composting',
                            'Vermicomposting',
                            'Aerobic Composting',
                            'Garden/Leaf Composting',
                        ]}
                    />
                    <AnimatedInput label="Password" name="password" type="password" onChange={handleChange} />
                </>
            );
        }

        const commonFields = (
            <>
                <AnimatedInput label="Full Name" name="fullName" onChange={handleChange} />
                <AnimatedInput label="Email" name="email" type="email" onChange={handleChange} />
                <AnimatedInput label="Password" name="password" type="password" onChange={handleChange} />
                <AnimatedInput label="Phone Number" name="phone" type="number" onChange={handleChange} />
                <AnimatedInput label="Address" name="address" onChange={handleChange} />
                                            </>
        );

        switch(userType){
            case 'Waste Management Service Providers':
                return (
                    <>
                        {commonFields}
                        <DropdownField
                            label="Services Providing"
                            name="services"
                            value={formData.services || ''}
                            onChange={handleChange}
                            options={[
                                'Waste Pickup',
                                'Kitchen Waste Collection',
                                'Recycling Service',
                                'Bulk Waste Removal',
                                'E-waste Collection',
                            ]}
                        />
                        <AnimatedInput label="Vehicle Details" name="vehicle" placeholder="Optional" onChange={handleChange} />
                    </>
                );
            case 'Regular Users':
                return (
                    <>
                        {commonFields}
                        <AnimatedInput label="Profile Picture" name="profilePic" type="file" onChange={handleChange} />
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white p-8">
            <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl p-10 border border-gray-100 ring-1 ring-gray-100">
                <h1 className="text-3xl font-extrabold text-green-600 mb-8 text-center">Create Your WasteCare Account</h1>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center mb-6">
                    <label className="text-gray-700 font-semibold sm:text-left text-sm">Select User Type</label>
                    <div className="sm:col-span-2 relative">
                        <FaUserTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <select value={userType} onChange={(e) => setUserType(e.target.value)} className="w-full p-2 pl-9 border border-gray-200 rounded-lg bg-white text-gray-900 text-base focus:border-gray-500 focus:ring focus:ring-gray-200 transition">
                            {userTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {renderFields()}
                    {error && <div className="text-red-600 font-semibold text-sm">{error}</div>}
                    <button type="submit" className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition">Create Account</button>
                </form>

                <div className="mt-10 border-t pt-5 text-center">
    <p className="text-gray-500 text-sm">
        Already have an account?{" "}
        <Link to="/login" className="text-gray-700 font-semibold hover:underline hover:text-gray-900">
            Sign in
        </Link>
    </p>
</div>
            </div>
        </div>
    );
}

function DropdownField({ label, name, value, onChange, options = [] }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <label className="text-gray-700 font-semibold sm:text-left text-sm">{label}</label>
            <div className="sm:col-span-2 relative">
                <select
                    name={name}
                    value={value}
                    onChange={onChange}
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:border-gray-500 focus:ring focus:ring-gray-200 text-base"
                >
                    <option value="" disabled>Select an option</option>
                    {options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

function AnimatedInput({ label, name, type = 'text', placeholder = '', onChange }) {
    const iconMap = {
        fullName: FaUser,
        email: FaEnvelope,
        password: FaLock,
        phone: FaPhone,
        address: FaHome,
                        region: FaMapMarkerAlt,
        expertise: FaCog,
                vehicle: FaTruck,
            };
    const Icon = iconMap[name];
    const ph = placeholder || label;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <label className="text-gray-700 font-semibold sm:text-left text-sm">{label}</label>
            <div className="sm:col-span-2 relative">
                {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />}
                <input
                    type={type}
                    name={name}
                    placeholder={ph}
                    onChange={onChange}
                    className={`w-full p-2.5 ${Icon ? 'pl-9' : ''} border border-gray-200 rounded-lg bg-white text-gray-900 focus:border-gray-500 focus:ring focus:ring-gray-200 text-base placeholder-gray-400 transition`}
                />
            </div>
        </div>
    );
}
