import { FormEvent, useState } from 'react';
import { Bell, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useCompanyInfo, setCompanyInfo } from '@/lib/branding';
import { toast } from '@/hooks/use-toast';

const SystemPreferencesSettings = () => {
  const companyInfo = useCompanyInfo();

  // System-wide preferences. Currency / tax rate / low-stock threshold have no
  // persistence layer yet — they are held locally and confirmed via toast.
  const [currency, setCurrency] = useState('USD');
  const [taxRate, setTaxRate] = useState('18');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [quotationValidityDays, setQuotationValidityDays] = useState(String(companyInfo.quotationValidityDays));
  const [quotationTerms, setQuotationTerms] = useState(companyInfo.quotationTerms);

  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [newOrderNotifications, setNewOrderNotifications] = useState(true);
  const [quotationReminders, setQuotationReminders] = useState(true);

  const handleSaveSystemSettings = (event: FormEvent) => {
    event.preventDefault();
    setCompanyInfo({
      quotationValidityDays: Number(quotationValidityDays) || 15,
      quotationTerms,
    });
    toast({
      title: 'System settings saved',
      description: `Currency: ${currency || 'USD'} · Tax rate: ${taxRate || 0}% · Low stock threshold: ${lowStockThreshold || 0}`,
    });
  };

  const handleSaveNotifications = (event: FormEvent) => {
    event.preventDefault();
    toast({ title: 'Notification preferences saved', description: 'Your notification toggles have been updated.' });
  };

  return (
    <div className="space-y-6">
      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Settings
          </CardTitle>
          <CardDescription>
            Configure system-wide business preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSystemSettings} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="USD"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quotationValidity">Quotation Validity (days)</Label>
                <Input
                  id="quotationValidity"
                  type="number"
                  min="1"
                  value={quotationValidityDays}
                  onChange={(e) => setQuotationValidityDays(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="quotationTerms">Default Quotation Terms & Conditions</Label>
                <Textarea
                  id="quotationTerms"
                  rows={5}
                  value={quotationTerms}
                  onChange={(e) => setQuotationTerms(e.target.value)}
                  placeholder="Use {validity_days} where the validity period should appear."
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit">Save System Settings</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Choose which alerts you want to receive.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveNotifications} className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="lowStockAlerts">Low Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified when products are running low</p>
                </div>
                <Switch
                  id="lowStockAlerts"
                  checked={lowStockAlerts}
                  onCheckedChange={setLowStockAlerts}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="newOrderNotifications">New Order Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive alerts for new sales</p>
                </div>
                <Switch
                  id="newOrderNotifications"
                  checked={newOrderNotifications}
                  onCheckedChange={setNewOrderNotifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="quotationReminders">Expiry Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get reminded before quotations expire</p>
                </div>
                <Switch
                  id="quotationReminders"
                  checked={quotationReminders}
                  onCheckedChange={setQuotationReminders}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit">Save Notification Preferences</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export { SystemPreferencesSettings };