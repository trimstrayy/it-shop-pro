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

const SettingsPage = () => {
  const { user } = useAuth();

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
                <Input id="companyName" defaultValue="IT Shop Solutions" />
              </div>
              <div>
                <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                <Input id="taxId" defaultValue="TAX-123456789" />
              </div>
              <div>
                <Label htmlFor="email">Business Email</Label>
                <Input id="email" type="email" defaultValue="contact@itshop.com" />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" defaultValue="+1 555-0100" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" defaultValue="123 Tech Street, Suite 100, Silicon Valley, CA 94000" />
              </div>
            </div>
            <Button>Save Company Info</Button>
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
