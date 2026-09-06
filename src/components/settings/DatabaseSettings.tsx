import { useEffect, useState } from 'react';
import { AlertTriangle, Database, Info, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase, supabaseConfigurationError } from '@/lib/supabase';
import { useData } from '@/contexts/DataContext';
import { CreditReminderDevSeed } from '@/components/credits/CreditReminderDevSeed';

type ConnectionStatus = 'checking' | 'not-configured' | 'connected' | 'unreachable';

const CONNECTION_BADGES: Record<ConnectionStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  checking: { label: 'Checking…', variant: 'secondary' },
  'not-configured': { label: 'Not configured', variant: 'destructive' },
  connected: { label: 'Connected', variant: 'default' },
  unreachable: { label: 'Unreachable', variant: 'destructive' },
};

const DatabaseSettings = () => {
  const { error: dataError } = useData();
  const [status, setStatus] = useState<ConnectionStatus>(() =>
    supabaseConfigurationError ? 'not-configured' : 'checking'
  );

  const checkConnection = async () => {
    if (supabaseConfigurationError) {
      setStatus('not-configured');
      return;
    }

    setStatus('checking');
    try {
      // Any PostgREST response (even an RLS error) proves the Supabase backend
      // is reachable; only a network-level failure marks it unreachable.
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error && /failed to fetch|network|fetch/i.test(`${error.message} ${error.code ?? ''}`)) {
        setStatus('unreachable');
      } else {
        setStatus('connected');
      }
    } catch {
      setStatus('unreachable');
    }
  };

  useEffect(() => {
    void checkConnection();
  }, []);

  const badge = CONNECTION_BADGES[status];

  return (
    <div className="space-y-6">
      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database & Infrastructure
        </CardTitle>
        <CardDescription>
          Connection status, migration warnings, and data source information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection status */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">Database Connection Status</p>
            <p className="text-sm text-muted-foreground">
              {status === 'connected' && 'The Supabase backend is reachable and responding.'}
              {status === 'checking' && 'Verifying the connection to the Supabase backend…'}
              {status === 'not-configured' && 'Supabase credentials are missing from the environment.'}
              {status === 'unreachable' && 'The Supabase backend could not be reached. Check your environment and network.'}
            </p>
          </div>
          <Badge variant={badge.variant} className="shrink-0">
            {badge.label}
          </Badge>
        </div>

        {dataError && (
          <div className="flex items-start gap-2 p-3 text-sm text-amber-600 bg-amber-500/10 rounded-lg">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{dataError}</span>
          </div>
        )}

        <Separator />

        {/* Migration warnings */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium">Migration Status</p>
            <p className="text-sm text-muted-foreground">
              Database schema is driven by SQL migrations under the <code className="rounded bg-muted px-1 py-0.5">supabase/</code> folder. Run{' '}
              <code className="rounded bg-muted px-1 py-0.5">supabase db push</code> after cloning to keep the remote schema in sync.
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">Not verified</Badge>
        </div>

        <Separator />

        {/* Mock data banner */}
        <div className="flex items-start gap-2 p-3 text-sm text-muted-foreground bg-muted/50 rounded-lg">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            All data models are designed and ready for database integration. Company branding is stored in-memory and resets on
            refresh until a <code className="rounded bg-muted px-1 py-0.5">company_settings</code> persistence layer is connected.
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => void checkConnection()} disabled={status === 'checking'}>
            <RefreshCw className={`h-4 w-4 ${status === 'checking' ? 'animate-spin' : ''}`} />
            Recheck Connection
          </Button>
        </div>
      </CardContent>
    </Card>

      {import.meta.env.DEV && <CreditReminderDevSeed />}
    </div>
  );
};

export { DatabaseSettings };