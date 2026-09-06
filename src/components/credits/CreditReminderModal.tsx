import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, Package, Phone, Smartphone } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import {
  OverdueCredit,
  buildCreditReminderMessage,
  buildSmsUri,
  formatNpr,
  isMobileDevice,
  isValidPhoneNumber,
  markOverdueCreditPaid,
} from '@/lib/creditReminders';

interface CreditReminderModalProps {
  overdueCredits: OverdueCredit[];
  onDismiss: () => void;
}

const CreditReminderModal = ({ overdueCredits, onDismiss }: CreditReminderModalProps) => {
  const [credits, setCredits] = useState<OverdueCredit[]>(overdueCredits);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorByCredit, setErrorByCredit] = useState<Record<string, string>>({});
  const [showDesktopNotice, setShowDesktopNotice] = useState(false);

  const isMobile = useMemo(() => isMobileDevice(), []);

  // Re-sync if the parent refreshes the list while open.
  useEffect(() => {
    setCredits(overdueCredits);
  }, [overdueCredits]);

  const handleSendSms = (credit: OverdueCredit) => {
    setErrorByCredit(prev => ({ ...prev, [credit.id]: '' }));
    setShowDesktopNotice(false);

    const phone = credit.clientPhone?.trim() ?? '';
    if (!phone || !isValidPhoneNumber(phone)) {
      const message = `No valid phone number on file for ${credit.clientName}. Update the customer record and try again.`;
      setErrorByCredit(prev => ({ ...prev, [credit.id]: message }));
      toast({ title: 'Invalid phone number', description: message, variant: 'destructive' });
      return;
    }

    if (!isMobile) {
      setShowDesktopNotice(true);
      toast({
        title: 'SMS action unavailable on desktop',
        description: 'Please log in from a mobile device to send direct SMS reminders.',
        variant: 'destructive',
      });
      return;
    }

    // Open the device's native SMS app with the message pre-filled.
    window.location.href = buildSmsUri(phone, buildCreditReminderMessage(credit));
  };

  const handleMarkAsPaid = async (credit: OverdueCredit) => {
    setProcessingId(credit.id);
    try {
      await markOverdueCreditPaid(credit.id);
      const nextCredits = credits.filter(entry => entry.id !== credit.id);
      setCredits(nextCredits);
      toast({
        title: 'Marked as paid',
        description: `${credit.clientName} (${credit.invoiceNumber}) is no longer in the overdue reminder queue.`,
      });
      if (nextCredits.length === 0) onDismiss();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update this credit. Please try again.';
      toast({ title: 'Update failed', description: message, variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const totalDue = credits.reduce((sum, credit) => sum + credit.amountDue, 0);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onDismiss(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Overdue Credit Reminder
          </DialogTitle>
          <DialogDescription>
            {credits.length} credit{credits.length === 1 ? '' : 's'} outstanding for 7 days or more · NPR {formatNpr(totalDue)} due.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[360px] space-y-4 overflow-y-auto pr-1">
          {credits.map(credit => (
            <div key={credit.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{credit.clientName}</p>
                  <p className="font-mono text-xs text-muted-foreground">{credit.invoiceNumber}</p>
                </div>
                <Badge variant="destructive">Overdue</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  {credit.clientPhone || 'No phone on file'}
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Purchased {format(new Date(credit.createdAt), 'MMM dd, yyyy')}
                </span>
                <span className="ml-auto font-semibold text-primary">
                  NPR {formatNpr(credit.amountDue)} due
                </span>
              </div>

              {(credit.items?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-2">
                  {credit.items.slice(0, 5).map((item, index) => (
                    <span key={`${credit.id}-${index}`} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                      <Package className="h-3 w-3" />
                      {item.productName} × {item.quantity}
                    </span>
                  ))}
                  {(credit.items?.length ?? 0) > 5 && (
                    <span className="text-xs text-muted-foreground">
                      +{(credit.items?.length ?? 0) - 5} more
                    </span>
                  )}
                </div>
              )}
{errorByCredit[credit.id] && (
                <div className="flex items-start gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  {errorByCredit[credit.id]}
                </div>
              )}

              <Separator />

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  size="sm"
                  onClick={() => void handleMarkAsPaid(credit)}
                  disabled={processingId === credit.id}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {processingId === credit.id ? 'Updating...' : 'Mark as Paid'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSendSms(credit)}
                  disabled={processingId === credit.id}
                >
                  <Smartphone className="h-4 w-4" />
                  Send SMS Reminder
                </Button>
              </div>
            </div>
          ))}
        </div>

        {!isMobile && (
          <div className="flex items-start gap-2 p-3 text-sm text-amber-600 bg-amber-500/10 rounded-lg">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              SMS action unavailable on desktop. Please log in from a mobile device to send direct SMS reminders.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onDismiss}>
            Dismiss
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { CreditReminderModal };