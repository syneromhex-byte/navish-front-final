import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button, Input } from '@components/common';
import { useUserStore } from '@store/userStore';

export default function Settings() {
  const user = useUserStore((state) => state.user);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileStatus, setProfileStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setProfileStatus('saving');
    await new Promise((resolve) => setTimeout(resolve, 600));
    setProfileStatus('saved');
  };

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordStatus('saving');
    await new Promise((resolve) => setTimeout(resolve, 600));
    setPasswordStatus('saved');
    setCurrentPassword('');
    setNewPassword('');
  };

  return (
    <div className="max-w-2xl p-8">
      <h1 className="font-display text-2xl font-semibold text-text-primary">Settings</h1>

      <form
        onSubmit={handleProfileSubmit}
        className="glass-panel mt-8 flex flex-col gap-4 rounded-2xl p-6"
      >
        <h2 className="text-sm font-semibold text-text-primary">Profile</h2>
        <Input label="Full Name" value={name} onChange={(event) => setName(event.target.value)} />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" isLoading={profileStatus === 'saving'}>
            Save Changes
          </Button>
          {profileStatus === 'saved' && <span className="text-xs text-text-secondary">Saved</span>}
        </div>
      </form>

      <form
        onSubmit={handlePasswordSubmit}
        className="glass-panel mt-6 flex flex-col gap-4 rounded-2xl p-6"
      >
        <h2 className="text-sm font-semibold text-text-primary">Change Password</h2>
        <Input
          label="Current Password"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
        <Input
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
        <div className="flex items-center gap-3">
          <Button type="submit" variant="outline" isLoading={passwordStatus === 'saving'}>
            Update Password
          </Button>
          {passwordStatus === 'saved' && (
            <span className="text-xs text-text-secondary">Updated</span>
          )}
        </div>
      </form>
    </div>
  );
}
