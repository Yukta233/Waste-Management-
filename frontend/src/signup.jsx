import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaMapMarkerAlt, FaHome, FaImage, FaList, FaRupeeSign, FaCalendarAlt, FaTruck, FaCog, FaUserTag } from 'react-icons/fa';
import { Link } from 'react-router-dom';
const userTypes = ['Admin', 'Composting Experts', 'Waste Management Service Providers', 'Regular Users'];

export default function CreateUserAccount() {
    const [userType, setUserType] = useState('Regular Users');
    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

    const handleChange = (e) => {
        const { name, value, files, type } = e.target;
        if (type === 'file') {
            setFormData({ ...formData, [name]: files && files[0] ? files[0] : null });
            return;
        }
        setFormData({ ...formData, [name]: value });
    };

    const mapUserTypeToRole = (t) => {
        switch (t) {
            case 'Admin':
                return 'admin';
            case 'Composting Experts':
                return 'expert';
            case 'Waste Management Service Providers':
                return 'provider';
            default:
                return 'user';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.fullName) return setError('Full Name is required');
        if (!formData.email || !formData.email.includes('@')) return setError('Valid Email is required');
        if (!formData.password) return setError('Password is required');
        if (userType === 'Admin' && !formData.address) return setError('Address is required for Admin');
        // no longer require expertise; address required for Composting Experts
        if (userType === 'Composting Experts' && !formData.address) return setError('Address is required for Composting Experts');

        const role = mapUserTypeToRole(userType);
        // Build multipart form data to include profile image if provided
        const fd = new FormData();
        fd.append('fullName', formData.fullName);
        fd.append('email', formData.email);
        fd.append('password', formData.password);
        fd.append('role', role);
        if (formData.phone) fd.append('phoneNumber', formData.phone);
        // Admin no longer uses region; address is appended above when present
        if (formData.vehicle) fd.append('vehicle', formData.vehicle);
        if (formData.address) fd.append('address', typeof formData.address === 'string' ? formData.address : JSON.stringify(formData.address));
        // Attach profile picture file if present
        if (formData.profilePhoto) fd.append('profilePhoto', formData.profilePhoto);

        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                // NOTE: let browser set Content-Type for multipart
                credentials: 'include',
                body: fd,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data?.message || 'Registration failed');
            }
            // On success, optionally auto-login or redirect to login
            alert('Account created successfully. Please sign in.');
            window.location.href = '/login';
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setSubmitting(false);
        }
    };

    const renderFields = () => {
        if (userType === 'Admin') {
            return (
                <>
                    <AnimatedInput label="Name" name="fullName" onChange={handleChange} />
                    <AnimatedInput label="Email" name="email" type="email" onChange={handleChange} />
                    <AnimatedInput label="Password" name="password" type="password" onChange={handleChange} />
                    <AnimatedInput label="Address" name="address" onChange={handleChange} />
                    <AnimatedInput label="Profile Picture" name="profilePhoto" type="file" onChange={handleChange} />
                </>
            );
        }

        if (userType === 'Composting Experts') {
            return (
                <>
                    <AnimatedInput label="Name" name="fullName" onChange={handleChange} />
                    <AnimatedInput label="Email" name="email" type="email" onChange={handleChange} />
                    <AnimatedInput label="Phone Number" name="phone" type="number" onChange={handleChange} />
                    {/* Removed expertise dropdown per request; add address for experts */}
                    <AnimatedInput label="Address" name="address" onChange={handleChange} />
                    <AnimatedInput label="Profile Picture" name="profilePhoto" type="file" onChange={handleChange} />
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
                <AnimatedInput label="Profile Picture" name="profilePhoto" type="file" onChange={handleChange} />
            </>
        );

        switch(userType){
            case 'Waste Management Service Providers':
                return (
                    <>
                        {commonFields}
                        {/* Removed Services Providing list per request */}
                        <AnimatedInput label="Vehicle Details" name="vehicle" placeholder="Optional" onChange={handleChange} />
                    </>
                );
            case 'Regular Users':
                return (
                    <>
                        {commonFields}
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
                    <button type="submit" disabled={submitting} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition disabled:opacity-60 disabled:cursor-not-allowed">
                        {submitting ? 'Creating Account...' : 'Create Account'}
                    </button>
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