import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Building2, Loader2, LogOut, Pause, Play, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { TemporaryPassword } from '@/components/TemporaryPassword';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type TenantStatus = 'active' | 'paused' | 'deleted';
type TenantStatusFilter = 'all' | TenantStatus;

interface TenantRecord {
  id: string;
  business_name: string;
  business_type: string | null;
  owner_name: string;
  owner_email: string | null;
  is_active: boolean;
  status: TenantStatus;
  paused_at: string | null;
  paused_reason: string | null;
  deleted_at: string | null;
  created_at: string;
  enabled_modules: Record<string, boolean>;
}

const moduleLabels = {
  repair_lab: 'Repair Lab',
  deliveries: 'Deliveries',
  quotations: 'Quotations',
  parties: 'Parties',
  credit_management: 'Credit Management',
} as const;

const defaultModules = Object.fromEntries(Object.keys(moduleLabels).map(key => [key, true])) as Record<keyof typeof moduleLabels, boolean>;

interface TenantCardProps {
  tenant: TenantRecord;
  onToggleModule: (tenant: TenantRecord, module: keyof typeof moduleLabels) => void;
  onPause: (tenant: TenantRecord, reason: string) => Promise<boolean>;
  onResume: (tenant: TenantRecord) => Promise<boolean>;
  onDelete: (tenant: TenantRecord) => Promise<boolean>;
}

const TenantCard = ({ tenant, onToggleModule, onPause, onResume, onDelete }: TenantCardProps) => {
  const [dialog, setDialog] = useState<'pause' | 'resume' | 'delete' | null>(null);
  const [pauseReason, setPauseReason] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [pendingAction, setPendingAction] = useState<'pause' | 'resume' | 'delete' | null>(null);

  const isDeleted = tenant.status === 'deleted';
  const busy = pendingAction !== null;

  const openDialog = (type: 'pause' | 'resume' | 'delete') => {
    setPauseReason('');
    setDeleteConfirmation('');
    setDialog(type);
  };

  const closeDialog = (type: 'pause' | 'resume' | 'delete') => {
    if (pendingAction !== type) setDialog(null);
  };

  const runAction = async (type: 'pause' | 'resume' | 'delete') => {
    setPendingAction(type);
    try {
      const succeeded = type === 'pause'
        ? await onPause(tenant, pauseReason)
        : type === 'resume'
          ? await onResume(tenant)
          : await onDelete(tenant);
      if (succeeded) setDialog(null);
    } finally {
      setPendingAction(null);
    }
  };

  const statusVariant = tenant.status === 'paused'
    ? 'warning' as const
    : tenant.status === 'deleted'
      ? 'default' as const
      : 'success' as const;

  return (
    <Card className={isDeleted ? 'opacity-60' : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Building2 className="h-5 w-5" />{tenant.business_name}</CardTitle>
        <CardDescription className="flex flex-wrap items-center justify-between gap-2">
          <span>{tenant.business_type || 'Business'}</span>
          <StatusBadge status={tenant.status} variant={statusVariant} />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p><span className="text-muted-foreground">Owner:</span> {tenant.owner_name}</p>
        <p><span className="text-muted-foreground">Email:</span> {tenant.owner_email || 'Not provided'}</p>
        <p><span className="text-muted-foreground">Created:</span> {new Date(tenant.created_at).toLocaleDateString()}</p>
        {tenant.status === 'paused' && (
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Paused since {tenant.paused_at ? format(new Date(tenant.paused_at), 'MMM dd, yyyy') : '—'}</p>
            {tenant.paused_reason ? <p>Reason: {tenant.paused_reason}</p> : null}
          </div>
        )}
        <div className="border-t pt-3">
          <p className="mb-2 font-medium">Modules</p>
          <div className="space-y-2">
            {Object.entries(moduleLabels).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input type="checkbox" checked={tenant.enabled_modules?.[key] !== false} disabled={isDeleted} onChange={() => void onToggleModule(tenant, key as keyof typeof moduleLabels)} />{label}
              </label>
            ))}
          </div>
        </div>
        {!isDeleted && (
          <div className="flex flex-wrap gap-2 border-t pt-3">
            {tenant.status === 'active' && (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => openDialog('pause')}><Pause className="h-4 w-4" />Pause</Button>
            )}
            {tenant.status === 'paused' && (
              <Button size="sm" disabled={busy} onClick={() => openDialog('resume')}><Play className="h-4 w-4" />Resume</Button>
            )}
            <Button size="sm" variant="destructive" disabled={busy} onClick={() => openDialog('delete')}><Trash2 className="h-4 w-4" />Delete</Button>
          </div>
        )}
      </CardContent>
<AlertDialog open={dialog === 'pause'} onOpenChange={(open) => { if (!open) closeDialog('pause'); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pause {tenant.business_name}?</AlertDialogTitle>
            <AlertDialogDescription>The client will lose access to the app until it is resumed. You can leave an optional reason for the pause.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`pause-reason-${tenant.id}`}>Reason (e.g. delayed payment)</Label>
            <Input id={`pause-reason-${tenant.id}`} value={pauseReason} onChange={(event) => setPauseReason(event.target.value)} placeholder="Optional" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button type="button" variant="outline" disabled={pendingAction === 'pause'} onClick={() => void runAction('pause')}>
                {pendingAction === 'pause' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />}
                {pendingAction === 'pause' ? 'Pausing...' : 'Pause client'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={dialog === 'resume'} onOpenChange={(open) => { if (!open) closeDialog('resume'); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate {tenant.business_name}?</AlertDialogTitle>
            <AlertDialogDescription>This client will regain access to the app and the pause reason will be cleared.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button type="button" disabled={pendingAction === 'resume'} onClick={() => void runAction('resume')}>
                {pendingAction === 'resume' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {pendingAction === 'resume' ? 'Reactivating...' : 'Reactivate'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={dialog === 'delete'} onOpenChange={(open) => { if (!open) closeDialog('delete'); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {tenant.business_name}?</AlertDialogTitle>
            <AlertDialogDescription>This is a soft delete — the client is deactivated and marked as deleted, but all historical records remain in the database. Type the exact business name to confirm.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`delete-confirm-${tenant.id}`}>Type "{tenant.business_name}" to confirm</Label>
            <Input id={`delete-confirm-${tenant.id}`} value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button type="button" variant="destructive" disabled={pendingAction === 'delete' || deleteConfirmation.trim() !== tenant.business_name} onClick={() => void runAction('delete')}>
                {pendingAction === 'delete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {pendingAction === 'delete' ? 'Deleting...' : 'Delete client'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

const emptyForm = {
  businessName: '',
  businessType: 'IT Shop',
  ownerName: '',
  ownerPhone: '',
  ownerEmail: '',
  businessAddress: '',
  adminEmail: '',
  adminName: '',
  enabledModules: defaultModules,
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
  const [statusFilter, setStatusFilter] = useState<TenantStatusFilter>('active');
  const filteredTenants = useMemo(
    () => tenants.filter(tenant => statusFilter === 'all' || tenant.status === statusFilter),
    [tenants, statusFilter],
  );

  const loadTenants = async () => {
    const { data, error } = await supabase
      .from('tenants')
      .select('id, business_name, business_type, owner_name, owner_email, is_active, status, paused_at, paused_reason, deleted_at, created_at, enabled_modules')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Unable to load clients', description: error.message, variant: 'destructive' });
    } else {
      setTenants((data ?? []).map((tenant) => ({
        ...tenant,
        status: tenant.status === 'paused' || tenant.status === 'deleted' ? tenant.status : 'active',
      })) as TenantRecord[]);
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

  const toggleTenantModule = async (tenant: TenantRecord, module: keyof typeof moduleLabels) => {
    const enabled_modules = { ...defaultModules, ...(tenant.enabled_modules || {}), [module]: !tenant.enabled_modules?.[module] };
    const { data, error } = await supabase.from('tenants').update({ enabled_modules }).eq('id', tenant.id).select('id, enabled_modules');
    if (error || !data?.length) {
      toast({ title: 'Module update failed', description: error?.message || 'The module setting did not apply.', variant: 'destructive' });
      return;
    }
    setTenants(current => current.map(item => item.id === tenant.id ? { ...item, enabled_modules } : item));
  };

  const applyTenantStatus = async (
    tenant: TenantRecord,
    payload: Record<string, unknown>,
    success: { title: string; description: string },
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .update(payload)
        .eq('id', tenant.id)
        .select('id, status, paused_at, paused_reason, deleted_at, is_active');
      if (error || !data?.length) {
        toast({ title: 'Status update failed', description: error?.message || 'The change did not apply.', variant: 'destructive' });
        return false;
      }
      setTenants(current => current.map(item => item.id === tenant.id ? { ...item, ...data[0] } : item));
      toast({ title: success.title, description: success.description });
      return true;
    } catch (error) {
      toast({ title: 'Status update failed', description: error instanceof Error ? error.message : 'Unexpected error', variant: 'destructive' });
      return false;
    }
  };

  const pauseTenant = (tenant: TenantRecord, reason: string) =>
    applyTenantStatus(tenant, { status: 'paused', paused_at: new Date().toISOString(), paused_reason: reason.trim() || null }, {
      title: 'Client paused',
      description: `${tenant.business_name} has been paused and can no longer access the app.`,
    });

  const resumeTenant = (tenant: TenantRecord) =>
    applyTenantStatus(tenant, { status: 'active', paused_at: null, paused_reason: null }, {
      title: 'Client reactivated',
      description: `${tenant.business_name} has been reactivated and can use the app again.`,
    });

  const deleteTenant = (tenant: TenantRecord) =>
    applyTenantStatus(tenant, { status: 'deleted', deleted_at: new Date().toISOString() }, {
      title: 'Client deleted',
      description: `${tenant.business_name} has been marked as deleted and can no longer access the app.`,
    });

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
          enabled_modules: form.enabledModules,
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
              <div className="space-y-2 md:col-span-2 lg:col-span-3"><Label>Enabled modules</Label><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(moduleLabels).map(([key, label]) => <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.enabledModules[key as keyof typeof moduleLabels]} onChange={(event) => setForm(current => ({ ...current, enabledModules: { ...current.enabledModules, [key]: event.target.checked } }))} />{label}</label>)}</div></div>
              <div className="flex items-end"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Client'}</Button></div>
            </form>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as TenantStatusFilter)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="paused">Paused</TabsTrigger>
              <TabsTrigger value="deleted">Deleted</TabsTrigger>
            </TabsList>
          </Tabs>
          <h2 className="text-xl font-semibold">All Clients</h2>
          {isLoading ? <p className="text-muted-foreground">Loading clients...</p> : filteredTenants.length === 0 ? <p className="text-muted-foreground">{statusFilter === 'all' ? 'No clients found.' : `No ${statusFilter} clients found.`}</p> : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTenants.map((tenant) => (
                <TenantCard key={tenant.id} tenant={tenant} onToggleModule={toggleTenantModule} onPause={pauseTenant} onResume={resumeTenant} onDelete={deleteTenant} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default PlatformAdminPage;
