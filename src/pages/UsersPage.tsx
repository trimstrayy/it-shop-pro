import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { UserRole } from '@/types';

interface ProfileRecord {
  id: string;
  auth_user_id: string | null;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

const roleOptions: UserRole[] = ['admin', 'sales', 'inventory', 'accountant', 'technician'];

const UsersPage = () => {
  const { user: currentUser, logout } = useAuth();
  const [users, setUsers] = useState<ProfileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('sales');

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, auth_user_id, email, name, role, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Unable to load users',
        description: error.message,
        variant: 'destructive',
      });
      setUsers([]);
      setIsLoading(false);
      return;
    }

    setUsers((data ?? []) as ProfileRecord[]);
    setIsLoading(false);
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setCreateUserError(null);

    try {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim().toLowerCase();

      if (!trimmedName || !trimmedEmail) {
        setCreateUserError('Name and email are required.');
        toast({ title: 'Missing details', description: 'Name and email are required.', variant: 'destructive' });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          name: trimmedName,
          email: trimmedEmail,
          role,
        },
      });

      const bodyError = typeof data?.error === 'string' ? data.error : undefined;
      if (error || bodyError || !data) {
        const message = bodyError ?? error?.message ?? 'The user could not be created.';
        setCreateUserError(message);
        throw new Error(message);
      }

      if (data.success !== true) {
        const message = typeof data?.error === 'string' ? data.error : 'The user could not be created.';
        setCreateUserError(message);
        throw new Error(message);
      }

      const tempPassword = typeof data.tempPassword === 'string' ? data.tempPassword : undefined;
      toast({
        title: 'User created',
        description: tempPassword
          ? `User created successfully. Temporary password: ${tempPassword}`
          : 'User created successfully.',
      });

      setName('');
      setEmail('');
      setRole('sales');
      await fetchUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setCreateUserError(message);
      toast({ title: 'Create user failed', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (profileId: string, nextRole: UserRole) => {
    const { error } = await supabase.from('profiles').update({ role: nextRole }).eq('id', profileId);

    if (error) {
      toast({ title: 'Role update failed', description: error.message, variant: 'destructive' });
      return;
    }

    await fetchUsers();
    toast({ title: 'Role updated', description: 'User role was updated successfully.' });
  };

  const handleToggleActive = async (profile: ProfileRecord) => {
    const nextActive = !profile.is_active;
    const { error } = await supabase.from('profiles').update({ is_active: nextActive }).eq('id', profile.id);

    if (error) {
      toast({ title: 'Status update failed', description: error.message, variant: 'destructive' });
      return;
    }

    if (currentUser?.id === profile.id) {
      logout();
    }

    await fetchUsers();
    toast({
      title: nextActive ? 'User reactivated' : 'User deactivated',
      description: nextActive ? 'This account is now allowed to sign in again.' : 'This account has been deactivated and can no longer sign in.',
    });
  };

  const handleResetPassword = async (emailAddress: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(emailAddress, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({ title: 'Password reset failed', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Password reset email sent', description: 'The user should receive a reset email shortly.' });
  };

  return (
    <AppLayout>
      <PageHeader
        title="User Management"
        description="Create accounts, assign roles, and control access for staff members."
      />

      <div className="max-w-6xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create User</CardTitle>
            <CardDescription>
              New users are created through a server-side Supabase function so the service role key never reaches the browser.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="userName">Full name</Label>
                <Input id="userName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userEmail">Email</Label>
                <Input id="userEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userRole">Role</Label>
                <select
                  id="userRole"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="border border-input bg-background h-10 w-full rounded-md px-3 text-sm"
                >
                  {roleOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              {createUserError && (
                <div className="md:col-span-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {createUserError}
                </div>
              )}
              <div className="md:col-span-3 flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Review account status and manage access for each user.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading users…</p>
            ) : users.length === 0 ? (
              <p className="text-muted-foreground">No users found.</p>
            ) : (
              <div className="space-y-3">
                {users.map((profile) => (
                  <div key={profile.id} className="rounded-lg border border-border p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium">{profile.name}</p>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Created: {new Date(profile.created_at).toLocaleDateString()}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${profile.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                          {profile.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <select
                          value={profile.role}
                          onChange={(e) => handleRoleChange(profile.id, e.target.value as UserRole)}
                          className="border border-input bg-background h-9 rounded-md px-2 text-sm"
                        >
                          {roleOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <Button variant="outline" onClick={() => handleResetPassword(profile.email)}>
                          Reset Password
                        </Button>
                        <Button variant={profile.is_active ? 'secondary' : 'default'} onClick={() => handleToggleActive(profile)}>
                          {profile.is_active ? 'Deactivate' : 'Reactivate'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default UsersPage;
