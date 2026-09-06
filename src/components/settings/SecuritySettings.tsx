import { FormEvent, useState } from 'react';
import { AlertCircle, KeyRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

const MIN_PASSWORD_LENGTH = 6;

const SecuritySettings = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const clearFields = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!currentPassword) {
      setFormError('Please enter your current password.');
      toast({ title: 'Current password required', description: 'Enter your current password to continue.', variant: 'destructive' });
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setFormError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      toast({
        title: 'Password too short',
        description: `New password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('The new password and confirmation do not match.');
      toast({ title: 'Passwords do not match', description: 'Please confirm the new password.', variant: 'destructive' });
      return;
    }

    if (!user?.email) {
      setFormError('You must be signed in to change your password.');
      toast({ title: 'Not signed in', description: 'Sign in again and retry the password change.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Re-authenticate with the current password so the password change is
      // authorized against a fresh session instead of silently failing.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        const message = 'The current password you entered is incorrect.';
        setFormError(message);
        toast({ title: 'Verification failed', description: signInError.message || message, variant: 'destructive' });
        return;
      }

      const { data, error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setFormError(error.message);
        toast({ title: 'Password update failed', description: error.message, variant: 'destructive' });
        return;
      }

      if (!data.user) {
        throw new Error('Supabase did not confirm the password update.');
      }

      toast({ title: 'Password updated successfully', description: 'Use your new password the next time you sign in.' });
      clearFields();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update your password. Please try again.';
      setFormError(message);
      toast({ title: 'Password update failed', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Security Settings
        </CardTitle>
        <CardDescription>
          Change your password. You must enter your current password to approve the change.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              {formError}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <PasswordInput
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <PasswordInput
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating Password...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export { SecuritySettings };