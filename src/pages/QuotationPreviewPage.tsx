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

  const buildPrintableQuotation = () => {
    const renderedItems = quotation.items.map((item, index) => `
      <tr style="${index % 2 === 0 ? 'background:#f8fafc;' : 'background:#ffffff;'}">
        <td style="padding:12px 16px;">${index + 1}</td>
        <td style="padding:12px 16px; vertical-align:top;">
          <div style="font-weight:600;">${item.productName}</div>
          <div style="font-size:11px; color:#6b7280; margin-top:2px;">${item.productCode}</div>
        </td>
        <td style="padding:12px 16px; text-align:center; width:80px;">${item.quantity}</td>
        <td style="padding:12px 16px; text-align:right; width:140px;">NPR ${item.unitPrice.toLocaleString()}</td>
        <td style="padding:12px 16px; text-align:right; width:140px; font-weight:600;">NPR ${item.lineTotal.toLocaleString()}</td>
      </tr>
    `).join('');

    return `
      <html>
        <head>
          <title>Quotation ${quotation.quotationNumber}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              font-family: Arial, sans-serif;
              background: #ffffff;
              color: #0f172a;
              padding: 24px;
            }
            .quotation-preview {
              max-width: 820px;
              margin: 0 auto;
              background: #ffffff;
              color: #0f172a;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 32px;
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 16px;
            }
            .brand-mark {
              width: 64px;
              height: 64px;
              border-radius: 10px;
              background: #0f766e;
              color: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: 20px;
            }
            .brand-name {
              margin: 0;
              font-size: 22px;
              line-height: 1.2;
              font-weight: 700;
              color: #0f766e;
            }
            .brand-tagline {
              margin: 4px 0 0;
              font-size: 13px;
              color: #6b7280;
            }
            .title-block {
              text-align: right;
            }
            .title-block h1 {
              margin: 0;
              font-size: 32px;
              line-height: 1.1;
              font-weight: 700;
              color: #0f766e;
              letter-spacing: 0.02em;
            }
            .title-block p {
              margin: 6px 0 0;
              font-size: 13px;
              color: #6b7280;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 32px;
              margin-bottom: 32px;
            }
            .info-section h4 {
              margin: 0 0 10px;
              font-size: 12px;
              color: #0f766e;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.12em;
            }
            .info-section .details {
              font-size: 14px;
              line-height: 1.6;
              color: #1f2937;
            }
            .info-section .details p {
              margin: 0;
            }
            .meta-bar {
              background: #f0fdfa;
              border-left: 4px solid #0f766e;
              padding: 16px 20px;
              margin-bottom: 24px;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 16px;
            }
            .meta-label {
              display: block;
              font-size: 11px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.12em;
              margin-bottom: 4px;
            }
            .meta-value {
              font-size: 15px;
              font-weight: 700;
              color: #0f766e;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 32px;
              border: 1px solid #e5e7eb;
            }
            thead th {
              background: #0f766e;
              color: #ffffff;
              padding: 12px 16px;
              text-align: left;
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.08em;
            }
            thead th:last-child,
            td:last-child { text-align: right; }
            tbody td {
              padding: 12px 16px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 14px;
              color: #1f2937;
              vertical-align: top;
            }
            .totals-wrap {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 32px;
            }
            .totals {
              width: 300px;
            }
            .totals-row {
              display: flex;
              justify-content: space-between;
              border-bottom: 1px solid #e5e7eb;
              padding: 8px 0;
              font-size: 14px;
            }
            .totals-row.grand {
              background: #0f766e;
              color: #ffffff;
              padding: 12px 16px;
              margin-top: 10px;
              font-weight: 700;
            }
            .notes {
              background: #f9fafb;
              padding: 16px 18px;
              margin-bottom: 24px;
            }
            .notes h4 {
              margin: 0 0 10px;
              font-size: 14px;
              color: #374151;
            }
            .notes p {
              margin: 0;
              white-space: pre-line;
              font-size: 13px;
              color: #4b5563;
            }
            .footer {
              display: flex;
              justify-content: space-between;
              margin-top: 32px;
              padding-top: 18px;
              border-top: 1px solid #e5e7eb;
            }
            .signature {
              text-align: center;
              width: 190px;
            }
            .signature-line {
              border-top: 1px solid #6b7280;
              padding-top: 8px;
              margin-top: 24px;
            }
            .signature-label {
              font-size: 13px;
              color: #6b7280;
            }
            .signature-name {
              margin-top: 6px;
              font-size: 11px;
              color: #9ca3af;
            }
            .copyright {
              text-align: center;
              margin-top: 20px;
              padding-top: 16px;
              border-top: 1px solid #e5e7eb;
              font-size: 11px;
              color: #9ca3af;
            }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="quotation-preview">
            <div class="header">
              <div class="brand">
                <div class="brand-mark">ITG</div>
                <div>
                  <h2 class="brand-name">${COMPANY_INFO.name}</h2>
                  <p class="brand-tagline">Your IT Solutions Partner</p>
                </div>
              </div>
              <div class="title-block">
                <h1>SALES QUOTATION</h1>
                <p>Professional Quote</p>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-section">
                <h4>From</h4>
                <div class="details">
                  <p style="font-weight:600;">${COMPANY_INFO.name}</p>
                  <p>${COMPANY_INFO.address}</p>
                  <p>ZIP: ${COMPANY_INFO.zipCode}</p>
                  <p>Phone: ${COMPANY_INFO.phone}</p>
                  <p>Email: ${COMPANY_INFO.email}</p>
                </div>
              </div>
              <div class="info-section">
                <h4>To</h4>
                <div class="details">
                  <p style="font-weight:600;">${quotation.clientName}</p>
                  <p>${quotation.clientAddress}</p>
                  <p>Phone: ${quotation.clientPhone}</p>
                  <p>Email: ${quotation.clientEmail}</p>
                </div>
              </div>
            </div>

            <div class="meta-bar">
              <div class="meta-row">
                <div>
                  <span class="meta-label">Quote Number</span>
                  <div class="meta-value">${quotation.quotationNumber}</div>
                </div>
                <div style="text-align:center;">
                  <span class="meta-label">Date</span>
                  <div style="font-size:15px; font-weight:600;">${format(new Date(quotation.createdAt), 'MMM dd, yyyy')}</div>
                </div>
                <div style="text-align:right;">
                  <span class="meta-label">Valid Until</span>
                  <div style="font-size:15px; font-weight:600;">${format(new Date(quotation.validUntil), 'MMM dd, yyyy')}</div>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width:42%;">S.N.</th>
                  <th style="width:42%;">Product Description</th>
                  <th style="width:12%; text-align:center;">Qty</th>
                  <th style="width:20%; text-align:right;">Unit Price</th>
                  <th style="width:20%; text-align:right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${renderedItems}
              </tbody>
            </table>

            <div class="totals-wrap">
              <div class="totals">
                <div class="totals-row">
                  <span>Subtotal</span>
                  <span>NPR ${quotation.subtotal.toLocaleString()}</span>
                </div>
                ${quotation.totalDiscount > 0 ? `
                  <div class="totals-row">
                    <span>Discount</span>
                    <span style="color:#dc2626;">- NPR ${quotation.totalDiscount.toLocaleString()}</span>
                  </div>
                ` : ''}
                <div class="totals-row">
                  <span>Tax (VAT 13%)</span>
                  <span>NPR ${quotation.totalTax.toLocaleString()}</span>
                </div>
                <div class="totals-row grand">
                  <span>GRAND TOTAL</span>
                  <span>NPR ${quotation.grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            ${quotation.notes ? `
              <div class="notes">
                <h4>Terms & Conditions</h4>
                <p>${quotation.notes.replace(/\n/g, '<br/>')}</p>
              </div>
            ` : ''}

            <div class="footer">
              <div class="signature">
                <div class="signature-line"></div>
                <div class="signature-label">Authorized By</div>
                <div class="signature-name">${COMPANY_INFO.name}</div>
              </div>
              <div class="signature">
                <div class="signature-line"></div>
                <div class="signature-label">Accepted By</div>
                <div class="signature-name">${quotation.clientName}</div>
              </div>
            </div>

            <div class="copyright">© ${new Date().getFullYear()} ${COMPANY_INFO.name}. Thank you for your business!</div>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=1000,height=900');
    if (!printWindow) return;

    printWindow.document.write(buildPrintableQuotation());
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
