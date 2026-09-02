import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, ArrowLeft, Loader2, Printer } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { InvoiceReceipt } from '@/components/billing/InvoiceReceipt';

const BillingInvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { invoices, isLoading, error, recordInvoicePayment } = useData();
  const { user } = useAuth();
  const autoPrint = searchParams.get('autoprint') === '1';
  const returnTo = searchParams.get('returnTo') || '/billing';
  const hasAutoPrinted = useRef(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  const invoice = invoices.find(item => item.id === id);
  const isLoadingInvoice = isLoading || (!invoice && invoices.length === 0 && !error);
  const notFound = !isLoadingInvoice && !error && !invoice;

  const handleRecordPayment = async () => {
    if (!invoice || !user) return;
    const amount = Number(paymentAmount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    const payment = await recordInvoicePayment(invoice.id, amount, user.id);
    if (payment) {
      setPaymentAmount('');
      setShowPaymentDialog(false);
    }
  };

  useEffect(() => {
    if (!autoPrint || !invoice || hasAutoPrinted.current) return;

    hasAutoPrinted.current = true;
    const handleAfterPrint = () => {
      navigate(returnTo, { replace: true });
    };

    window.addEventListener('afterprint', handleAfterPrint);
    const timer = window.setTimeout(() => window.print(), 150);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [autoPrint, invoice, navigate, returnTo]);

  return (
    <AppLayout className="billing-invoice-detail-shell">
      <style>{`
        @media print {
          .billing-invoice-detail-shell aside,
          .billing-invoice-detail-shell .no-print {
            display: none !important;
          }

          .billing-invoice-detail-shell main {
            overflow: visible !important;
          }

          .billing-invoice-detail-shell main > div {
            padding: 0 !important;
          }

          body {
            background: #ffffff !important;
          }
        }
      `}</style>

      <PageHeader
        title={invoice ? invoice.invoiceNumber : 'Invoice Details'}
        description={invoice ? `Invoice for ${invoice.clientName}` : 'View invoice details and print the receipt'}
        actions={
          <div className="no-print flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/billing')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Billing
            </Button>
            {invoice && (
              <>
                {invoice.amountDue > 0 && (
                  <Button variant="outline" onClick={() => {
                    setPaymentAmount(String(Math.min(invoice.amountDue, invoice.grandTotal)));
                    setShowPaymentDialog(true);
                  }}>
                    Record Payment
                  </Button>
                )}
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Receipt
                </Button>
              </>
            )}
          </div>
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load invoice data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoadingInvoice ? (
        <Card>
          <CardContent className="flex min-h-[24rem] items-center justify-center">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading invoice...
            </div>
          </CardContent>
        </Card>
      ) : notFound ? (
        <Card>
          <CardContent className="flex min-h-[24rem] flex-col items-center justify-center gap-4 text-center">
            <div>
              <h2 className="text-xl font-semibold">Invoice not found</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The invoice may have been removed or the link is invalid.
              </p>
            </div>
            <Button onClick={() => navigate('/billing')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Billing
            </Button>
          </CardContent>
        </Card>
      ) : invoice ? (
        <div className="space-y-6">
          <Card className="no-print">
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Invoice #{invoice.invoiceNumber}</p>
                <p className="text-lg font-semibold text-foreground">{invoice.clientName}</p>
                <p className="text-sm text-muted-foreground">{invoice.clientEmail || 'No email provided'}{invoice.clientPhone ? ` · ${invoice.clientPhone}` : ''}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Receipt
                </Button>
              </div>
            </CardContent>
          </Card>

          <InvoiceReceipt invoice={invoice} />

          {invoice.amountDue > 0 && (
            <Card className="no-print">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Outstanding balance</p>
                    <p className="text-2xl font-bold text-primary">NPR {invoice.amountDue.toLocaleString()}</p>
                  </div>
                  <Button onClick={() => {
                    setPaymentAmount(String(Math.min(invoice.amountDue, invoice.grandTotal)));
                    setShowPaymentDialog(true);
                  }}>
                    Record Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record additional payment</DialogTitle>
            <DialogDescription>
              Apply a payment to this invoice. The balance will update automatically and the status will switch to paid once the total is settled.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="payment-amount">Payment amount</Label>
            <Input
              id="payment-amount"
              type="number"
              min={0.01}
              max={invoice?.amountDue ?? 0}
              step="0.01"
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={!invoice || !user || !Number(paymentAmount) || Number(paymentAmount) <= 0}>
              Save payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default BillingInvoiceDetailPage;
