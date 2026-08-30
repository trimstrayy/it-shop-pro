import { useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Loader2, Printer } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { InvoiceReceipt } from '@/components/billing/InvoiceReceipt';

const BillingInvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { invoices, isLoading, error } = useData();
  const autoPrint = searchParams.get('autoprint') === '1';
  const returnTo = searchParams.get('returnTo') || '/billing';
  const hasAutoPrinted = useRef(false);

  const invoice = invoices.find(item => item.id === id);
  const isLoadingInvoice = isLoading || (!invoice && invoices.length === 0 && !error);
  const notFound = !isLoadingInvoice && !error && !invoice;

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
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
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
        </div>
      ) : null}
    </AppLayout>
  );
};

export default BillingInvoiceDetailPage;
