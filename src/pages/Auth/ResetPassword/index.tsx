import { useState, useRef } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input } from '@components/common';
import { useAuth } from '@hooks/useAuth';
import { authApi } from '@services/authApi';
import { ROUTES } from '@constants/routes';
import { BRAND_NAME } from '@constants/brand';
import { getApiErrorMessage } from '@utils/apiError';

const RESEND_COOLDOWN_S = 60;

// ─── Password strength helpers ─────────────────────────────────────────────────

function isPasswordStrong(pw: string): boolean {
  return (
    pw.length >= 8 &&
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /[0-9]/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
  );
}

function RuleHint({ valid, label }: { valid: boolean; label: string }) {
  return (
    <span
      className={`flex items-center gap-1 text-xs ${valid ? 'text-green-500' : 'text-text-secondary'}`}
    >
      <span>{valid ? '✓' : '○'}</span>
      {label}
    </span>
  );
}

type Step = 'email' | 'otp' | 'password' | 'success';

export default function ResetPassword() {
  const { resetPasswordOtp, isSubmitting, error, setError } = useAuth();
  const navigate = useNavigate();

  // Pre-fill email if we arrived from ForgotPassword page
  const locationState = useLocation().state as { email?: string } | null;

  const [step, setStep] = useState<Step>(locationState?.email ? 'otp' : 'email');
  const [email, setEmail] = useState(locationState?.email ?? '');

  // OTP step
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(Boolean(locationState?.email));
  const [resendCooldown, setResendCooldown] = useState(locationState?.email ? RESEND_COOLDOWN_S : 0);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Password step
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const maskEmail = (e: string) => {
    const atIdx = e.indexOf('@');
    if (atIdx <= 0) return e;
    const local = e.slice(0, atIdx);
    const domain = e.slice(atIdx);
    return `${local.slice(0, 2)}${'•'.repeat(Math.max(0, local.length - 2))}${domain}`;
  };

  // ─── Cooldown helper ───────────────────────────────────────────────────────

  const startCooldown = () => {
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    setResendCooldown(RESEND_COOLDOWN_S);
    cooldownTimer.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          if (cooldownTimer.current) clearInterval(cooldownTimer.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const sendResetOtp = async (targetEmail: string) => {
    setIsSendingOtp(true);
    setOtpError(null);
    try {
      await authApi.resendOtp({ email: targetEmail, purpose: 'PASSWORD_RESET' });
      setOtpSent(true);
      startCooldown();
    } catch (err) {
      setOtpError(getApiErrorMessage(err, 'Could not send reset code.'));
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ─── Step 1 — Email entry (if arrived directly) ───────────────────────────

  const handleEmailSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await sendResetOtp(email.trim().toLowerCase());
    setStep('otp');
  };

  // ─── Step 2 — OTP verification ────────────────────────────────────────────

  const handleOtpSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (otpInput.length === 6) setStep('password');
  };

  // ─── Step 3 — New password ────────────────────────────────────────────────

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    setError(null);

    if (!isPasswordStrong(newPassword)) {
      setPasswordError('Password does not meet all requirements.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    const ok = await resetPasswordOtp({
      email: email.trim().toLowerCase(),
      code: otpInput.trim(),
      password: newPassword,
      confirmPassword,
    });

    if (ok) setStep('success');
  };

  // ─── Success screen ───────────────────────────────────────────────────────

  if (step === 'success') {
    return (
      <section className="flex min-h-screen items-center justify-center bg-surface-0 px-6">
        <div className="w-full max-w-sm text-center">
          <Link to={ROUTES.home} className="font-display text-lg font-semibold text-text-primary">
            {BRAND_NAME}
          </Link>
          <div className="mt-10 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 ring-1 ring-green-500/30">
              <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="mt-6 font-display text-2xl font-semibold text-text-primary">
            Password reset!
          </h1>
          <p className="mt-3 text-sm text-text-secondary">
            Your password has been updated. You can now sign in.
          </p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.login)}
            className="mt-8 inline-block w-full rounded-lg bg-primary py-3 text-center text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
          >
            Sign in
          </button>
        </div>
      </section>
    );
  }

  // ─── Step 3 — New password form ───────────────────────────────────────────

  if (step === 'password') {
    const rules = {
      minLength: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNum: /[0-9]/.test(newPassword),
      hasSpec: /[^A-Za-z0-9]/.test(newPassword),
    };

    return (
      <section className="flex min-h-screen items-center justify-center bg-surface-0 px-6">
        <div className="w-full max-w-sm">
          <Link to={ROUTES.home} className="font-display text-lg font-semibold text-text-primary">
            {BRAND_NAME}
          </Link>
          <h1 className="mt-8 font-display text-3xl font-semibold text-text-primary">
            Set new password
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Choose a strong password for <span className="text-text-primary">{maskEmail(email)}</span>.
          </p>

          <form onSubmit={handlePasswordSubmit} className="mt-8 flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Input
                label="New Password"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onFocus={() => setShowRules(true)}
                onChange={(event) => setNewPassword(event.target.value)}
              />
              {showRules && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-md bg-surface-1 p-2.5">
                  <RuleHint valid={rules.minLength} label="8+ characters" />
                  <RuleHint valid={rules.hasUpper} label="Uppercase letter" />
                  <RuleHint valid={rules.hasLower} label="Lowercase letter" />
                  <RuleHint valid={rules.hasNum} label="Number" />
                  <RuleHint valid={rules.hasSpec} label="Special character" />
                </div>
              )}
            </div>

            <Input
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />

            {(passwordError ?? error) && (
              <p className="text-sm text-primary">{passwordError ?? error}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="mt-2"
            >
              Reset password
            </Button>
          </form>
        </div>
      </section>
    );
  }

  // ─── Step 2 — OTP entry ───────────────────────────────────────────────────

  if (step === 'otp') {
    return (
      <section className="flex min-h-screen items-center justify-center bg-surface-0 px-6">
        <div className="w-full max-w-sm">
          <Link to={ROUTES.home} className="font-display text-lg font-semibold text-text-primary">
            {BRAND_NAME}
          </Link>
          <h1 className="mt-8 font-display text-3xl font-semibold text-text-primary">
            Enter reset code
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {isSendingOtp
              ? `Sending a 6-digit code to ${maskEmail(email)}…`
              : otpSent
                ? `Enter the 6-digit code we sent to ${maskEmail(email)}.`
                : `We couldn't send a code to ${maskEmail(email)}.`}
          </p>

          <form onSubmit={handleOtpSubmit} className="mt-8 flex flex-col gap-4" noValidate>
            <Input
              label="Reset Code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              required
              disabled={!otpSent}
              value={otpInput}
              onChange={(event) => setOtpInput(event.target.value.replace(/\D/g, ''))}
            />

            {otpError && <p className="text-sm text-primary">{otpError}</p>}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={otpInput.length !== 6}
              className="mt-2"
            >
              Continue
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="md"
              isLoading={isSendingOtp}
              disabled={resendCooldown > 0 || isSendingOtp}
              onClick={() => sendResetOtp(email)}
            >
              {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Wrong email?{' '}
            <button
              type="button"
              className="font-medium text-primary hover:text-primary-hover"
              onClick={() => {
                setStep('email');
                setOtpSent(false);
                setOtpInput('');
              }}
            >
              Go back
            </button>
          </p>
        </div>
      </section>
    );
  }

  // ─── Step 1 — Email entry ─────────────────────────────────────────────────

  return (
    <section className="flex min-h-screen items-center justify-center bg-surface-0 px-6">
      <div className="w-full max-w-sm">
        <Link to={ROUTES.home} className="font-display text-lg font-semibold text-text-primary">
          {BRAND_NAME}
        </Link>
        <h1 className="mt-8 font-display text-3xl font-semibold text-text-primary">
          Reset your password
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Enter your email and we&apos;ll send a 6-digit reset code.
        </p>

        <form onSubmit={handleEmailSubmit} className="mt-8 flex flex-col gap-4" noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          {(otpError ?? error) && <p className="text-sm text-primary">{otpError ?? error}</p>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSendingOtp}
            disabled={isSendingOtp || !email.trim()}
            className="mt-2"
          >
            Send reset code
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Back to{' '}
          <Link to={ROUTES.login} className="font-medium text-primary hover:text-primary-hover">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
