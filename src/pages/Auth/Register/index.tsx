import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '@components/common';
import { authApi } from '@services/authApi';
import { useClientStore } from '@store/clientStore';
import { ROUTES } from '@constants/routes';
import { BRAND_NAME } from '@constants/brand';
import type { RegisterPayload } from '@app-types/user.types';
import { getApiErrorMessage } from '@utils/apiError';

const RESEND_COOLDOWN_S = 60;

type Step = 'form' | 'otp';

// ─── Password strength helpers ────────────────────────────────────────────────

interface PasswordRules {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

function checkPassword(pw: string): PasswordRules {
  return {
    minLength: pw.length >= 8,
    hasUppercase: /[A-Z]/.test(pw),
    hasLowercase: /[a-z]/.test(pw),
    hasNumber: /[0-9]/.test(pw),
    hasSpecial: /[^A-Za-z0-9]/.test(pw),
  };
}

function isPasswordStrong(pw: string): boolean {
  const r = checkPassword(pw);
  return r.minLength && r.hasUppercase && r.hasLowercase && r.hasNumber && r.hasSpecial;
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('form');

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // OTP state
  const [pendingPayload, setPendingPayload] = useState<RegisterPayload | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingAndRegistering, setIsVerifyingAndRegistering] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const passwordRules = checkPassword(password);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    };
  }, []);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const maskEmail = (e: string) => {
    const atIdx = e.indexOf('@');
    if (atIdx <= 0) return e;
    const local = e.slice(0, atIdx);
    const domain = e.slice(atIdx);
    return `${local.slice(0, 2)}${'•'.repeat(Math.max(0, local.length - 2))}${domain}`;
  };

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

  const dispatchOtp = async (targetEmail: string, targetName: string) => {
    setIsSendingOtp(true);
    setOtpError(null);
    try {
      await authApi.sendOtp({ email: targetEmail, name: targetName });
      setOtpSent(true);
      startCooldown();
      return true;
    } catch (err) {
      setOtpError(getApiErrorMessage(err, 'Could not send the verification code.'));
      return false;
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ─── Step 1 — Form submit ──────────────────────────────────────────────────

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setValidationError(null);
    setOtpError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setValidationError('Please enter your first and last name.');
      return;
    }
    if (!isPasswordStrong(password)) {
      setValidationError('Password does not meet all requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    const payload: RegisterPayload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password,
    };
    setPendingPayload(payload);

    setIsSendingOtp(true);
    try {
      await authApi.sendOtp({ email: payload.email, name: `${payload.firstName} ${payload.lastName}` });
      setOtpSent(true);
      startCooldown();
      setStep('otp');
    } catch (err) {
      setValidationError(getApiErrorMessage(err, 'Could not send verification code.'));
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ─── Step 2 — OTP verify + Register ───────────────────────────────────────

  const handleVerify = async (event: FormEvent) => {
    event.preventDefault();
    setOtpError(null);
    if (!pendingPayload) return;

    setIsVerifyingAndRegistering(true);
    try {
      // 1. Verify OTP
      await authApi.verifyOtp({ email: pendingPayload.email, code: otpInput.trim() });

      // 2. Create account (does NOT return a session)
      await authApi.register(pendingPayload);

      // Add registered client to local store so admin can view & assign models immediately
      useClientStore.getState().addClientFromRegistration({
        name: `${pendingPayload.firstName} ${pendingPayload.lastName}`.trim(),
        email: pendingPayload.email,
      });

      // 3. Redirect to login with a success indicator
      navigate(ROUTES.login, { state: { registered: true } });
    } catch (err) {
      setOtpError(getApiErrorMessage(err, 'Verification or registration failed.'));
    } finally {
      setIsVerifyingAndRegistering(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !pendingPayload || isSendingOtp) return;
    setOtpInput('');
    await dispatchOtp(pendingPayload.email, `${pendingPayload.firstName} ${pendingPayload.lastName}`);
  };

  // ─── OTP screen ────────────────────────────────────────────────────────────

  if (step === 'otp') {
    return (
      <section className="flex min-h-screen items-center justify-center bg-surface-0 px-6">
        <div className="w-full max-w-sm">
          <Link to={ROUTES.home} className="font-display text-lg font-semibold text-text-primary">
            {BRAND_NAME}
          </Link>

          <h1 className="mt-8 font-display text-3xl font-semibold text-text-primary">
            Verify your email
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {isSendingOtp
              ? `Sending a 6-digit code to ${maskEmail(email)}…`
              : otpSent
                ? `Enter the 6-digit code we sent to ${maskEmail(email)}.`
                : `We couldn't send a code to ${maskEmail(email)}.`}
          </p>

          <form onSubmit={handleVerify} className="mt-8 flex flex-col gap-4" noValidate>
            <Input
              label="Verification Code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              required
              disabled={!otpSent || isVerifyingAndRegistering}
              value={otpInput}
              onChange={(event) => setOtpInput(event.target.value.replace(/\D/g, ''))}
            />

            {otpError && (
              <p className="text-sm text-primary">{otpError}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isVerifyingAndRegistering}
              disabled={!otpSent || otpInput.length !== 6 || isVerifyingAndRegistering}
              className="mt-2"
            >
              Verify &amp; Create Account
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="md"
              isLoading={isSendingOtp}
              disabled={resendCooldown > 0 || isSendingOtp || isVerifyingAndRegistering}
              onClick={handleResend}
            >
              {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Wrong email?{' '}
            <button
              type="button"
              className="font-medium text-primary hover:text-primary-hover disabled:opacity-50"
              disabled={isVerifyingAndRegistering}
              onClick={() => {
                setOtpError(null);
                setStep('form');
              }}
            >
              Go back
            </button>
          </p>
        </div>
      </section>
    );
  }

  // ─── Registration form ─────────────────────────────────────────────────────

  return (
    <section className="flex min-h-screen items-center justify-center bg-surface-0 px-6">
      <div className="w-full max-w-sm">
        <Link to={ROUTES.home} className="font-display text-lg font-semibold text-text-primary">
          {BRAND_NAME}
        </Link>

        <h1 className="mt-8 font-display text-3xl font-semibold text-text-primary">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Start visualizing your projects in interactive 3D.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4" noValidate>
          {/* Name row */}
          <div className="flex gap-3">
            <Input
              label="First Name"
              autoComplete="given-name"
              required
              disabled={isSendingOtp}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
            <Input
              label="Last Name"
              autoComplete="family-name"
              required
              disabled={isSendingOtp}
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </div>

          <Input
            label="Email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            disabled={isSendingOtp}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              disabled={isSendingOtp}
              value={password}
              onFocus={() => setShowPasswordRules(true)}
              onChange={(event) => setPassword(event.target.value)}
            />
            {showPasswordRules && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-md bg-surface-1 p-2.5">
                <RuleHint valid={passwordRules.minLength} label="8+ characters" />
                <RuleHint valid={passwordRules.hasUppercase} label="Uppercase letter" />
                <RuleHint valid={passwordRules.hasLowercase} label="Lowercase letter" />
                <RuleHint valid={passwordRules.hasNumber} label="Number" />
                <RuleHint valid={passwordRules.hasSpecial} label="Special character" />
              </div>
            )}
          </div>

          <Input
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            disabled={isSendingOtp}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />

          {validationError && (
            <p className="text-sm text-primary">{validationError}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSendingOtp}
            disabled={isSendingOtp}
            className="mt-2"
          >
            Continue
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link to={ROUTES.login} className="font-medium text-primary hover:text-primary-hover">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
