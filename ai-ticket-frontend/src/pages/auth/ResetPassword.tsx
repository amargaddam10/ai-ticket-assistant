import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface ResetForm {
  password: string;
  confirmPassword: string;
}

interface ResetPasswordState {
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isLoading: boolean;
  error: string;
  success: boolean;
}

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [state, setState] = useState<ResetPasswordState>({
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false,
    isLoading: false,
    error: '',
    success: false,
  });

  // Override body styles for reset password page
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

  const updateState = (updates: Partial<ResetPasswordState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateState({ error: '' });

    if (!state.password.trim()) {
      updateState({ error: 'Password is required' });
      return;
    }

    if (!state.confirmPassword.trim()) {
      updateState({ error: 'Confirm password is required' });
      return;
    }

    if (state.password.length < 6) {
      updateState({ error: 'Password must be at least 6 characters long' });
      return;
    }

    if (state.password !== state.confirmPassword) {
      updateState({ error: 'Passwords do not match' });
      return;
    }

    if (!token) {
      updateState({ error: 'Invalid reset token' });
      return;
    }

    updateState({ isLoading: true });

    try {
      // 🔧 REAL API CALL (replace the TODO)
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            password: state.password,
            confirmPassword: state.confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        updateState({ success: true, isLoading: false });

        // Redirect after success
        setTimeout(() => {
          navigate('/auth/login');
        }, 2000);
      } else {
        updateState({
          error: data.message || 'Reset failed. Please try again.',
          isLoading: false,
        });
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      updateState({
        error: error.message || 'Reset failed. Please try again.',
        isLoading: false,
      });
    }
  };

  if (state.success) {
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
        <div className="w-1/2 bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 p-8 lg:p-12 flex items-center justify-center relative overflow-hidden">
          <div className="text-center text-white relative z-10 max-w-md">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto h-20 w-20 bg-white rounded-full flex items-center justify-center mb-6"
            >
              <CheckCircleIcon className="h-10 w-10 text-green-600" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl lg:text-5xl font-bold mb-4"
            >
              Success!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-green-100"
            >
              Your password has been reset successfully
            </motion.p>
          </div>
        </div>

        {/* Right Side - Success Message */}
        <div className="w-1/2 bg-white p-8 lg:p-12 flex items-center justify-center">
          <div className="w-full max-w-md text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Password Reset Complete
            </h2>
            <p className="text-gray-600 mb-6">
              Redirecting you to login page...
            </p>
            <div className="animate-spin h-8 w-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <Link
              to="/auth/login"
              className="text-green-600 hover:text-green-500 font-medium"
            >
              Go to Login Now
            </Link>
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
      {/* Left Side - Reset Content */}
      <div className="w-1/2 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-700 p-8 lg:p-12 flex items-center justify-center relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-8 left-8 w-16 h-16 border-2 border-indigo-300 rounded-full opacity-30"></div>
        <div className="absolute top-16 right-12 w-2 h-2 bg-indigo-300 rounded-full opacity-50"></div>
        <div className="absolute top-20 right-16 w-2 h-2 bg-indigo-300 rounded-full opacity-50"></div>
        <div className="absolute top-24 right-20 w-2 h-2 bg-indigo-300 rounded-full opacity-50"></div>
        <div className="absolute bottom-16 left-16 w-8 h-8 border border-indigo-300 rotate-45 opacity-30"></div>
        <div className="absolute bottom-8 right-8 w-6 h-6 border border-indigo-300 rotate-45 opacity-30"></div>

        <div className="text-center text-white relative z-10 max-w-md">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl lg:text-5xl font-bold mb-6"
          >
            New Password
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg lg:text-xl text-indigo-100 leading-relaxed"
          >
            Choose a strong password to secure your account.
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
              {/* New Password Input */}
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
                    placeholder="Enter new password"
                    className="block w-full pl-12 pr-12 py-4 text-gray-700 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all duration-200"
                    disabled={state.isLoading}
                    autoComplete="new-password"
                    autoFocus
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
              </div>

              {/* Confirm Password Input */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={state.showConfirmPassword ? 'text' : 'password'}
                    value={state.confirmPassword}
                    onChange={(e) =>
                      updateState({
                        confirmPassword: e.target.value,
                        error: '',
                      })
                    }
                    placeholder="Confirm new password"
                    className="block w-full pl-12 pr-12 py-4 text-gray-700 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all duration-200"
                    disabled={state.isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateState({
                        showConfirmPassword: !state.showConfirmPassword,
                      })
                    }
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    disabled={state.isLoading}
                  >
                    {state.showConfirmPassword ? (
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
                className="w-full py-4 px-6 text-white font-medium bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {state.isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Resetting Password...
                  </div>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <Link
                to="/auth/login"
                className="text-purple-600 hover:text-purple-500 font-medium transition-colors duration-200"
              >
                Back to Login
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
