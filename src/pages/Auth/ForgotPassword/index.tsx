import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '@components/common';
import { useAuth } from '@hooks/useAuth';
import { ROUTES } from '@constants/routes';
import { BRAND_NAME } from '@constants/brand';

export default function ForgotPassword() {
  const { forgotPassword, isSubmitting, error } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const ok = await forgotPassword({ email: email.trim().toLowerCase() });
    if (ok) setSubmitted(true);
  };

  if (submitted) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-surface-0 px-6">
        <div className="w-full max-w-sm text-center">
          <Link to={ROUTES.home} className="font-display text-lg font-semibold text-text-primary">
            {BRAND_NAME}
          </Link>

          {/* Success illustration */}
          <div className="mt-10 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 ring-1 ring-green-500/30">
              <svg
                className="h-8 w-8 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="mt-6 font-display text-2xl font-semibold text-text-primary">
            Check your inbox
          </h1>
          <p className="mt-3 text-sm text-text-secondary">
            If <span className="text-text-primary">{email}</span> is registered, we&apos;ve sent a
            6-digit reset code. It expires in 10 minutes.
          </p>

          <Link
            to={ROUTES.resetPassword}
            state={{ email }}
            className="mt-8 inline-block w-full rounded-lg bg-primary py-3 text-center text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
          >
            Enter reset code
          </Link>

          <p className="mt-4 text-sm text-text-secondary">
            Remember your password?{' '}
            <Link to={ROUTES.login} className="font-medium text-primary hover:text-primary-hover">
              Sign in
            </Link>
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
          Reset your password
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Enter the email you registered with and we'll send you a 6-digit reset code.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4" noValidate>
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

          {error && <p className="text-sm text-primary">{error}</p>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={isSubmitting || !email.trim()}
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
