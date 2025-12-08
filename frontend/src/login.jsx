import React, { useState } from 'react';
import { FaLeaf, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function LoginPage({ onCreateAccount }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    
    function handleSubmit(e) {
        e.preventDefault();
        setError('');
        if (!email) return setError('Please enter an email.');
        if (!email.includes('@')) return setError('Email must contain @ symbol.');
        if (!password) return setError('Please enter a password.');
        if (!role) return setError('Please select a role.');
        setIsSubmitting(true);
        try {
            console.log({ email, role, remember });
            alert(`Logged in as ${email} (${role})`);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl ring-1 ring-green-50 border border-green-100 overflow-hidden animate-modalIn">
                <div className="p-6 sm:p-8">

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl bg-green-100">
                            <FaLeaf className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Sign in to WasteCare</h1>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">Select your role and access your dashboard.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                            <label className="text-lg font-bold text-gray-700 sm:text-left">Email</label>
                            <div className="sm:col-span-2 relative">
                                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isSubmitting}
                                    className="mt-0 block w-full rounded-lg border border-green-100 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 p-3 pl-10 text-lg disabled:opacity-60"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                            <label className="text-lg font-bold text-gray-700 sm:text-left">Password</label>
                            <div className="sm:col-span-2 relative">
                                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isSubmitting}
                                    className="mt-0 block w-full rounded-lg border border-green-100 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 p-3 pl-10 pr-12 text-lg disabled:opacity-60"
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    disabled={isSubmitting}
                                >
                                    {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                            <label className="text-lg font-bold text-gray-700 sm:text-left mt-2">Select Role</label>
                            <div className="sm:col-span-2">
                                <select
                                    id="role"
                                    name="role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    disabled={isSubmitting}
                                    required
                                    className="mt-0 block w-full rounded-lg border border-green-100 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 p-3 text-lg disabled:opacity-60"
                                >
                                    <option value="" disabled>Select your role…</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Composting Experts">Composting Experts</option>
                                    <option value="Waste Management Service Providers">Waste Management Service Providers</option>
                                    <option value="Regular Users">Regular Users</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="inline-flex items-center gap-2 text-lg font-bold text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    disabled={isSubmitting}
                                    className="rounded border-gray-300 text-green-600 shadow-sm focus:ring-green-500 disabled:opacity-60"
                                />
                                Remember me
                            </label>

                            <button type="button" disabled={isSubmitting} className="text-sm text-green-600 hover:underline disabled:opacity-60">Forgot password?</button>
                        </div>

                        {error && <div className="text-sm text-red-600 mt-1" role="alert" aria-live="assertive">{error}</div>}

                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 text-white px-5 py-3 text-base sm:text-lg font-semibold shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting && (
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                    </svg>
                                )}
                                {isSubmitting ? 'Signing in...' : 'Sign in'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 border-t border-green-100 pt-4 text-center">
                        <p className="text-sm text-gray-500"><span className="font-bold text-gray-700">New here?</span> <button onClick={onCreateAccount} className="text-green-600 font-semibold hover:underline">Create an account</button></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
