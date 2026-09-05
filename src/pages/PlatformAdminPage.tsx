import { FormEvent, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Building2, LogOut, Plus, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { TemporaryPassword } from '@/components/TemporaryPassword';

interface TenantRecord {
  id: string;
  business_name: string;
  business_type: string | null;
  owner_name: string;
  owner_email: string | null;
  is_active: boolean;
  created_at: string;
}

const emptyForm = {
  businessName: '',
  businessType: 'IT Shop',
  ownerName: '',
  ownerPhone: '',
  ownerEmail: '',
  businessAddress: '',
  adminEmail: '',
  adminName: '',
};

const getFunctionError = async (error: unknown): Promise<string | undefined> => {
  const response = (error as { context?: Response })?.context;
  if (!response) return error instanceof Error ? error.message : undefined;

  try {
    const payload = await response.clone().json() as { error?: string };
    return payload.error || `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

const PlatformAdminPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTenants = async () => {
    const { data, error } = await supabase
      .from('tenants')
      .select('id, business_name, business_type, owner_name, owner_email, is_active, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Unable to load clients', description: error.message, variant: 'destructive' });
    } else {
      setTenants((data ?? []) as TenantRecord[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user?.isPlatformAdmin) void loadTenants();
  }, [user?.isPlatformAdmin]);

  if (!user) return <Navigate to="/login" replace />;
  if (!user.isPlatformAdmin) return <Navigate to="/dashboard" replace />;

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          business_name: form.businessName.trim(),
          business_type: form.businessType,
          owner_name: form.ownerName.trim(),
          owner_phone: form.ownerPhone.trim(),
          owner_email: form.ownerEmail.trim().toLowerCase(),
          business_address: form.businessAddress.trim(),
          admin_account_email: form.adminEmail.trim().toLowerCase(),
          admin_account_name: form.adminName.trim(),
        },
      });
      const message = data?.error ?? await getFunctionError(error);
      if (message || data?.success !== true) throw new Error(message ?? 'The client could not be created.');

      toast({
        title: 'Client created',
        description: data.tempPassword
          ? <TemporaryPassword password={data.tempPassword} />
          : 'The new client account is ready.',
      });
      setForm(emptyForm);
      await loadTenants();
    } catch (error) {
      toast({ title: 'Create client failed', description: error instanceof Error ? error.message : 'Unexpected error', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background p-6 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary"><ShieldCheck className="h-5 w-5" /><span className="text-sm font-medium">Platform Console</span></div>
            <h1 className="mt-2 text-3xl font-bold">Clients</h1>
            <p className="text-muted-foreground">Manage businesses and their first administrator accounts.</p>
          </div>
          <Button variant="outline" onClick={() => { logout(); navigate('/login'); }}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Create New Client</CardTitle>
            <CardDescription>Creates the business and its first tenant administrator together.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2"><Label htmlFor="businessName">Business name</Label><Input id="businessName" value={form.businessName} onChange={(e) => updateField('businessName', e.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="businessType">Business type</Label><select id="businessType" value={form.businessType} onChange={(e) => updateField('businessType', e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option>IT Shop</option><option>Furniture</option><option>Other</option></select></div>
              <div className="space-y-2"><Label htmlFor="ownerName">Owner name</Label><Input id="ownerName" value={form.ownerName} onChange={(e) => updateField('ownerName', e.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="ownerPhone">Owner phone</Label><Input id="ownerPhone" value={form.ownerPhone} onChange={(e) => updateField('ownerPhone', e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="ownerEmail">Owner email</Label><Input id="ownerEmail" type="email" value={form.ownerEmail} onChange={(e) => updateField('ownerEmail', e.target.value)} /></div>
              <div className="space-y-2 md:col-span-2"><Label htmlFor="businessAddress">Business address</Label><Input id="businessAddress" value={form.businessAddress} onChange={(e) => updateField('businessAddress', e.target.value)} /></div>
              <div className="md:col-span-2 lg:col-span-3 border-t pt-4"><p className="font-medium">First admin account</p></div>
              <div className="space-y-2"><Label htmlFor="adminEmail">Admin account email</Label><Input id="adminEmail" type="email" value={form.adminEmail} onChange={(e) => updateField('adminEmail', e.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="adminName">Admin account name</Label><Input id="adminName" value={form.adminName} onChange={(e) => updateField('adminName', e.target.value)} required /></div>
              <div className="flex items-end"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Client'}</Button></div>
            </form>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">All Clients</h2>
          {isLoading ? <p className="text-muted-foreground">Loading clients...</p> : tenants.length === 0 ? <p className="text-muted-foreground">No clients found.</p> : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tenants.map((tenant) => (
                <Card key={tenant.id}>
                  <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Building2 className="h-5 w-5" />{tenant.business_name}</CardTitle><CardDescription>{tenant.business_type || 'Business'}</CardDescription></CardHeader>
                  <CardContent className="space-y-2 text-sm"><p><span className="text-muted-foreground">Owner:</span> {tenant.owner_name}</p><p><span className="text-muted-foreground">Email:</span> {tenant.owner_email || 'Not provided'}</p><p><span className="text-muted-foreground">Created:</span> {new Date(tenant.created_at).toLocaleDateString()}</p><p className={tenant.is_active ? 'text-emerald-600' : 'text-destructive'}>{tenant.is_active ? 'Active' : 'Inactive'}</p></CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default PlatformAdminPage;
