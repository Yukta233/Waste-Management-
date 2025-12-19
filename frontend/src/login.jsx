import React, { useState } from 'react';
import { FaLeaf, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import logo from './assets/swachhsetu.png';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const mapRoleToBackend = (r) => {
    switch (r) {
      case 'Admin': return 'admin';
      case 'Composting Experts': return 'expert';
      case 'Waste Management Service Providers': return 'provider';
      case 'Regular Users': return 'user';
      default: return '';
    }
  };

  const handleGoogleSignin = () => {
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
      const API_BASE =
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Login failed');

      if (data?.data?.accessToken) {
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem('accessToken', data.data.accessToken);
        storage.setItem('refreshToken', data.data.refreshToken || '');
        storage.setItem('user', JSON.stringify(data.data.user || {}));
      }

      if (backendRole === 'admin') navigate('/admin');
      else if (backendRole === 'expert') navigate('/expert');
      else if (backendRole === 'provider') navigate('/provider');
      else navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative">

      {/* Back Button */}
      <div className="absolute top-4 left-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-green-600 font-semibold hover:underline"
        >
          <FaArrowLeft /> Back to Home
        </Link>
      </div>

      {/* Animated Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          ...(error && { x: [0, -10, 10, -8, 8, 0] }),
        }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        whileHover={{
          y: -4,
          boxShadow: '0 25px 50px rgba(34,197,94,0.25)',
        }}
        whileTap={{ scale: 0.98 }}
        className="w-full max-w-xl bg-white rounded-2xl shadow-xl ring-1 ring-green-50 border border-green-100 overflow-hidden"
      >
        <div className="p-6 sm:p-8">

          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-white">
              <img src={logo} alt="Swachh Setu" className="h-16 w-18 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Sign in to SwachhSetu
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Select your role and access your dashboard.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="grid sm:grid-cols-3 gap-3 items-center">
              <label className="font-semibold text-gray-700">Email</label>
              <div className="sm:col-span-2 relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-green-100 bg-white p-2.5 pl-10 text-gray-900 focus:ring-green-200 focus:border-green-500 disabled:opacity-60"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="grid sm:grid-cols-3 gap-3 items-center">
              <label className="font-semibold text-gray-700">Password</label>
              <div className="sm:col-span-2 relative">
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-green-100 bg-white p-2.5 pl-10 pr-12 text-gray-900 focus:ring-green-200 focus:border-green-500 disabled:opacity-60"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div className="grid sm:grid-cols-3 gap-3">
              <label className="font-semibold text-gray-700 mt-2">
                Select Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="sm:col-span-2 rounded-lg border border-green-100 bg-white p-2.5 text-gray-900 focus:ring-green-200 focus:border-green-500"
              >
                <option value="">Select your role…</option>
                <option>Admin</option>
                <option>Composting Experts</option>
                <option>Waste Management Service Providers</option>
                <option>Regular Users</option>
              </select>
            </div>

            {/* Remember & Forgot */}
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
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

            {error && <p className="text-sm text-red-600">{error}</p>}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting} 
              className="w-full bg-green-600 text-white rounded-xl py-2.5 font-semibold hover:bg-green-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleSignin}
              className="w-full flex items-center justify-center gap-3 rounded-xl
             border border-gray-300 bg-white
             px-5 py-2.5 text-sm sm:text-base font-semibold
             text-gray-700
             hover:bg-gray-50
             focus:outline-none 
             disabled:opacity-60"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="h-5 w-5"
              />
              Sign in with Google
            </button>
          </form>

          {/* Create Account */}
          <div className="mt-6 border-t border-green-100 pt-4 text-center">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-700">
                Don’t have an account?
              </span>{' '}
              <Link
                to="/signup"
                className="text-green-600 font-semibold hover:underline"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
