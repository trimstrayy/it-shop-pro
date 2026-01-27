import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { ArrowLeft, Printer, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useRef } from 'react';

// Company Information
const COMPANY_INFO = {
  name: 'IT Gadget Hub',
  address: 'Banepa',
  zipCode: '45210',
  phone: '9741740000',
  email: 'ayush11dahal@gmail.com',
};

const QuotationPreviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { quotations, updateQuotation } = useData();
  const previewRef = useRef<HTMLDivElement>(null);

  const quotation = quotations.find(q => q.id === id);

  if (!quotation) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Quotation Not Found</h2>
            <Button onClick={() => navigate('/quotations')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Quotations
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const handlePrint = () => {
    const printContent = previewRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Quotation ${quotation.quotationNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1a1a1a; }
            .quotation-preview { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .company-logo { width: 60px; height: 60px; background: #0f766e; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
            .title { color: #0f766e; font-size: 24px; font-weight: bold; text-align: right; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
            .info-section h4 { color: #0f766e; font-size: 12px; margin-bottom: 8px; text-transform: uppercase; }
            .info-section p { margin: 4px 0; font-size: 14px; }
            .quote-number { background: #f0fdfa; padding: 15px; margin-bottom: 30px; border-left: 4px solid #0f766e; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #0f766e; color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
            td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
            .totals { margin-left: auto; width: 300px; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .totals-row.grand { background: #0f766e; color: white; padding: 12px; font-weight: bold; }
            .notes { background: #f9fafb; padding: 20px; margin-top: 30px; }
            .notes h4 { margin-bottom: 10px; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; }
            .signature-line { border-top: 1px solid #000; width: 200px; padding-top: 5px; text-align: center; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleStatusUpdate = (status: 'sent' | 'accepted' | 'rejected') => {
    updateQuotation(quotation.id, { status });
  };

  return (
    <AppLayout>
      <PageHeader 
        title={`Quotation ${quotation.quotationNumber}`}
        description={`For ${quotation.clientName}`}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            {quotation.status === 'draft' && (
              <Button variant="outline" onClick={() => handleStatusUpdate('sent')}>
                Mark as Sent
              </Button>
            )}
            {quotation.status === 'sent' && (
              <>
                <Button variant="outline" onClick={() => handleStatusUpdate('accepted')}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept
                </Button>
                <Button variant="outline" onClick={() => handleStatusUpdate('rejected')}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
            {(quotation.status === 'sent' || quotation.status === 'accepted') && (
              <Button asChild>
                <Link to={`/billing?quotation=${quotation.id}`}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Convert to Invoice
                </Link>
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/quotations')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Status Info */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Quotation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <StatusBadge status={quotation.status} variant={getStatusVariant(quotation.status)} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{format(new Date(quotation.createdAt), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valid Until</p>
              <p className="font-medium">{format(new Date(quotation.validUntil), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="font-medium">{quotation.items.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Grand Total</p>
              <p className="text-xl font-bold text-primary">NPR {quotation.grandTotal.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Quotation Preview */}
        <Card className="xl:col-span-3">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg">Quotation Document</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div 
              ref={previewRef}
              className="quotation-preview bg-white text-slate-900 p-8"
              style={{ fontSize: '14px' }}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-teal-700 rounded flex items-center justify-center text-white font-bold text-lg">
                    ITG
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-teal-700">{COMPANY_INFO.name}</h2>
                    <p className="text-gray-600 text-sm">Your IT Solutions Partner</p>
                  </div>
                </div>
                <div className="text-right">
                  <h1 className="text-2xl font-bold text-teal-700">SALES QUOTATION</h1>
                  <p className="text-gray-500 text-sm mt-1">Professional Quote</p>
                </div>
              </div>

              {/* From / To Section */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-xs font-semibold text-teal-700 uppercase mb-2 tracking-wider">From</h4>
                  <div className="text-sm space-y-1">
                    <p className="font-semibold">{COMPANY_INFO.name}</p>
                    <p>{COMPANY_INFO.address}</p>
                    <p>ZIP: {COMPANY_INFO.zipCode}</p>
                    <p>Phone: {COMPANY_INFO.phone}</p>
                    <p>Email: {COMPANY_INFO.email}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-teal-700 uppercase mb-2 tracking-wider">To</h4>
                  <div className="text-sm space-y-1">
                    <p className="font-semibold">{quotation.clientName}</p>
                    <p>{quotation.clientAddress}</p>
                    <p>Phone: {quotation.clientPhone}</p>
                    <p>Email: {quotation.clientEmail}</p>
                  </div>
                </div>
              </div>

              {/* Quote Number & Date */}
              <div className="bg-teal-50 border-l-4 border-teal-700 p-4 mb-6">
                <div className="flex justify-between">
                  <div>
                    <span className="text-xs text-gray-500 uppercase">Quote Number</span>
                    <p className="font-bold text-teal-700">{quotation.quotationNumber}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-gray-500 uppercase">Date</span>
                    <p className="font-medium">{format(new Date(quotation.createdAt), 'MMM dd, yyyy')}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 uppercase">Valid Until</span>
                    <p className="font-medium">{format(new Date(quotation.validUntil), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full mb-6">
                <thead>
                  <tr className="bg-teal-700 text-white">
                    <th className="py-3 px-4 text-left text-xs uppercase tracking-wider">S.N.</th>
                    <th className="py-3 px-4 text-left text-xs uppercase tracking-wider">Product Description</th>
                    <th className="py-3 px-4 text-center text-xs uppercase tracking-wider w-16">Qty</th>
                    <th className="py-3 px-4 text-right text-xs uppercase tracking-wider w-28">Unit Price</th>
                    <th className="py-3 px-4 text-right text-xs uppercase tracking-wider w-28">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-3 px-4">{index + 1}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-xs text-gray-500">{item.productCode}</p>
                      </td>
                      <td className="py-3 px-4 text-center">{item.quantity}</td>
                      <td className="py-3 px-4 text-right">NPR {item.unitPrice.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-medium">NPR {item.lineTotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-72">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Subtotal</span>
                    <span>NPR {quotation.subtotal.toLocaleString()}</span>
                  </div>
                  {quotation.totalDiscount > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Discount</span>
                      <span className="text-red-600">- NPR {quotation.totalDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Tax (VAT 13%)</span>
                    <span>NPR {quotation.totalTax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-3 bg-teal-700 text-white px-4 mt-2 font-bold">
                    <span>GRAND TOTAL</span>
                    <span>NPR {quotation.grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Terms */}
              {quotation.notes && (
                <div className="bg-gray-50 p-4 rounded mb-8">
                  <h4 className="font-semibold text-gray-700 mb-2">Terms & Conditions</h4>
                  <div className="text-sm text-gray-600 whitespace-pre-line">{quotation.notes}</div>
                </div>
              )}

              {/* Footer / Signatures */}
              <div className="flex justify-between mt-12 pt-8">
                <div className="text-center">
                  <div className="w-48 border-t border-gray-400 pt-2">
                    <p className="text-sm text-gray-600">Authorized By</p>
                    <p className="text-xs text-gray-400 mt-1">{COMPANY_INFO.name}</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-48 border-t border-gray-400 pt-2">
                    <p className="text-sm text-gray-600">Accepted By</p>
                    <p className="text-xs text-gray-400 mt-1">{quotation.clientName}</p>
                  </div>
                </div>
              </div>

              <div className="text-center mt-8 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-400">
                  © {new Date().getFullYear()} {COMPANY_INFO.name}. Thank you for your business!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default QuotationPreviewPage;
