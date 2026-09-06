import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ProfileDetails = () => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Keep the form in sync with the authenticated profile (e.g. after a reload).
  useEffect(() => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
  }, [user?.email, user?.name]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setFormError('Full name is required.');
      toast({ title: 'Missing details', description: 'Full name is required.', variant: 'destructive' });
      return;
    }

    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      setFormError('Please enter a valid email address.');
      toast({ title: 'Invalid email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateProfile({ name: trimmedName, email: normalizedEmail });

      if (result.error) {
        setFormError(result.error);
        toast({ title: 'Profile update failed', description: result.error, variant: 'destructive' });
        return;
      }

      if (result.emailConfirmationPending) {
        toast({
          title: 'Email change pending confirmation',
          description: 'We sent a confirmation link to your new email address. Your sign-in email updates once you confirm it.',
        });
      } else {
        toast({ title: 'Profile updated successfully', description: 'Your account details have been saved.' });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update your profile. Please try again.';
      setFormError(message);
      toast({ title: 'Profile update failed', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Details
        </CardTitle>
        <CardDescription>
          Update your full name and sign-in email address.
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profileName">Full Name</Label>
              <Input
                id="profileName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profileEmail">Email</Label>
              <Input
                id="profileEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export { ProfileDetails };