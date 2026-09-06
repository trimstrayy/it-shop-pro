import { useState } from 'react';
import { FlaskConical, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import {
  DUMMY_OVERDUE_CREDIT,
  OVERDUE_SEED_INVOICE_NUMBER,
  formatNpr,
  removeSeededOverdueCredit,
  seedDummyOverdueCredit,
  triggerCreditReminderDevCheck,
  triggerCreditReminderDevLocal,
} from '@/lib/creditReminders';

/**
 * Temporary developer tool (dev builds only). Injects the dummy overdue credit
 * into the database or local state, then immediately re-opens the overdue
 * credit reminder popup so it can be tested without logging out/in.
 *
 * Rendered in Settings -> Database & Infrastructure and stripped from
 * production builds via `import.meta.env.DEV`.
 */
const CreditReminderDevSeed = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  if (!import.meta.env.DEV) return null;

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const { dbInserted, credit } = await seedDummyOverdueCredit();

      if (dbInserted) {
        toast({
          title: 'Dummy overdue credit seeded',
          description: `${OVERDUE_SEED_INVOICE_NUMBER} created (dated 8 days ago). Opening the reminder popup…`,
        });
        // Re-run the same database query the login flow uses, so the popup is
        // tested end-to-end through the real get_overdue_credits endpoint.
        triggerCreditReminderDevCheck();
      } else {
        toast({
          title: 'Dummy overdue credit injected (local state)',
          description: 'Database insert was unavailable, so the popup is showing in-memory data for testing.',
        });
        triggerCreditReminderDevLocal([credit]);
      }
    } finally {
      setIsSeeding(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      const removed = await removeSeededOverdueCredit();
      if (removed) {
        toast({ title: 'Seeded credit removed', description: `${OVERDUE_SEED_INVOICE_NUMBER} was deleted from the database.` });
      } else {
        toast({ title: 'Cleanup failed', description: 'The seeded invoice could not be removed.', variant: 'destructive' });
      }
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5" />
          Developer Seed Tools
          <Badge variant="outline" className="ml-auto">Dev only</Badge>
        </CardTitle>
        <CardDescription>
          Injects a dummy overdue credit so the login reminder popup can be tested without waiting for
          real 7-day-old credit sales. Seed: {DUMMY_OVERDUE_CREDIT.clientName} ·{' '}
          NPR {formatNpr(DUMMY_OVERDUE_CREDIT.amountDue)} · dated 8 days ago.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => void handleSeed()}
            disabled={isSeeding || isRemoving}
          >
            {isSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
            {isSeeding ? 'Seeding…' : 'Seed Dummy Overdue Credit'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleRemove()}
            disabled={isSeeding || isRemoving}
          >
            {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Remove Seeded Credit
          </Button>
        </div>
        <Separator />
        <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
          <li>
            The reminder popup normally fires once per login. For a full login-flow test, seed the data,
            then log out and log back in — the reminder gate evaluates on login.
          </li>
          <li>
            These buttons bypass the once-per-session flag so the popup can be re-opened immediately
            while you stay logged in. The seed is idempotent — clicking again replaces the row.
          </li>
          <li>
            The database path requires the <code className="rounded bg-muted px-1">credit_payment_status</code>{' '}
            migration to be applied (uses the <code className="rounded bg-muted px-1">get_overdue_credits</code> RPC).
            Otherwise the popup falls back to in-memory data.
          </li>
        </ul>
      </CardContent>
    </Card>
  );
};

export { CreditReminderDevSeed };