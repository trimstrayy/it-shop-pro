import { useState, useEffect } from 'react';
import { Info, LifeBuoy, FileText, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/branding';
import { CONTACT_INFO } from '@/data/legalContent';
import { useAuth } from '@/contexts/AuthContext';

const ABOUT_TABS = [
  { value: 'about', label: 'About the System', icon: Info },
  { value: 'contact', label: 'Contact & Support', icon: LifeBuoy },
  { value: 'terms', label: 'Terms of Service', icon: FileText },
  { value: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
] as const;

type AboutTabValue = (typeof ABOUT_TABS)[number]['value'];

const getInitialTab = (): AboutTabValue => {
  const hashTab = window.location.hash.replace('#', '');
  return ABOUT_TABS.some(tab => tab.value === hashTab) ? (hashTab as AboutTabValue) : 'about';
};

const AboutPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AboutTabValue>(getInitialTab);

  useEffect(() => {
    window.history.replaceState(null, '', `#${activeTab}`);
  }, [activeTab]);

  const isPlatformAdmin = user?.isPlatformAdmin;

  const content = (
    <>
      <PageHeader
        title="About & Legal"
        description="Information about this system, how to get support, and the legal terms that apply to its use."
        actions={isPlatformAdmin ? (
          <Button variant="outline" asChild>
            <Link to="/platform-admin"><ArrowLeft className="mr-2 h-4 w-4" />Back to Console</Link>
          </Button>
        ) : undefined}
      />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AboutTabValue)} className="space-y-6">
        <TabsList className="w-full h-auto flex-wrap justify-start gap-1">
          {ABOUT_TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="flex-1 min-w-[200px]">
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="about" className="mt-0">
          <div className="prose prose-slate max-w-none">
            <p>
              {APP_NAME} is a business management system designed to help small and medium
              businesses run their day-to-day operations. It provides tools for handling
              billing, inventory, quotations, customer records, and other core business
              functions in one place.
            </p>
            <p>
              The system is provided as a hosted service, which means the application and
              its data are managed and maintained by the provider on your behalf. You access
              it through a web browser using your business's own account.
            </p>
            <p>
              This page contains general information about the system, contact details for
              support, and the legal documents — the Terms of Service and Privacy Policy —
              that govern your use of the software.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="mt-0">
          <div className="prose prose-slate max-w-none">
            <p>
              For questions about the system, help with an issue, or any other support
              request, please contact us using the details below.
            </p>
            <ul>
              <li><strong>Business:</strong> {CONTACT_INFO.businessName}</li>
              <li><strong>Contact:</strong> {CONTACT_INFO.contactName}</li>
              <li><strong>Email:</strong> {CONTACT_INFO.email}</li>
              <li><strong>Phone:</strong> {CONTACT_INFO.phone}</li>
            </ul>
            <p>
              Support requests are typically answered within two business days. Issues that
              prevent billing or other critical operations are prioritised.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="terms" className="mt-0">
          <div className="prose prose-slate max-w-none">
            <h1>Terms of Service / Service Agreement — {APP_NAME}</h1>
            <p><strong>Effective date: [DATE]</strong></p>
            <p>
              <strong>Between:</strong> {CONTACT_INFO.businessName} ("Provider") and
              [Client Business Name] ("Client")
            </p>

            <h2>1. Service Provided</h2>
            <p>
              Provider grants Client access to use {APP_NAME}, a business management
              software system covering billing, inventory, quotations, and related
              business functions, for use in Client's business operations.
            </p>

            <h2>2. Fees and Payment</h2>
            <ul>
              <li><strong>Setup fee:</strong> NPR [AMOUNT], payable [upon delivery / as agreed].</li>
              <li><strong>Ongoing fee:</strong> [Describe the actual agreed model — e.g. "NPR [AMOUNT] per year, due on the anniversary of the setup date" OR "maintenance and support billed per incident as requested by Client"].</li>
              <li>Late payment of any ongoing fee may result in suspension of access until payment is received, with [X days'] notice given beforehand.</li>
            </ul>

            <h2>3. What's Included</h2>
            <ul>
              <li>Access to the System as configured at delivery, including the modules specifically enabled for Client's business.</li>
              <li>[Describe included support period, e.g. "30 days of complimentary bug-fix support following delivery"].</li>
              <li>Hosting and maintenance of the underlying database and application infrastructure by Provider.</li>
            </ul>

            <h2>4. What's Not Included</h2>
            <ul>
              <li>New feature development beyond what was agreed at delivery — quoted and billed separately upon request.</li>
              <li>SMS credits for notification features (if enabled) — [specify who bears this cost, per your earlier arrangement].</li>
              <li>Hardware (computers, barcode scanners, printers, internet connectivity) — Client's responsibility.</li>
              <li>Data entry of Client's initial product catalog, beyond what was agreed as part of setup.</li>
            </ul>

            <h2>5. Client Responsibilities</h2>
            <ul>
              <li>Providing accurate business information for setup.</li>
              <li>Managing which staff members have accounts, and promptly informing Provider to deactivate accounts for departed staff.</li>
              <li>Maintaining a working internet connection at the business premises, since the System requires internet access to function.</li>
              <li>Not attempting to bypass, reverse-engineer, or independently modify the System.</li>
            </ul>

            <h2>6. Data Ownership</h2>
            <p>
              All business data entered into the System (products, customers, transactions,
              etc.) belongs to Client. Provider acts as custodian of this data for the
              purpose of operating the System, per the accompanying Privacy Policy.
            </p>

            <h2>7. Service Availability</h2>
            <p>
              Provider will make reasonable efforts to keep the System available and
              functioning correctly but does not guarantee uninterrupted access. Planned
              maintenance will be communicated in advance where possible.
            </p>

            <h2>8. Limitation of Liability</h2>
            <p>
              Provider is not liable for indirect, incidental, or consequential losses
              arising from use of the System, including but not limited to lost sales, lost
              data due to Client's own actions (e.g. incorrect entries), or business
              interruption due to internet outages outside Provider's control. Provider's
              total liability under this agreement is limited to the fees paid by Client in
              the [12 months] preceding any claim.
            </p>

            <h2>9. Termination</h2>
            <ul>
              <li>Either party may terminate this agreement with [X days'] written notice.</li>
              <li>Upon termination, Client's access will be disabled, and data will be handled per the Privacy Policy's retention terms.</li>
              <li>Client may request a data export prior to termination.</li>
            </ul>

            <h2>10. Support and Maintenance</h2>
            <ul>
              <li>Bug fixes related to the System's core functionality are covered under [the included support period / the annual maintenance fee, as applicable].</li>
              <li>Support requests should be directed to: {CONTACT_INFO.email}.</li>
              <li>Response time target: [e.g. "within 2 business days for non-urgent issues; same-day for issues preventing billing"].</li>
            </ul>

            <h2>11. Governing Law</h2>
            <p>This agreement is governed by the laws of Nepal.</p>

            <h2>12. Signatures</h2>
            <p>Provider: ___________________________ Date: ___________</p>
            <p>Client: ______________________________ Date: ___________</p>

            <hr />
            <p>
              <em>
                This document is a template and has not been reviewed by a lawyer. Have it
                reviewed by a qualified legal professional before use as a binding contract,
                particularly the liability, payment, and termination clauses.
              </em>
            </p>
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="mt-0">
          <div className="prose prose-slate max-w-none">
            <h1>Privacy Policy — {APP_NAME}</h1>
            <p><strong>Last updated: [DATE]</strong></p>
            <p><strong>Provided by: {CONTACT_INFO.businessName}</strong></p>
            <p>
              This Privacy Policy explains what information this software system ("the
              System") collects, how it is used, and how it is protected, for [Client
              Business Name] ("the Business") and its staff who use the System.
            </p>

            <h2>1. What Information the System Collects</h2>
            <p>The System stores the following categories of information as part of its normal operation:</p>
            <ul>
              <li><strong>Business data:</strong> products, inventory levels, pricing, categories, and stock movement history.</li>
              <li><strong>Customer data:</strong> names, phone numbers, and (where provided) email addresses of the Business's customers, entered by staff for billing, quotations, and credit tracking.</li>
              <li><strong>Transaction data:</strong> invoices, quotations, payment records, and credit/due balances.</li>
              <li><strong>Staff account data:</strong> names, email addresses, and role assignments for individuals the Business authorizes to use the System.</li>
              <li><strong>Operational logs:</strong> records of inventory changes, delivery status updates, and (where applicable) repair job records, kept for accountability and audit purposes.</li>
            </ul>
            <p>
              The System does not collect sensitive personal data (health information,
              government identification numbers, financial account numbers) unless the
              Business itself chooses to enter such data manually, which is not recommended.
            </p>

            <h2>2. How Information Is Used</h2>
            <p>
              Information stored in the System is used solely to operate the Business's
              day-to-day sales, inventory, and customer management functions. It is not
              sold, rented, or shared with third parties for marketing or advertising
              purposes.
            </p>
            <p>
              Where an SMS notification feature is enabled, customer phone numbers are
              shared only with the SMS gateway provider used to deliver those messages,
              solely for the purpose of sending the specific notification (e.g. a payment
              reminder).
            </p>

            <h2>3. Where Data Is Stored</h2>
            <p>
              Data is stored using Supabase, a third-party cloud database provider, on
              infrastructure operated by Supabase Inc. {CONTACT_INFO.businessName} configures
              and manages access to this database on behalf of the Business but does not
              itself operate physical servers.
            </p>

            <h2>4. Data Access and Isolation</h2>
            <p>
              The System is built so that each business using it (including businesses other
              than [Client Business Name], if the System is licensed to more than one
              business) has its data kept separate and inaccessible to other businesses using
              the same underlying software platform. Staff accounts within the Business can
              only access data according to the role assigned to them (e.g. a sales staff
              account may not have the same access as an admin account).
            </p>

            <h2>5. Data Retention and Deletion</h2>
            <p>
              Data entered into the System is retained for as long as the Business continues
              to use the System. If the Business's service agreement with{' '}
              {CONTACT_INFO.businessName} ends, data will be retained for [INSERT PERIOD,
              e.g. 30 days] after termination to allow for export, after which it may be
              permanently deleted unless otherwise agreed in writing.
            </p>

            <h2>6. Business's Responsibilities</h2>
            <p>The Business is responsible for:</p>
            <ul>
              <li>Ensuring staff accounts are only given to authorized individuals.</li>
              <li>Promptly notifying {CONTACT_INFO.businessName} if a staff member leaves the Business, so their account can be deactivated.</li>
              <li>Using the System in compliance with applicable Nepali law regarding the collection and use of customer personal data.</li>
            </ul>

            <h2>7. Security Measures</h2>
            <p>
              The System uses industry-standard practices including encrypted connections
              (HTTPS), role-based access control, and database-level access restrictions to
              protect stored data. No system can guarantee absolute security, and{' '}
              {CONTACT_INFO.businessName} will notify the Business promptly in the event of
              any known data breach affecting the Business's data.
            </p>

            <h2>8. Changes to This Policy</h2>
            <p>
              This policy may be updated from time to time. The Business will be notified of
              material changes.
            </p>

            <h2>9. Contact</h2>
            <p>For questions about this Privacy Policy or how data is handled, contact:</p>
            <p>
              <strong>{CONTACT_INFO.businessName}</strong>
              <br />
              {CONTACT_INFO.email} / {CONTACT_INFO.phone}
            </p>

            <hr />
            <p>
              <em>
                This document is a template and has not been reviewed by a lawyer. Consult a
                qualified legal professional before relying on it as a binding privacy
                policy, particularly regarding compliance with Nepal's data protection
                regulations.
              </em>
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );

  if (isPlatformAdmin) {
    return (
      <main className="min-h-screen bg-background p-6 lg:p-10">
        <div className="mx-auto max-w-7xl space-y-8">
          {content}
        </div>
      </main>
    );
  }

  return <AppLayout>{content}</AppLayout>;
};

export default AboutPage;
