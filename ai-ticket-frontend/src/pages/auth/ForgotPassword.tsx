import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  EnvelopeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface ForgotPasswordState {
  email: string;
  isLoading: boolean;
  isSubmitted: boolean;
  error: string;
  success: string;
}

const ForgotPassword: React.FC = () => {
  const [state, setState] = useState<ForgotPasswordState>({
    email: '',
    isLoading: false,
    isSubmitted: false,
    error: '',
    success: '',
  });

  // Override body styles for forgot password page
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

  const updateState = (updates: Partial<ForgotPasswordState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    updateState({ error: '', success: '' });

    if (!state.email.trim()) {
      updateState({ error: 'Email address is required' });
      return;
    }

    if (!validateEmail(state.email)) {
      updateState({ error: 'Please enter a valid email address' });
      return;
    }

    updateState({ isLoading: true });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: state.email.trim() }),
        }
      );

      const data = await response.json();

      if (data.success) {
        updateState({
          isSubmitted: true,
          success: 'Password reset email sent! Please check your inbox.',
          isLoading: false,
        });
      } else {
        updateState({
          error: data.message || 'Failed to send reset email',
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      updateState({
        error: 'Network error. Please check your connection and try again.',
        isLoading: false,
      });
    }
  };

  const handleResend = () => {
    updateState({
      isSubmitted: false,
      success: '',
      error: '',
    });
  };

  if (state.isSubmitted) {
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
        {/* Left Side - Success Content */}
        <div className="w-1/2 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 p-8 lg:p-12 flex items-center justify-center relative overflow-hidden">
          <div className="text-center text-white relative z-10 max-w-md">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6"
            >
              <CheckCircleIcon className="h-10 w-10 text-green-600" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl lg:text-5xl font-bold mb-4"
            >
              Email Sent!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-purple-100"
            >
              Check your inbox for the reset link
            </motion.p>
          </div>
        </div>

        {/* Right Side - Instructions */}
        <div className="w-1/2 bg-white p-8 lg:p-12 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Check Your Email
              </h2>
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to:
              </p>
              <p className="text-sm font-medium text-blue-600 bg-blue-50 rounded-lg p-3 mb-6">
                {state.email}
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Important:</p>
                  <ul className="space-y-1">
                    <li>• The reset link expires in 1 hour</li>
                    <li>• Check your spam folder if you don't see it</li>
                    <li>• The link can only be used once</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleResend}
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200"
              >
                Send Another Email
              </button>

              <Link
                to="/auth/login"
                className="inline-flex items-center justify-center w-full text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      {/* Left Side - Forgot Password Content */}
      <div className="w-1/2 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 p-8 lg:p-12 flex items-center justify-center relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-8 left-8 w-16 h-16 border-2 border-purple-300 rounded-full opacity-30"></div>
        <div className="absolute top-16 right-12 w-2 h-2 bg-purple-300 rounded-full opacity-50"></div>
        <div className="absolute top-20 right-16 w-2 h-2 bg-purple-300 rounded-full opacity-50"></div>
        <div className="absolute top-24 right-20 w-2 h-2 bg-purple-300 rounded-full opacity-50"></div>
        <div className="absolute bottom-16 left-16 w-8 h-8 border border-purple-300 rotate-45 opacity-30"></div>
        <div className="absolute bottom-8 right-8 w-6 h-6 border border-purple-300 rotate-45 opacity-30"></div>

        <div className="text-center text-white relative z-10 max-w-md">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl lg:text-5xl font-bold mb-6"
          >
            Forgot Password?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg lg:text-xl text-purple-100 leading-relaxed"
          >
            No worries! We'll send you a reset link to get you back on track.
          </motion.p>
        </div>
      </div>

      {/* Right Side - Reset Form */}
      <div className="w-1/2 bg-white p-8 lg:p-12 flex items-center justify-center">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              Reset Password
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                    className="block w-full pl-12 pr-4 py-4 text-gray-700 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all duration-200"
                    disabled={state.isLoading}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
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
                className="w-full py-4 px-6 text-white font-medium bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {state.isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Sending Reset Link...
                  </div>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <Link
                to="/auth/login"
                className="inline-flex items-center text-purple-600 hover:text-purple-500 font-medium transition-colors duration-200"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Login
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
