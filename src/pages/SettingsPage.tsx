import { useEffect, useState } from 'react';
import { Building2, Database, Shield, User } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ProfileDetails } from '@/components/settings/ProfileDetails';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { CompanyProfileSettings } from '@/components/settings/CompanyProfileSettings';
import { SystemPreferencesSettings } from '@/components/settings/SystemPreferencesSettings';
import { DatabaseSettings } from '@/components/settings/DatabaseSettings';

const SETTINGS_TABS = [
  { value: 'profile', label: 'Profile & Security', icon: User },
  { value: 'company', label: 'Company Profile', icon: Building2 },
  { value: 'system', label: 'System & Preferences', icon: Shield },
  { value: 'database', label: 'Database & Infrastructure', icon: Database },
] as const;

type SettingsTabValue = (typeof SETTINGS_TABS)[number]['value'];

const getInitialTab = (): SettingsTabValue => {
  const hashTab = window.location.hash.replace('#', '');
  return SETTINGS_TABS.some(tab => tab.value === hashTab) ? (hashTab as SettingsTabValue) : 'profile';
};

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<SettingsTabValue>(getInitialTab);

  // Persist the active tab in the URL hash so a refresh restores it.
  useEffect(() => {
    window.history.replaceState(null, '', `#${activeTab}`);
  }, [activeTab]);

  return (
    <AppLayout>
      <PageHeader
        title="Settings"
        description="Manage your account, company profile, system preferences, and infrastructure."
      />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SettingsTabValue)} className="space-y-6">
        <TabsList className="w-full h-auto flex-wrap justify-start gap-1">
          {SETTINGS_TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="flex-1 min-w-[200px]">
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile" className="mt-0 space-y-6">
          <ProfileDetails />
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="company" className="mt-0">
          <CompanyProfileSettings />
        </TabsContent>

        <TabsContent value="system" className="mt-0">
          <SystemPreferencesSettings />
        </TabsContent>

        <TabsContent value="database" className="mt-0">
          <DatabaseSettings />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default SettingsPage;
