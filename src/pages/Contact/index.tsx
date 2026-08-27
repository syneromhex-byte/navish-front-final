import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button, Input, Textarea } from '@components/common';
import { BRAND_CONTACT } from '@constants/brand';
import { useClientStore } from '@store/clientStore';
import { apiClient } from '@services/apiClient';

interface ContactFormState {
  name: string;
  email: string;
  projectType: string;
  message: string;
}

const INITIAL_STATE: ContactFormState = { name: '', email: '', projectType: '', message: '' };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Contact() {
  const addClientFromContact = useClientStore((state) => state.addClientFromContact);
  const [form, setForm] = useState<ContactFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<ContactFormState>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const updateField =
    (field: keyof ContactFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const validate = (): boolean => {
    const nextErrors: Partial<ContactFormState> = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required';
    if (!EMAIL_PATTERN.test(form.email)) nextErrors.email = 'Enter a valid email address';
    if (!form.message.trim()) nextErrors.message = 'Tell us a bit about your project';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setStatus('submitting');
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      projectType: form.projectType.trim() || undefined,
      message: form.message.trim(),
    };

    try {
      await apiClient.post('/contact', payload);
    } catch (err) {
      console.warn('Backend email dispatch warning (falling back to client store):', err);
    }

    addClientFromContact(payload);
    setStatus('success');
    setForm(INITIAL_STATE);
  };

  return (
    <section className="px-6 pb-24 pt-40">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Contact</p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-text-primary sm:text-5xl">
          Start a conversation
        </h1>
        <p className="mt-4 text-text-secondary">
          Tell us about your space and we&apos;ll get back to you within one business day.
        </p>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a
            href={BRAND_CONTACT.phoneHref}
            className="flex items-center gap-2 text-text-secondary transition-colors hover:text-primary"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M4.5 3h3l1.5 4-2 1.5a10 10 0 0 0 4.5 4.5l1.5-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A15 15 0 0 1 3 4.6 1.5 1.5 0 0 1 4.5 3Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {BRAND_CONTACT.phone}
          </a>
          <a
            href={BRAND_CONTACT.emailHref}
            className="flex items-center gap-2 text-text-secondary transition-colors hover:text-primary"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M3 5.5h14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path
                d="M2.5 6L10 11.5 17.5 6"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {BRAND_CONTACT.email}
          </a>
        </div>

        {status === 'success' ? (
          <div className="glass-panel mt-10 rounded-2xl p-8 text-center">
            <p className="font-display text-xl font-semibold text-text-primary">Message sent</p>
            <p className="mt-2 text-sm text-text-secondary">
              Thanks for reaching out — we&apos;ll follow up shortly.
            </p>
            <Button variant="outline" className="mt-6" onClick={() => setStatus('idle')}>
              Send another message
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-5" noValidate>
            <Input
              label="Full Name"
              placeholder="Jane Cooper"
              value={form.name}
              onChange={updateField('name')}
              error={errors.name}
            />
            <Input
              label="Email"
              type="email"
              placeholder="jane@studio.com"
              value={form.email}
              onChange={updateField('email')}
              error={errors.email}
            />
            <Input
              label="Project Type"
              placeholder="Residential, Commercial, Hospitality…"
              value={form.projectType}
              onChange={updateField('projectType')}
            />
            <Textarea
              label="Message"
              placeholder="Tell us about your space…"
              value={form.message}
              onChange={updateField('message')}
              error={errors.message}
            />
            <Button type="submit" variant="primary" size="lg" isLoading={status === 'submitting'}>
              Send Message
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
