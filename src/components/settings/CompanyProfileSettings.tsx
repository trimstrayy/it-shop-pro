import { FormEvent, useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCompanyInfo, setCompanyInfo } from '@/lib/branding';
import { toast } from '@/hooks/use-toast';

interface CompanyFormState {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  panNumber: string;
}

const CompanyProfileSettings = () => {
  const companyInfo = useCompanyInfo();
  const [form, setForm] = useState<CompanyFormState>(() => ({
    name: companyInfo.name,
    tagline: companyInfo.tagline,
    address: companyInfo.address,
    phone: companyInfo.phone,
    email: companyInfo.email,
    panNumber: companyInfo.panNumber,
  }));

  // Re-seed the form whenever the shared company info store changes,
  // so saved values are always reflected in the inputs.
  useEffect(() => {
    setForm({
      name: companyInfo.name,
      tagline: companyInfo.tagline,
      address: companyInfo.address,
      phone: companyInfo.phone,
      email: companyInfo.email,
      panNumber: companyInfo.panNumber,
    });
  }, [companyInfo]);

  const handleFieldChange = (field: keyof CompanyFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setCompanyInfo(form);
    toast({
      title: 'Company info saved',
      description: 'Company details updated for quotations, receipts, and printouts.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Company Profile
          <Badge variant="secondary" className="ml-auto">In-memory</Badge>
        </CardTitle>
        <CardDescription>
          Details shown on quotations and invoice receipts. These values live in the in-memory brand store and reset on page refresh.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={form.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Your business name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={form.tagline}
                onChange={(e) => handleFieldChange('tagline', e.target.value)}
                placeholder="Short tagline shown under the company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="panNumber">Tax / PAN ID</Label>
              <Input
                id="panNumber"
                value={form.panNumber}
                onChange={(e) => handleFieldChange('panNumber', e.target.value)}
                placeholder="XXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Business Email</Label>
              <Input
                id="companyEmail"
                type="email"
                value={form.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder="business@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Phone Number</Label>
              <Input
                id="companyPhone"
                value={form.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                placeholder="Contact phone number"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="companyAddress">Address</Label>
              <Input
                id="companyAddress"
                value={form.address}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                placeholder="Business address"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit">Save Company Info</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export { CompanyProfileSettings };