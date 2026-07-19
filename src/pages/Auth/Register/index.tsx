import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '@components/common';
import { useAuth } from '@hooks/useAuth';
import { apiClient } from '@services/apiClient';
import { ROUTES } from '@constants/routes';
import { BRAND_NAME } from '@constants/brand';
import type { RegisterPayload } from '@app-types/user.types';
import { getApiErrorMessage } from '@utils/apiError';

const RESEND_COOLDOWN_S = 60;

type Step = 'form' | 'otp';

export default function Register() {
  const { register, isSubmitting, error } = useAuth();
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const [pendingPayload, setPendingPayload] = useState<RegisterPayload | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const dispatchOtp = async (targetEmail: string, targetName: string) => {
    setIsSendingOtp(true);
    setOtpError(null);
    try {
      await apiClient.post('/auth/send-otp', { email: targetEmail, name: targetName });
      setOtpSent(true);
      setResendCooldown(RESEND_COOLDOWN_S);
      const timer = window.setInterval(() => {
        setResendCooldown((s) => {
          if (s <= 1) {
            window.clearInterval(timer);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (err) {
      setOtpError(getApiErrorMessage(err, 'Could not send the verification email.'));
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setValidationError(null);

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    const payload: RegisterPayload = { name, email, password };
    setPendingPayload(payload);
    setStep('otp');
    await dispatchOtp(email, name);
  };

  const handleVerify = async (event: FormEvent) => {
    event.preventDefault();
    setOtpError(null);

    if (!pendingPayload) return;

    try {
      // Verify OTP on the backend, then register the account
      await apiClient.post('/auth/verify-otp', {
        email: pendingPayload.email,
        code: otpInput.trim(),
      });
      register(pendingPayload);
    } catch (err) {
      setOtpError(getApiErrorMessage(err, 'Invalid or expired verification code.'));
    }
  };

  const handleResend = () => {
    if (resendCooldown > 0 || !pendingPayload) return;
    setOtpInput('');
    dispatchOtp(pendingPayload.email, pendingPayload.name);
  };

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
              ? `Sending a 6-digit code to ${email}…`
              : otpSent
                ? `Enter the 6-digit code we sent to ${email}.`
                : `We couldn't send a code to ${email}.`}
          </p>

          <form onSubmit={handleVerify} className="mt-8 flex flex-col gap-4" noValidate>
            <Input
              label="Verification Code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              required
              disabled={!otpSent}
              value={otpInput}
              onChange={(event) => setOtpInput(event.target.value.replace(/\D/g, ''))}
            />

            {(otpError ?? error) && <p className="text-sm text-primary">{otpError ?? error}</p>}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              disabled={!otpSent || otpInput.length !== 6}
              className="mt-2"
            >
              Verify &amp; Create Account
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="md"
              isLoading={isSendingOtp}
              disabled={resendCooldown > 0}
              onClick={handleResend}
            >
              {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Wrong email?{' '}
            <button
              type="button"
              className="font-medium text-primary hover:text-primary-hover"
              onClick={() => setStep('form')}
            >
              Go back
            </button>
          </p>
        </div>
      </section>
    );
  }

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
          <Input
            label="Full Name"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
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
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Input
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />

          {(validationError ?? error) && (
            <p className="text-sm text-primary">{validationError ?? error}</p>
          )}

          <Button type="submit" variant="primary" size="lg" className="mt-2">
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
