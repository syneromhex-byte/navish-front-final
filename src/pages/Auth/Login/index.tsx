import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Input } from '@components/common';
import { useAuth } from '@hooks/useAuth';
import { ROUTES } from '@constants/routes';
import { BRAND_NAME } from '@constants/brand';

export default function Login() {
  const { login, isSubmitting, error } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Show a success banner when redirected here after registration
  const justRegistered = (location.state as { registered?: boolean } | null)?.registered === true;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    login({ email, password });
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-surface-0 px-6">
      <div className="w-full max-w-sm">
        <Link to={ROUTES.home} className="font-display text-lg font-semibold text-text-primary">
          {BRAND_NAME}
        </Link>

        <h1 className="mt-8 font-display text-3xl font-semibold text-text-primary">Sign in</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Welcome back. Enter your details to view the models shared with you.
        </p>

        {/* Post-registration success alert */}
        {justRegistered && (
          <div className="mt-6 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            Account created successfully. Please sign in.
          </div>
        )}

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
          <div className="flex flex-col gap-1">
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <div className="text-right">
              <Link
                to={ROUTES.forgotPassword}
                className="text-xs text-text-secondary hover:text-primary"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {error && <p className="text-sm text-primary">{error}</p>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="mt-2"
          >
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link to={ROUTES.register} className="font-medium text-primary hover:text-primary-hover">
            Create one
          </Link>
        </p>
      </div>
    </section>
  );
}
