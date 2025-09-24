import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface RegisterState {
  name: string;
  email: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  error: string;
}

const Register: React.FC = () => {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<RegisterState>({
    name: '',
    email: '',
    password: '',
    showPassword: false,
    isLoading: false,
    error: '',
  });

  // Override body styles for register page
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.height = '100vh';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.height = '';
      document.body.style.overflow = '';
    };
  }, []);

  const updateState = (updates: Partial<RegisterState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const validateForm = () => {
    if (!state.name.trim()) {
      updateState({ error: 'Full name is required' });
      return false;
    }

    if (!state.email.trim()) {
      updateState({ error: 'Email address is required' });
      return false;
    }

    if (!state.password.trim()) {
      updateState({ error: 'Password is required' });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(state.email)) {
      updateState({ error: 'Please enter a valid email address' });
      return false;
    }

    if (state.password.length < 6) {
      updateState({ error: 'Password must be at least 6 characters long' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateState({ error: '' });

    if (!validateForm()) return;

    updateState({ isLoading: true });

    try {
      await signup(state.name.trim(), state.email.trim(), state.password);
      navigate('/dashboard');
    } catch (error: any) {
      updateState({
        error: error.message || 'Registration failed. Please try again.',
        isLoading: false,
      });
    }
  };

  return (
    <div
      className="fixed inset-0 w-screen h-screen flex"
      style={{
        margin: 0,
        padding: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}
    >
      {/* Left Side - Welcome Content */}
      <div className="w-1/2 bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 p-8 lg:p-12 flex items-center justify-center relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-8 left-8 w-16 h-16 border-2 border-green-300 rounded-full opacity-30"></div>
        <div className="absolute top-16 right-12 w-2 h-2 bg-green-300 rounded-full opacity-50"></div>
        <div className="absolute top-20 right-16 w-2 h-2 bg-green-300 rounded-full opacity-50"></div>
        <div className="absolute top-24 right-20 w-2 h-2 bg-green-300 rounded-full opacity-50"></div>
        <div className="absolute bottom-16 left-16 w-8 h-8 border border-green-300 rotate-45 opacity-30"></div>
        <div className="absolute bottom-8 right-8 w-6 h-6 border border-green-300 rotate-45 opacity-30"></div>

        {/* Flowing Lines */}
        <svg
          className="absolute bottom-0 right-0 w-64 h-64 opacity-20"
          viewBox="0 0 200 200"
        >
          <path
            d="M 20 100 Q 100 20 180 100 T 180 160"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-green-200"
          />
          <path
            d="M 40 120 Q 120 40 200 120 T 200 180"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-green-200"
          />
        </svg>

        <div className="text-center text-white relative z-10 max-w-md">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl lg:text-5xl font-bold mb-6"
          >
            Join us today!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg lg:text-xl text-green-100 leading-relaxed"
          >
            Create your account and start managing your tickets with AI
            assistance.
          </motion.p>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-1/2 bg-white p-8 lg:p-12 flex items-center justify-center">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              Create Account
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Input */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={state.name}
                    onChange={(e) =>
                      updateState({ name: e.target.value, error: '' })
                    }
                    placeholder="Enter your full name"
                    className="block w-full pl-12 pr-4 py-4 text-gray-700 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all duration-200"
                    disabled={state.isLoading}
                    autoComplete="name"
                    autoFocus
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={state.email}
                    onChange={(e) =>
                      updateState({ email: e.target.value, error: '' })
                    }
                    placeholder="Enter your email address"
                    className="block w-full pl-12 pr-4 py-4 text-gray-700 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all duration-200"
                    disabled={state.isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={state.showPassword ? 'text' : 'password'}
                    value={state.password}
                    onChange={(e) =>
                      updateState({ password: e.target.value, error: '' })
                    }
                    placeholder="Create a password"
                    className="block w-full pl-12 pr-12 py-4 text-gray-700 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all duration-200"
                    disabled={state.isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateState({ showPassword: !state.showPassword })
                    }
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    disabled={state.isLoading}
                  >
                    {state.showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Must be at least 6 characters long
                </p>
              </div>

              {/* Error Message */}
              {state.error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-4"
                >
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                    <p className="text-sm text-red-800">{state.error}</p>
                  </div>
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={state.isLoading}
                className="w-full py-4 px-6 text-white font-medium bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {state.isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/auth/login"
                  className="text-green-600 hover:text-green-500 font-medium transition-colors duration-200"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Register;
