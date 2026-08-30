import { format } from 'date-fns';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Invoice } from '@/types';
import { useCompanyInfo, WARRANTY_TEXT } from '@/lib/branding';

interface InvoiceReceiptProps {
  invoice: Invoice;
  className?: string;
}

const formatPaymentMode = (paymentMode: Invoice['paymentMode']) => {
  if (paymentMode === 'cash') return 'Cash';
  if (paymentMode === 'bank') return 'Bank Transfer';
  return 'Card / Online';
};

export const InvoiceReceipt = ({ invoice, className }: InvoiceReceiptProps) => {
  const companyInfo = useCompanyInfo();

  return (
    <Card className={cn('border-border bg-white shadow-sm print:shadow-none', className)}>
      <CardContent className="p-0">
        {/* Letterhead */}
        <div className="border-b border-border bg-muted/20 px-6 py-5 print:py-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
              ITG
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">{companyInfo.name}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{companyInfo.tagline}</p>
              <div className="mt-3 grid gap-x-8 gap-y-0.5 text-sm text-muted-foreground sm:grid-cols-2">
                <p>{companyInfo.address}</p>
                <p>Phone: {companyInfo.phone}</p>
                <p>Email: {companyInfo.email}</p>
                <p>PAN No: {companyInfo.panNumber}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice header */}
        <div className="px-6 pt-6 pb-2 print:pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Invoice</p>
              <h1 className="mt-1 text-2xl font-bold text-foreground">{invoice.invoiceNumber}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{formatPaymentMode(invoice.paymentMode)}</Badge>
              <Badge variant="outline" className="capitalize">{invoice.status}</Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-4 lg:grid-cols-2 print:py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Bill To</p>
            <div className="mt-2 space-y-1 text-sm">
              <p className="font-semibold text-foreground">{invoice.clientName}</p>
              {invoice.clientAddress ? <p className="text-muted-foreground">{invoice.clientAddress}</p> : null}
              {invoice.clientPhone ? <p className="text-muted-foreground">Phone: {invoice.clientPhone}</p> : null}
              {invoice.clientEmail ? <p className="text-muted-foreground">Email: {invoice.clientEmail}</p> : null}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Invoice Date</p>
              <p className="mt-2 text-sm font-medium text-foreground">{format(new Date(invoice.createdAt), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Payment Method</p>
              <p className="mt-2 text-sm font-medium text-foreground">{formatPaymentMode(invoice.paymentMode)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Status</p>
              <p className="mt-2 text-sm font-medium capitalize text-foreground">{invoice.status}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Paid At</p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {invoice.paidAt ? format(new Date(invoice.paidAt), 'MMM dd, yyyy') : 'Pending'}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium text-center">Qty</th>
                  <th className="px-4 py-3 font-medium text-right">Unit Price</th>
                  <th className="px-4 py-3 font-medium text-right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={item.id} className={cn(index !== invoice.items.length - 1 && 'border-b border-border')}>
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-foreground">{item.productName}</div>
                    </td>
                    <td className="px-4 py-3 align-top text-muted-foreground">{item.productCode}</td>
                    <td className="px-4 py-3 align-top text-center text-foreground">{item.quantity}</td>
                    <td className="px-4 py-3 align-top text-right text-foreground">NPR {item.unitPrice.toLocaleString()}</td>
                    <td className="px-4 py-3 align-top text-right font-medium text-foreground">NPR {item.lineTotal.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-sm space-y-2 rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">NPR {invoice.subtotal.toLocaleString()}</span>
              </div>
              {invoice.totalDiscount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium text-foreground">- NPR {invoice.totalDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tax (VAT 13%)</span>
                <span className="font-medium text-foreground">NPR {invoice.totalTax.toLocaleString()}</span>
              </div>
              <div className="border-t border-border pt-2 flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span>NPR {invoice.grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Warranty */}
          <div className="mt-6 print:mt-4">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Warranty: </span>
                {WARRANTY_TEXT}
              </p>
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-10 print:mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Signatures</p>
            <div className="mt-3 grid gap-8 sm:grid-cols-2">
              <div>
                <div className="border-b-2 border-slate-400" />
                <p className="mt-2 text-center text-sm font-medium text-foreground">Seller's Signature</p>
              </div>
              <div>
                <div className="border-b-2 border-slate-400" />
                <p className="mt-2 text-center text-sm font-medium text-foreground">Customer Signature</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
