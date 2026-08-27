/**
 * OTP helpers — backend-driven.
 *
 * OTP sending and verification is now handled entirely by the backend.
 * Use `authApi.sendOtp`, `authApi.verifyOtp`, and `authApi.resendOtp` instead.
 *
 * This module is retained as a compatibility shim so any legacy imports
 * do not break. The EmailJS-based client-side OTP has been removed.
 */

// Re-export the OTP-related methods from the canonical authApi
export {
  authApi as otpApi,
} from './authApi';
