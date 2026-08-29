import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileImage,
  ImagePlus,
  Package,
  QrCode,
  ScanLine,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react';

type RepairStatus = 'To Do' | 'In Progress' | 'Waiting for Parts' | 'Quality Check' | 'Ready';
type RepairPriority = 'Normal' | 'High' | 'Urgent';
type NotificationChannel = 'SMS' | 'Email' | 'Both';

type RepairJobCard = {
  id: string;
  customer: string;
  device: string;
  serial: string;
  issue: string;
  technician: string;
  estimate: number;
  status: RepairStatus;
  priority: RepairPriority;
  note: string;
  receivedAt: string;
  warrantyStatus: 'In Warranty' | 'Out of Warranty' | 'Void';
  warrantyEnds: string;
  customerNotified: boolean;
};

const columns: RepairStatus[] = ['To Do', 'In Progress', 'Waiting for Parts', 'Quality Check', 'Ready'];

const technicianRoster = [
  { name: 'Ariana Moss', initials: 'AM', skill: 'Diagnostics & Display' },
  { name: 'Nabin Shrestha', initials: 'NS', skill: 'Board-Level Repair' },
  { name: 'Sujan Khatri', initials: 'SK', skill: 'Battery & Power' },
  { name: 'Priya Rai', initials: 'PR', skill: 'Software Recovery' },
];

const laborRateCatalog = [
  { label: 'Diagnostics', rate: 800, time: 0.5 },
  { label: 'Screen Replacement', rate: 2200, time: 1.5 },
  { label: 'Battery Replacement', rate: 1800, time: 1.2 },
  { label: 'Board Repair', rate: 3200, time: 2.5 },
  { label: 'Software Recovery', rate: 1500, time: 1 },
  { label: 'Data Recovery', rate: 2500, time: 1.8 },
];

const partCatalog = [
  { name: 'OEM Screen', cost: 4200 },
  { name: 'Battery Pack', cost: 2800 },
  { name: 'USB-C Charge Port', cost: 1200 },
  { name: 'Thermal Paste Kit', cost: 500 },
  { name: 'Keyboard Cable', cost: 900 },
];

const soldHardwareWarranty = [
  { item: 'Dell Latitude 7440', warrantyEnds: '2027-04-22', status: 'Active' },
  { item: 'HP LaserJet Pro MFP', warrantyEnds: '2026-11-15', status: 'Expiring soon' },
  { item: 'WD 2TB External SSD', warrantyEnds: '2025-10-30', status: 'Expired' },
];

const initialJobs: RepairJobCard[] = [
  {
    id: 'RJ-1042',
    customer: 'Ranjan Shrestha',
    device: 'MacBook Pro 14',
    serial: 'MBP-14-8841',
    issue: 'Battery swelling and keyboard flicker',
    technician: 'Ariana Moss',
    estimate: 7850,
    status: 'In Progress',
    priority: 'High',
    note: 'Customer approved diagnostics and battery replacement.',
    receivedAt: '2026-08-29',
    warrantyStatus: 'Out of Warranty',
    warrantyEnds: '2025-08-10',
    customerNotified: true,
  },
  {
    id: 'RJ-1048',
    customer: 'Nikita Maharjan',
    device: 'Samsung Galaxy S23',
    serial: 'SM-S23-2042',
    issue: 'Front camera not focusing',
    technician: 'Sujan Khatri',
    estimate: 4800,
    status: 'Waiting for Parts',
    priority: 'Normal',
    note: 'Waiting for OEM camera module from distributor.',
    receivedAt: '2026-08-28',
    warrantyStatus: 'In Warranty',
    warrantyEnds: '2027-01-28',
    customerNotified: true,
  },
  {
    id: 'RJ-1051',
    customer: 'Bikesh KC',
    device: 'Dell XPS 13',
    serial: 'XPS-13-9913',
    issue: 'No display after liquid spill',
    technician: 'Nabin Shrestha',
    estimate: 12250,
    status: 'Quality Check',
    priority: 'Urgent',
    note: 'Board cleaning complete; final QA pending.',
    receivedAt: '2026-08-27',
    warrantyStatus: 'Void',
    warrantyEnds: '—',
    customerNotified: false,
  },
  {
    id: 'RJ-1054',
    customer: 'Ayush Dahal',
    device: 'iPhone 13',
    serial: 'IPH-13-4050',
    issue: 'Charging port intermittent',
    technician: 'Priya Rai',
    estimate: 3200,
    status: 'Ready',
    priority: 'Normal',
    note: 'Ready for pickup and final customer confirmation.',
    receivedAt: '2026-08-25',
    warrantyStatus: 'In Warranty',
    warrantyEnds: '2027-02-05',
    customerNotified: true,
  },
];

const todayString = () => new Date().toISOString().slice(0, 10);

const LabPage = () => {
  const [jobs, setJobs] = useState<RepairJobCard[]>(initialJobs);
  const [selectedJobId, setSelectedJobId] = useState(initialJobs[0].id);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [notificationChannel, setNotificationChannel] = useState<NotificationChannel>('Both');
  const [customerNotificationsEnabled, setCustomerNotificationsEnabled] = useState({ sms: true, email: true, whatsapp: false });
  const [photos, setPhotos] = useState<string[]>(['Front glass', 'Battery health', 'Inside board']);
  const [partsConsumed, setPartsConsumed] = useState([
    { name: 'Battery Pack', qty: 1, cost: 2800 },
    { name: 'Thermal Paste Kit', qty: 1, cost: 500 },
  ]);

  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    email: '',
    brand: 'Apple',
    model: 'MacBook Pro 14',
    serialNumber: '',
    issueSummary: '',
    receivedDate: todayString(),
    priority: 'High' as RepairPriority,
    laborService: 'Diagnostics',
    technician: technicianRoster[0].name,
    warrantyStatus: 'In Warranty',
    warrantyEnds: '2027-02-05',
    deposit: 3000,
    notes: '',
  });

  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? jobs[0];

  const laborSummary = useMemo(() => {
    const labor = laborRateCatalog.find((item) => item.label === form.laborService) ?? laborRateCatalog[0];
    const laborCost = labor.rate * Math.max(0.5, Number((form.issueSummary ? 1.4 : 1).toFixed(2)));
    const partsCost = partsConsumed.reduce((sum, item) => sum + item.qty * item.cost, 0);
    const total = laborCost + partsCost + Number(form.deposit || 0);

    return {
      laborCost,
      partsCost,
      total,
      selectedService: labor,
    };
  }, [form.issueSummary, form.laborService, form.deposit, partsConsumed]);

  const handleFormChange = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleAddJob = (event: React.FormEvent) => {
    event.preventDefault();

    const newJob: RepairJobCard = {
      id: `RJ-${Math.floor(1000 + Math.random() * 9000)}`,
      customer: form.customerName || 'New Customer',
      device: `${form.brand} ${form.model}`,
      serial: form.serialNumber || 'N/A',
      issue: form.issueSummary || 'Issue not specified',
      technician: form.technician,
      estimate: laborSummary.total,
      status: 'To Do',
      priority: form.priority,
      note: form.notes || 'Repair intake created and awaiting approval.',
      receivedAt: form.receivedDate,
      warrantyStatus: form.warrantyStatus,
      warrantyEnds: form.warrantyEnds || '—',
      customerNotified: false,
    };

    setJobs((previous) => [newJob, ...previous]);
    setSelectedJobId(newJob.id);
    setIsCreateOpen(false);
    setForm({
      customerName: '',
      phone: '',
      email: '',
      brand: 'Apple',
      model: 'MacBook Pro 14',
      serialNumber: '',
      issueSummary: '',
      receivedDate: todayString(),
      priority: 'High',
      laborService: 'Diagnostics',
      technician: technicianRoster[0].name,
      warrantyStatus: 'In Warranty',
      warrantyEnds: '2027-02-05',
      deposit: 3000,
      notes: '',
    });
  };

  const activeJobs = jobs.filter((job) => job.status !== 'Ready').length;
  const waitingParts = jobs.filter((job) => job.status === 'Waiting for Parts').length;
  const qaQueue = jobs.filter((job) => job.status === 'Quality Check').length;
  const readyNow = jobs.filter((job) => job.status === 'Ready').length;

  const notificationPreview = `${notificationChannel} notification will be sent to ${form.customerName || selectedJob.customer} with repair status and pickup timing.`;

  return (
    <AppLayout>
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6 lg:p-8 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.28)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_24%)]" />

        <div className="relative">
          <PageHeader
            title="Repair Operations Center"
            description="Repair intake, technician workflow, parts allocation, warranty tracking, and customer updates in one place."
            actions={(
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" className="gap-2" onClick={() => setIsCreateOpen(true)}>
                  <Wrench className="w-4 h-4" />
                  Add New Repair
                </Button>
                <Button variant="outline" className="gap-2">
                  <ScanLine className="w-4 h-4" />
                  Scan QR Job tag
                </Button>
                <Button className="gap-2 bg-slate-950 text-white hover:bg-slate-800">
                  <QrCode className="w-4 h-4" />
                  Print Job Sheet
                </Button>
              </div>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <StatCard title="Active Jobs" value={activeJobs} subtitle="Current repair queue" icon={Wrench} variant="primary" />
            <StatCard title="Waiting for Parts" value={waitingParts} subtitle="Need supplier follow-up" icon={Package} variant="warning" />
            <StatCard title="Quality Check" value={qaQueue} subtitle="QA pending" icon={ShieldCheck} variant="success" />
            <StatCard title="Ready for Pickup" value={readyNow} subtitle="Updates pushed" icon={Sparkles} variant="default" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
            <div className="space-y-6">
              <Card className="border-border/70 bg-white/90 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-xl">Kanban Workflow</CardTitle>
                    <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
                      <Clock3 className="w-3.5 h-3.5" />
                      SLA active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto pb-2">
                    <div className="grid min-w-[1100px] grid-cols-5 gap-4">
                      {columns.map((column) => (
                        <div key={column} className="rounded-2xl border border-border bg-slate-50/80 p-3">
                          <div className="mb-3 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{column}</p>
                              <p className="text-xs text-muted-foreground">{jobs.filter((job) => job.status === column).length} jobs</p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                              {jobs.filter((job) => job.status === column).length}
                            </div>
                          </div>

                          <div className="space-y-3">
                            {jobs.filter((job) => job.status === column).map((job) => (
                              <button
                                key={job.id}
                                type="button"
                                onClick={() => setSelectedJobId(job.id)}
                                className={cn(
                                  'w-full rounded-xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5',
                                  selectedJobId === job.id ? 'border-blue-200 bg-blue-50' : job.priority === 'Urgent' ? 'border-amber-200 bg-amber-50/80' : 'border-slate-200 bg-white'
                                )}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">{job.id}</p>
                                    <p className="text-xs text-muted-foreground">{job.customer}</p>
                                  </div>
                                  <Badge variant={job.priority === 'Urgent' ? 'destructive' : 'outline'} className="rounded-full">
                                    {job.priority}
                                  </Badge>
                                </div>

                                <div className="mt-3 space-y-2 text-sm text-slate-700">
                                  <div className="flex items-center gap-2">
                                    <Wrench className="h-4 w-4 text-slate-500" />
                                    <span>{job.device}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-slate-500" />
                                    <span>{job.issue}</span>
                                  </div>
                                </div>

                                <Separator className="my-3" />

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{job.technician}</span>
                                  <span>NPR {job.estimate.toLocaleString()}</span>
                                </div>
                                <p className="mt-2 text-xs leading-5 text-slate-600">{job.note}</p>
                              </button>
                            ))}

                            {jobs.filter((job) => job.status === column).length === 0 && (
                              <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-xs text-muted-foreground">
                                No jobs in this stage.
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                      <FileImage className="h-5 w-5 text-blue-600" />
                      New Repair Intake
                    </DialogTitle>
                    <DialogDescription>
                      Capture device details, technician assignment, labor estimate, and customer repair notes.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleAddJob} className="space-y-5 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="customerName">Customer Name</Label>
                        <Input id="customerName" value={form.customerName} onChange={(e) => handleFormChange('customerName', e.target.value)} placeholder="Full name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" value={form.phone} onChange={(e) => handleFormChange('phone', e.target.value)} placeholder="98xxxxxxxx" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={form.email} onChange={(e) => handleFormChange('email', e.target.value)} placeholder="name@email.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="receivedDate">Received Date</Label>
                        <Input id="receivedDate" type="date" value={form.receivedDate} onChange={(e) => handleFormChange('receivedDate', e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="brand">Brand</Label>
                        <Input id="brand" value={form.brand} onChange={(e) => handleFormChange('brand', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="model">Model</Label>
                        <Input id="model" value={form.model} onChange={(e) => handleFormChange('model', e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="serialNumber">Serial / IMEI</Label>
                        <Input id="serialNumber" value={form.serialNumber} onChange={(e) => handleFormChange('serialNumber', e.target.value)} placeholder="IMEI / serial number" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <select
                          id="priority"
                          value={form.priority}
                          onChange={(e) => handleFormChange('priority', e.target.value as RepairPriority)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="Normal">Normal</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="issueSummary">Problem Description</Label>
                      <Textarea
                        id="issueSummary"
                        value={form.issueSummary}
                        onChange={(e) => handleFormChange('issueSummary', e.target.value)}
                        rows={4}
                        placeholder="Describe the issue, symptoms, and any previous repair attempts."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="laborService">Labor Service</Label>
                        <select
                          id="laborService"
                          value={form.laborService}
                          onChange={(e) => handleFormChange('laborService', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          {laborRateCatalog.map((item) => (
                            <option key={item.label} value={item.label}>{item.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="technician">Technician</Label>
                        <select
                          id="technician"
                          value={form.technician}
                          onChange={(e) => handleFormChange('technician', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          {technicianRoster.map((tech) => (
                            <option key={tech.name} value={tech.name}>{tech.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="warrantyStatus">Warranty Status</Label>
                        <select
                          id="warrantyStatus"
                          value={form.warrantyStatus}
                          onChange={(e) => handleFormChange('warrantyStatus', e.target.value as 'In Warranty' | 'Out of Warranty' | 'Void')}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="In Warranty">In Warranty</option>
                          <option value="Out of Warranty">Out of Warranty</option>
                          <option value="Void">Void</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="warrantyEnds">Warranty End</Label>
                        <Input id="warrantyEnds" type="date" value={form.warrantyEnds} onChange={(e) => handleFormChange('warrantyEnds', e.target.value)} />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-900">Labor Rate Estimator</p>
                        <Badge variant="outline">{laborSummary.selectedService.label}</Badge>
                      </div>
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between"><span>Labor</span><span>NPR {laborSummary.laborCost.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Parts</span><span>NPR {laborSummary.partsCost.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Deposit</span><span>NPR {Number(form.deposit || 0).toLocaleString()}</span></div>
                        <Separator />
                        <div className="flex justify-between font-semibold text-base text-slate-900"><span>Estimated Total</span><span>NPR {laborSummary.total.toLocaleString()}</span></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Internal Notes</Label>
                      <Textarea id="notes" value={form.notes} onChange={(e) => handleFormChange('notes', e.target.value)} rows={3} placeholder="Add notes for technicians, policy details, or customer expectations." />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                      <Button type="submit">Create Repair Job</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Card className="border-border/70 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5 text-amber-600" />
                    Parts Consumption
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {partsConsumed.map((part, index) => (
                      <div key={`${part.name}-${index}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{part.name}</p>
                          <p className="text-xs text-muted-foreground">Qty {part.qty}</p>
                        </div>
                        <span className="text-sm font-semibold text-slate-800">NPR {part.cost.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label>Quick add part</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {partCatalog.map((part) => (
                        <Button
                          key={part.name}
                          type="button"
                          variant="outline"
                          className="justify-between text-xs"
                          onClick={() => setPartsConsumed((previous) => {
                            const existing = previous.find((item) => item.name === part.name);
                            if (existing) {
                              return previous.map((item) => item.name === part.name ? { ...item, qty: item.qty + 1, cost: part.cost * (item.qty + 1) } : item);
                            }
                            return [...previous, { name: part.name, qty: 1, cost: part.cost }];
                          })}
                        >
                          <span>{part.name}</span>
                          <span>NPR {part.cost.toLocaleString()}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bell className="h-5 w-5 text-emerald-600" />
                    Customer Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {(['SMS', 'Email', 'Both'] as NotificationChannel[]).map((channel) => (
                      <Button
                        key={channel}
                        type="button"
                        variant={notificationChannel === channel ? 'default' : 'outline'}
                        onClick={() => setNotificationChannel(channel)}
                        className="text-xs"
                      >
                        {channel}
                      </Button>
                    ))}
                  </div>

                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={customerNotificationsEnabled.sms} onChange={(e) => setCustomerNotificationsEnabled((prev) => ({ ...prev, sms: e.target.checked }))} /> SMS update</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={customerNotificationsEnabled.email} onChange={(e) => setCustomerNotificationsEnabled((prev) => ({ ...prev, email: e.target.checked }))} /> Email update</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={customerNotificationsEnabled.whatsapp} onChange={(e) => setCustomerNotificationsEnabled((prev) => ({ ...prev, whatsapp: e.target.checked }))} /> WhatsApp</label>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    {notificationPreview}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
            <Card className="border-border/70 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-violet-600" />
                  Technician Assignment & Job Detail
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{selectedJob.id}</p>
                      <p className="text-sm text-muted-foreground">{selectedJob.customer}</p>
                    </div>
                    <Badge variant={selectedJob.priority === 'Urgent' ? 'destructive' : 'secondary'}>{selectedJob.priority}</Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700">
                    <div><span className="text-muted-foreground">Device:</span><div className="font-medium text-slate-900">{selectedJob.device}</div></div>
                    <div><span className="text-muted-foreground">Serial:</span><div className="font-medium text-slate-900">{selectedJob.serial}</div></div>
                    <div><span className="text-muted-foreground">Received:</span><div className="font-medium text-slate-900">{selectedJob.receivedAt}</div></div>
                    <div><span className="text-muted-foreground">Warranty:</span><div className="font-medium text-slate-900">{selectedJob.warrantyStatus}</div></div>
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Issue</p>
                    <p className="mt-2 text-sm text-slate-700">{selectedJob.issue}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {technicianRoster.map((tech) => (
                    <Button
                      key={tech.name}
                      type="button"
                      variant={selectedJob.technician === tech.name ? 'default' : 'outline'}
                      className="justify-start text-left"
                      onClick={() => setJobs((previous) => previous.map((job) => job.id === selectedJob.id ? { ...job, technician: tech.name } : job))}
                    >
                      <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">{tech.initials}</span>
                      {tech.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ImagePlus className="h-5 w-5 text-sky-600" />
                  Device Photos & Warranty
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <div key={`${photo}-${index}`} className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-[11px] font-medium text-slate-600">
                      {photo}
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Warranty Tracking
                  </div>
                  <div className="mt-3 space-y-3">
                    {soldHardwareWarranty.map((item) => (
                      <div key={item.item} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium text-slate-900">{item.item}</p>
                          <p className="text-xs text-muted-foreground">Ends {item.warrantyEnds}</p>
                        </div>
                        <Badge variant={item.status === 'Active' ? 'secondary' : item.status === 'Expiring soon' ? 'outline' : 'destructive'}>{item.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <CalendarDays className="h-4 w-4 text-slate-500" />
                  Customer notified: {selectedJob.customerNotified ? 'Yes' : 'Pending'}
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1">Upload Photo</Button>
                  <Button type="button" className="flex-1">Send Status</Button>
                </div>

                {selectedJob.status === 'Ready' && (
                  <Button
                    type="button"
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => window.location.href = `/billing?repair=${selectedJob.id}`}
                  >
                    <CreditCard className="h-4 w-4" />
                    Convert Repair to Bill
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 flex justify-end">
            <div className="flex items-center gap-3 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              Repair workflow dashboard is active and ready for technician operations.
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default LabPage;