import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { DataTable } from '@/components/ui/data-table';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Invoice } from '@/types';
import { format } from 'date-fns';
import { BellRing, CircleDollarSign, TrendingDown } from 'lucide-react';

const formatCurrency = (value: number) => `NPR ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const CreditsPage = () => {
  const { invoices, customers, recordInvoicePayment } = useData();
  const { user } = useAuth();
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.amountDue > 0 && invoice.status !== 'cancelled').sort((a, b) => b.amountDue - a.amountDue),
    [invoices],
  );

  const customerSummaries = useMemo(() => {
    const summaryMap = new Map<string, {
      customerId: string;
      customerName: string;
      customerPhone: string;
      totalOutstanding: number;
      openInvoices: Invoice[];
      oldestInvoiceDate: Date | null;
    }>();

    openInvoices.forEach((invoice) => {
      const key = invoice.customerId || invoice.clientPhone || invoice.clientName;
      const customer = customers.find((entry) => entry.id === invoice.customerId) ?? null;
      const name = customer?.name || invoice.clientName;
      const phone = customer?.phone || invoice.clientPhone;
      const existing = summaryMap.get(key);

      if (existing) {
        existing.totalOutstanding += invoice.amountDue;
        existing.openInvoices.push(invoice);
        if (!existing.oldestInvoiceDate || new Date(invoice.createdAt) < existing.oldestInvoiceDate) {
          existing.oldestInvoiceDate = new Date(invoice.createdAt);
        }
        return;
      }

      summaryMap.set(key, {
        customerId: invoice.customerId || key,
        customerName: name,
        customerPhone: phone,
        totalOutstanding: invoice.amountDue,
        openInvoices: [invoice],
        oldestInvoiceDate: new Date(invoice.createdAt),
      });
    });

    return [...summaryMap.values()].sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  }, [customers, openInvoices]);

  const totalOutstanding = customerSummaries.reduce((sum, item) => sum + item.totalOutstanding, 0);

  const visibleCustomers = customerFilter === 'all'
    ? customerSummaries
    : customerSummaries.filter((customer) => customer.customerId === customerFilter);

  const sendReminder = async (invoice: Invoice) => {
    if (!invoice.clientPhone) {
      toast({ title: 'No phone number', description: 'This customer has no phone number for SMS reminders.', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.functions.invoke('send-sms', {
      body: {
        invoiceId: invoice.id,
        recipient: invoice.clientPhone,
        message: `Reminder: NPR ${invoice.amountDue.toFixed(2)} remains outstanding on invoice ${invoice.invoiceNumber}. - ${import.meta.env.VITE_APP_NAME || 'IT Gadget'}`,
      },
    });
    toast(error
      ? { title: 'SMS failed', description: error.message, variant: 'destructive' }
      : { title: 'Reminder sent', description: `SMS sent to ${invoice.clientPhone}.` });
  };

  const savePayment = async () => {
    if (!paymentInvoice || !user) return;
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > paymentInvoice.amountDue) return;
    setIsSubmitting(true);
    const payment = await recordInvoicePayment(paymentInvoice.id, amount, user.id);
    setIsSubmitting(false);
    if (payment) {
      setPaymentInvoice(null);
      setPaymentAmount('');
      toast({ title: 'Payment recorded', description: `NPR ${payment.amount.toFixed(2)} applied to ${paymentInvoice.invoiceNumber}.` });
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Credits"
        description="Track outstanding balances, partial payments, and customer follow-ups."
      />

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total outstanding</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(totalOutstanding)}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
              <CircleDollarSign className="h-4 w-4 text-primary" />
              Across all credit invoices
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Open credit accounts</CardDescription>
              <CardTitle className="text-2xl">{customerSummaries.length}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingDown className="h-4 w-4 text-warning" />
              Customers with outstanding dues
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Open invoices</CardDescription>
              <CardTitle className="text-2xl">{openInvoices.length}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
              <BellRing className="h-4 w-4 text-success" />
              Partial and full credit balances
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Outstanding customers</CardTitle>
                <CardDescription>Sorted by highest dues first</CardDescription>
              </div>
              <select
                value={customerFilter}
                onChange={(event) => setCustomerFilter(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">All customers</option>
                {customerSummaries.map((customer) => (
                  <option key={customer.customerId} value={customer.customerId}>{customer.customerName}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={visibleCustomers}
              searchPlaceholder="Search customer or phone"
              searchKeys={['customerName', 'customerPhone']}
              pageSize={8}
              emptyMessage="No outstanding credit accounts found."
              columns={[
                {
                  key: 'customerName',
                  header: 'Customer',
                  cell: (customer: any) => (
                    <div>
                      <p className="font-medium">{customer.customerName}</p>
                      <p className="text-xs text-muted-foreground">{customer.customerPhone}</p>
                    </div>
                  ),
                },
                {
                  key: 'totalOutstanding',
                  header: 'Outstanding',
                  cell: (customer: any) => <span className="font-semibold text-primary">{formatCurrency(customer.totalOutstanding)}</span>,
                },
                {
                  key: 'openInvoices',
                  header: 'Open invoices',
                  cell: (customer: any) => <span>{customer.openInvoices.length}</span>,
                },
                {
                  key: 'oldestInvoiceDate',
                  header: 'Oldest unpaid',
                  cell: (customer: any) => (
                    customer.oldestInvoiceDate ? format(new Date(customer.oldestInvoiceDate), 'MMM dd, yyyy') : '—'
                  ),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  cell: (customer: any) => (
                    <Button variant="outline" size="sm" onClick={() => setCustomerFilter(customer.customerId)}>
                      View Invoices
                    </Button>
                  ),
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open credit invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={openInvoices}
              searchPlaceholder="Search invoice or customer"
              searchKeys={['invoiceNumber', 'clientName', 'clientPhone']}
              pageSize={10}
              emptyMessage="No credit invoices are currently outstanding."
              columns={[
                {
                  key: 'invoiceNumber',
                  header: 'Invoice',
                  cell: (invoice: Invoice) => (
                    <div>
                      <p className="font-mono text-sm text-primary">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">{invoice.clientName}</p>
                    </div>
                  ),
                },
                {
                  key: 'grandTotal',
                  header: 'Total',
                  cell: (invoice: Invoice) => formatCurrency(invoice.grandTotal),
                },
                {
                  key: 'amountPaid',
                  header: 'Paid',
                  cell: (invoice: Invoice) => formatCurrency(invoice.amountPaid),
                },
                {
                  key: 'amountDue',
                  header: 'Due',
                  cell: (invoice: Invoice) => (
                    <span className="font-semibold text-primary">{formatCurrency(invoice.amountDue)}</span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  cell: (invoice: Invoice) => (
                    <StatusBadge status={invoice.status} variant={getStatusVariant(invoice.status)} />
                  ),
                },
                {
                  key: 'date',
                  header: 'Date',
                  cell: (invoice: Invoice) => format(new Date(invoice.createdAt), 'MMM dd, yyyy'),
                },
                {
                  key: 'payment',
                  header: 'Action',
                  cell: (invoice: Invoice) => (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => void sendReminder(invoice)}>
                        Send Reminder
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => {
                        setPaymentInvoice(invoice);
                        setPaymentAmount(String(invoice.amountDue));
                      }}>
                        Record Payment
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(paymentInvoice)} onOpenChange={(open) => !open && setPaymentInvoice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              {paymentInvoice ? `${paymentInvoice.invoiceNumber} has ${formatCurrency(paymentInvoice.amountDue)} outstanding.` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="credits-payment-amount">Amount received</Label>
            <Input
              id="credits-payment-amount"
              type="number"
              min="0.01"
              max={paymentInvoice?.amountDue ?? 0}
              step="0.01"
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentInvoice(null)}>Cancel</Button>
            <Button onClick={() => void savePayment()} disabled={isSubmitting || !paymentInvoice || Number(paymentAmount) <= 0 || Number(paymentAmount) > paymentInvoice.amountDue}>
              {isSubmitting ? 'Saving...' : 'Save payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default CreditsPage;
