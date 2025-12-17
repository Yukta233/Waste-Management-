import React, { useState } from 'react';
import { FaLeaf, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom'; // ✅ Import Link and useNavigate

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();

    // Map UI role labels to backend role values
    const mapRoleToBackend = (r) => {
        switch (r) {
            case 'Admin':
                return 'admin';
            case 'Composting Experts':
                return 'expert';
            case 'Waste Management Service Providers':
                return 'provider';
            case 'Regular Users':
                return 'user';
            default:
                return '';
        }
    };

    const handleGoogleSignin = async () => {
        // Placeholder: integrate with your Google OAuth flow here
        // For now, just a stub to show UI behavior
        alert('Google sign-in coming soon');
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        if (!email) return setError('Please enter an email.');
        if (!email.includes('@')) return setError('Email must contain @ symbol.');
        if (!password) return setError('Please enter a password.');
        if (!role) return setError('Please select a role.');

        const backendRole = mapRoleToBackend(role);
        if (!backendRole) return setError('Invalid role selection.');

        setIsSubmitting(true);
        try {
            // Determine backend base URL
            const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // include cookies set by server
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = data?.message || data?.error || 'Login failed';
                throw new Error(msg);
            }

            // Persist tokens/user minimally if provided
            if (data?.data?.accessToken) {
                if (remember) {
                    localStorage.setItem('accessToken', data.data.accessToken);
                    localStorage.setItem('refreshToken', data.data.refreshToken || '');
                } else {
                    sessionStorage.setItem('accessToken', data.data.accessToken);
                    sessionStorage.setItem('refreshToken', data.data.refreshToken || '');
                }
            }
            if (data?.data?.user) {
                const userStr = JSON.stringify(data.data.user);
                if (remember) localStorage.setItem('user', userStr);
                else sessionStorage.setItem('user', userStr);
            }

            // Navigate to dashboard based on role
            if (backendRole === 'admin') navigate('/admin');
            else if (backendRole === 'expert') navigate('/expert');
            else if (backendRole === 'provider') navigate('/provider');
            else navigate('/');
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative">

            {/* Back to Home Button */}
            <div className="absolute top-4 left-4">
                <Link to="/" className="flex items-center gap-2 text-green-600 font-semibold hover:underline">
                    <FaArrowLeft /> Back to Home
                </Link>
            </div>

            <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl ring-1 ring-green-50 border border-green-100 overflow-hidden animate-modalIn">
                <div className="p-6 sm:p-8">

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl bg-green-100">
                            <FaLeaf className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Sign in to WasteCare</h1>
                            <p className="text-xs sm:text-xs text-gray-500 mt-1">Select your role and access your dashboard.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Field */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                            <label className="text-base font-semibold text-gray-700 sm:text-left">Email</label>
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
                                    className="mt-0 block w-full rounded-lg border border-green-100 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 p-2.5 pl-10 text-base disabled:opacity-60"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                            <label className="text-base font-semibold text-gray-700 sm:text-left">Password</label>
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
                                    className="mt-0 block w-full rounded-lg border border-green-100 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 p-2.5 pl-10 pr-12 text-base disabled:opacity-60"
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

                        {/* Role Selection */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                            <label className="text-base font-semibold text-gray-700 sm:text-left mt-2">Select Role</label>
                            <div className="sm:col-span-2">
                                <select
                                    id="role"
                                    name="role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    disabled={isSubmitting}
                                    required
                                    className="mt-0 block w-full rounded-lg border border-green-100 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 p-2.5 text-base disabled:opacity-60"
                                >
                                    <option value="" disabled>Select your role…</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Composting Experts">Composting Experts</option>
                                    <option value="Waste Management Service Providers">Waste Management Service Providers</option>
                                    <option value="Regular Users">Regular Users</option>
                                </select>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="inline-flex items-center gap-2 text-base font-semibold text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    disabled={isSubmitting}
                                    className="rounded border-gray-300 text-green-600 shadow-sm focus:ring-green-500 disabled:opacity-60"
                                />
                                Remember me
                            </label>

                                <Link
                                to="/forgot-password"
                                className="text-sm text-green-600 hover:underline"
                                >
                                Forgot password?
                                </Link>
                        </div>

                        {error && <div className="text-sm text-red-600 mt-1" role="alert" aria-live="assertive">{error}</div>}

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 text-white px-5 py-2.5 text-sm sm:text-base font-semibold shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
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

                        {/* Divider and Google Sign-In */}
                        <div className="mt-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex-1 h-px bg-green-100"></div>
                                <span className="text-xs text-gray-400">or</span>
                                <div className="flex-1 h-px bg-green-100"></div>
                            </div>
                            <button
                                type="button"
                                onClick={handleGoogleSignin}
                                disabled={isSubmitting}
                                className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-gray-700 px-5 py-2.5 text-sm sm:text-base font-semibold hover:bg-gray-50 focus:outline-none focus:ring-0 disabled:opacity-60"
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
                                Sign in with Google
                            </button>
                        </div>
                    </form>

                    {/* Create Account Link */}
                    <div className="mt-6 border-t border-green-100 pt-4 text-center">
                        <p className="text-sm text-gray-500">
                            <span className="font-bold text-gray-700">New here?</span>{" "}
                            <Link to="/signup" className="text-green-600 font-semibold hover:underline">
                                Create an account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
