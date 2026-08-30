import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Building2, User, Bell, Shield, Database } from 'lucide-react';
import { useCompanyInfo, setCompanyInfo } from '@/lib/branding';
import { toast } from '@/hooks/use-toast';

const SettingsPage = () => {
  const { user } = useAuth();
  const companyInfo = useCompanyInfo();

  // Local form state seeded from the single source of truth (branding.ts) so
  // the form shows whatever the receipts actually render, not stale defaults.
  const [companyForm, setCompanyForm] = useState({
    name: companyInfo.name,
    tagline: companyInfo.tagline,
    address: companyInfo.address,
    phone: companyInfo.phone,
    email: companyInfo.email,
    panNumber: companyInfo.panNumber,
  });

  const handleCompanyFieldChange = (field: keyof typeof companyForm, value: string) => {
    setCompanyForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveCompanyInfo = () => {
    setCompanyInfo({
      name: companyForm.name,
      tagline: companyForm.tagline,
      address: companyForm.address,
      phone: companyForm.phone,
      email: companyForm.email,
      panNumber: companyForm.panNumber,
    });
    toast({
      title: 'Company Info Saved',
      description: 'Company details updated for receipts and printouts (in-memory only — resets on refresh until Supabase persistence is wired up).',
    });
  };

  return (
    <AppLayout>
      <PageHeader 
        title="Settings"
        description="Manage your system preferences and configuration"
      />

      <div className="max-w-4xl space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Company Information
            </CardTitle>
            <CardDescription>
              Update your company details that appear on quotations and invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={companyForm.name}
                  onChange={(e) => handleCompanyFieldChange('name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={companyForm.tagline}
                  onChange={(e) => handleCompanyFieldChange('tagline', e.target.value)}
                  placeholder="Short tagline shown under the company name"
                />
              </div>
              <div>
                <Label htmlFor="panNumber">PAN Number (Tax / VAT)</Label>
                <Input
                  id="panNumber"
                  value={companyForm.panNumber}
                  onChange={(e) => handleCompanyFieldChange('panNumber', e.target.value)}
                  placeholder="XXXXXX"
                />
              </div>
              <div>
                <Label htmlFor="email">Business Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={companyForm.email}
                  onChange={(e) => handleCompanyFieldChange('email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={companyForm.phone}
                  onChange={(e) => handleCompanyFieldChange('phone', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={companyForm.address}
                  onChange={(e) => handleCompanyFieldChange('address', e.target.value)}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Saved in-memory only — changes appear on the next receipt/print instantly, but reset on refresh until persistence is connected.
            </p>
            <Button onClick={handleSaveCompanyInfo}>Save Company Info</Button>
          </CardContent>
        </Card>

        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              User Profile
            </CardTitle>
            <CardDescription>
              Your personal account settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="userName">Full Name</Label>
                <Input id="userName" defaultValue={user?.name} />
              </div>
              <div>
                <Label htmlFor="userEmail">Email</Label>
                <Input id="userEmail" type="email" defaultValue={user?.email} disabled />
              </div>
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" placeholder="Enter current password" />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" placeholder="Enter new password" />
              </div>
            </div>
            <Button>Update Profile</Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when products are running low</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>New Order Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive alerts for new sales</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Quotation Expiry Reminders</Label>
                <p className="text-sm text-muted-foreground">Get reminded before quotations expire</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              System Settings
            </CardTitle>
            <CardDescription>
              Configure system-wide preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" defaultValue="USD" />
              </div>
              <div>
                <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                <Input id="taxRate" type="number" defaultValue="18" />
              </div>
              <div>
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input id="lowStockThreshold" type="number" defaultValue="5" />
              </div>
              <div>
                <Label htmlFor="quotationValidity">Quotation Validity (days)</Label>
                <Input id="quotationValidity" type="number" defaultValue="15" />
              </div>
            </div>
            <Button>Save System Settings</Button>
          </CardContent>
        </Card>

        {/* Database Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Information
            </CardTitle>
            <CardDescription>
              Current system is using mock data. Connect to a real database for production use.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Status:</strong> Using local mock data
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Note:</strong> All data models are designed and ready for database integration. 
                Connect to Supabase or another backend to enable persistent storage.
              </p>
            </div>
            <Button variant="outline" className="mt-4" disabled>
              Connect Database (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
