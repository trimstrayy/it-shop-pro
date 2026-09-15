import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ChevronRight,
  Clock3,
  CreditCard,
  Package,
  Plus,
  QrCode,
  ScanLine,
  ShieldCheck,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';

/**
 * ──────────────────────────────────────────────────────────────────────────
 * UI-ONLY REDESIGN
 * This page still runs on local mock state. Every mock shape below mirrors
 * the real DataContext types (RepairJob, LaborRate, DeviceBrand/Model,
 * Customer) field-for-field so that swapping in `useData()` later is a
 * find-and-replace, not a rewrite. Search "MOCK —" to find what to remove.
 * Two things aren't in DataContext yet and need a decision before wiring:
 *   1. Technicians — RepairJob has `assignedTechId` but there's no
 *      `technicians`/`staff` list on the context to populate a picker from.
 *   2. "Parts" for a job — repair_job_parts.product_id points at your real
 *      `products` table, so the parts picker below should search `products`
 *      (filtered to repair-relevant stock), not a separate hardcoded list.
 * ──────────────────────────────────────────────────────────────────────────
 */

type RepairStatus = 'to_do' | 'in_progress' | 'waiting_for_parts' | 'quality_check' | 'ready';
type RepairPriority = 'normal' | 'high' | 'urgent';
type NotifyChannel = 'sms' | 'email' | 'both';

type MockRepairJob = {
  id: string;
  jobId: string;
  customerName: string;
  customerPhone: string;
  deviceLabel: string;
  serial: string;
  issueSummary: string;
  assignedTechName: string;
  estimatedCost: number;
  depositPaid: number;
  status: RepairStatus;
  priority: RepairPriority;
  intakeNotes: string;
  createdAt: string;
  warrantyStatus: 'in_warranty' | 'out_of_warranty' | 'void';
  warrantyEnds: string;
  readyNotifiedAt: string | null;
  parts: { name: string; quantity: number; unitCost: number }[];
  photos: string[];
};

const columns: { key: RepairStatus; label: string }[] = [
  { key: 'to_do', label: 'To do' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'waiting_for_parts', label: 'Waiting for parts' },
  { key: 'quality_check', label: 'Quality check' },
  { key: 'ready', label: 'Ready' },
];

const STATUS_META: Record<RepairStatus, { dot: string; spine: string; text: string; bg: string }> = {
  to_do: { dot: 'bg-slate-400', spine: '#94A3B8', text: 'text-slate-600', bg: 'bg-slate-50' },
  in_progress: { dot: 'bg-indigo-500', spine: '#4C5FD5', text: 'text-indigo-700', bg: 'bg-indigo-50/60' },
  waiting_for_parts: { dot: 'bg-amber-500', spine: '#C2790D', text: 'text-amber-700', bg: 'bg-amber-50/60' },
  quality_check: { dot: 'bg-violet-500', spine: '#7C57C9', text: 'text-violet-700', bg: 'bg-violet-50/60' },
  ready: { dot: 'bg-emerald-500', spine: '#0F8B5F', text: 'text-emerald-700', bg: 'bg-emerald-50/60' },
};

const PRIORITY_META: Record<RepairPriority, { label: string; color: string; icon: boolean }> = {
  normal: { label: 'Normal', color: '#94A3B8', icon: false },
  high: { label: 'High', color: '#C2790D', icon: false },
  urgent: { label: 'Urgent', color: '#C2410C', icon: true },
};

// MOCK — replace with `brands` / `models` from useData()
const deviceBrands = [
  { id: 'brand-apple', name: 'Apple', models: ['MacBook Pro 14', 'MacBook Air 13', 'iPhone 13', 'iPhone 15'] },
  { id: 'brand-samsung', name: 'Samsung', models: ['Galaxy S23', 'Galaxy S24 Ultra', 'Galaxy Tab S9'] },
  { id: 'brand-dell', name: 'Dell', models: ['XPS 13', 'Latitude 7440', 'Inspiron 15'] },
  { id: 'brand-hp', name: 'HP', models: ['LaserJet Pro MFP', 'Pavilion 15', 'EliteBook 840'] },
];

// MOCK — replace with `laborRates` from useData()
const laborRates = [
  { id: 'lr-1', serviceName: 'Diagnostics', basePrice: 800, averageTimeRequiredMinutes: 30 },
  { id: 'lr-2', serviceName: 'Screen replacement', basePrice: 2200, averageTimeRequiredMinutes: 90 },
  { id: 'lr-3', serviceName: 'Battery replacement', basePrice: 1800, averageTimeRequiredMinutes: 70 },
  { id: 'lr-4', serviceName: 'Board repair', basePrice: 3200, averageTimeRequiredMinutes: 150 },
  { id: 'lr-5', serviceName: 'Software recovery', basePrice: 1500, averageTimeRequiredMinutes: 60 },
  { id: 'lr-6', serviceName: 'Data recovery', basePrice: 2500, averageTimeRequiredMinutes: 110 },
];

// MOCK — should come from `products` (repair-relevant stock), not a fixed catalog
const partCatalog = [
  { name: 'OEM screen', unitCost: 4200 },
  { name: 'Battery pack', unitCost: 2800 },
  { name: 'USB-C charge port', unitCost: 1200 },
  { name: 'Thermal paste kit', unitCost: 500 },
  { name: 'Keyboard cable', unitCost: 900 },
];

// MOCK — replace with `customers` from useData(), with a "new customer" fallback
const existingCustomers = [
  { id: 'c-1', name: 'Ranjan Shrestha', phone: '9841022310' },
  { id: 'c-2', name: 'Nikita Maharjan', phone: '9803312245' },
  { id: 'c-3', name: 'Bikesh KC', phone: '9812245590' },
];

// MOCK — no `technicians` source on DataContext yet; see note at top of file
const technicianRoster = [
  { name: 'Ariana Moss', initials: 'AM', skill: 'Diagnostics & display' },
  { name: 'Nabin Shrestha', initials: 'NS', skill: 'Board-level repair' },
  { name: 'Sujan Khatri', initials: 'SK', skill: 'Battery & power' },
  { name: 'Priya Rai', initials: 'PR', skill: 'Software recovery' },
];

const soldHardwareWarranty = [
  { item: 'Dell Latitude 7440', warrantyEnds: '2027-04-22', status: 'active' as const },
  { item: 'HP LaserJet Pro MFP', warrantyEnds: '2026-11-15', status: 'expiring' as const },
  { item: 'WD 2TB External SSD', warrantyEnds: '2025-10-30', status: 'expired' as const },
];

const todayString = () => new Date().toISOString().slice(0, 10);

const initialJobs: MockRepairJob[] = [
  {
    id: 'RJ-1042',
    jobId: 'RJ-1042',
    customerName: 'Ranjan Shrestha',
    customerPhone: '9841022310',
    deviceLabel: 'Apple MacBook Pro 14',
    serial: 'MBP-14-8841',
    issueSummary: 'Battery swelling and keyboard flicker',
    assignedTechName: 'Ariana Moss',
    estimatedCost: 7850,
    depositPaid: 3000,
    status: 'in_progress',
    priority: 'high',
    intakeNotes: 'Customer approved diagnostics and battery replacement.',
    createdAt: '2026-08-29',
    warrantyStatus: 'out_of_warranty',
    warrantyEnds: '2025-08-10',
    readyNotifiedAt: null,
    parts: [{ name: 'Battery pack', quantity: 1, unitCost: 2800 }],
    photos: ['Front glass', 'Battery health'],
  },
  {
    id: 'RJ-1048',
    jobId: 'RJ-1048',
    customerName: 'Nikita Maharjan',
    customerPhone: '9803312245',
    deviceLabel: 'Samsung Galaxy S23',
    serial: 'SM-S23-2042',
    issueSummary: 'Front camera not focusing',
    assignedTechName: 'Sujan Khatri',
    estimatedCost: 4800,
    depositPaid: 1000,
    status: 'waiting_for_parts',
    priority: 'normal',
    intakeNotes: 'Waiting for OEM camera module from distributor.',
    createdAt: '2026-08-28',
    warrantyStatus: 'in_warranty',
    warrantyEnds: '2027-01-28',
    readyNotifiedAt: null,
    parts: [],
    photos: [],
  },
  {
    id: 'RJ-1051',
    jobId: 'RJ-1051',
    customerName: 'Bikesh KC',
    customerPhone: '9812245590',
    deviceLabel: 'Dell XPS 13',
    serial: 'XPS-13-9913',
    issueSummary: 'No display after liquid spill',
    assignedTechName: 'Nabin Shrestha',
    estimatedCost: 12250,
    depositPaid: 5000,
    status: 'quality_check',
    priority: 'urgent',
    intakeNotes: 'Board cleaning complete; final QA pending.',
    createdAt: '2026-08-27',
    warrantyStatus: 'void',
    warrantyEnds: '—',
    readyNotifiedAt: null,
    parts: [{ name: 'Thermal paste kit', quantity: 1, unitCost: 500 }],
    photos: ['Inside board'],
  },
  {
    id: 'RJ-1054',
    jobId: 'RJ-1054',
    customerName: 'Aayush Dahal',
    customerPhone: '9840011223',
    deviceLabel: 'Apple iPhone 13',
    serial: 'IPH-13-4050',
    issueSummary: 'Charging port intermittent',
    assignedTechName: 'Priya Rai',
    estimatedCost: 3200,
    depositPaid: 1000,
    status: 'ready',
    priority: 'normal',
    intakeNotes: 'Ready for pickup and final customer confirmation.',
    createdAt: '2026-08-25',
    warrantyStatus: 'in_warranty',
    warrantyEnds: '2027-02-05',
    readyNotifiedAt: '2026-09-14',
    parts: [],
    photos: [],
  },
];

const currency = (n: number) => `NPR ${Math.round(n).toLocaleString('en-IN')}`;

function TicketCard({ job, selected, onSelect }: { job: MockRepairJob; selected: boolean; onSelect: () => void }) {
  const priority = PRIORITY_META[job.priority];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group flex w-full overflow-hidden rounded-lg border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
        selected ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200'
      )}
    >
      <div className="flex w-7 shrink-0 items-center justify-center border-r border-dashed border-slate-200 bg-slate-50/70 py-3">
        <span className="font-mono text-[10px] tracking-[0.12em] text-slate-400 [writing-mode:vertical-rl]">
          {job.jobId}
        </span>
      </div>

      <div className="flex-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">{job.customerName}</p>
            <p className="text-xs text-muted-foreground">{job.deviceLabel}</p>
          </div>
          {priority.icon && (
            <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
              <AlertTriangle className="h-3 w-3" /> Urgent
            </span>
          )}
        </div>

        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{job.issueSummary}</p>

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-500">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[9px] font-bold text-white">
              {job.assignedTechName.split(' ').map((p) => p[0]).join('')}
            </span>
            {job.assignedTechName}
          </span>
          <span className="font-mono font-medium text-slate-800">{currency(job.estimatedCost)}</span>
        </div>
      </div>

      <div className="w-1.5 shrink-0" style={{ backgroundColor: priority.color }} />
    </button>
  );
}

function MetricTile({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: typeof Wrench;
}) {
  return (
    <div className="flex flex-1 items-center gap-3 px-5 py-4 first:pl-0 last:pr-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${color}1A` }}>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div>
        <p className="font-mono text-2xl font-semibold leading-none text-slate-900">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

const LabPage = () => {
  const [jobs, setJobs] = useState<MockRepairJob[]>(initialJobs);
  const [selectedJobId, setSelectedJobId] = useState(initialJobs[0].id);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailTab, setDetailTab] = useState('overview');

  const [notifyChannel, setNotifyChannel] = useState<NotifyChannel>('both');
  const [notifyPrefs, setNotifyPrefs] = useState({ sms: true, email: true, whatsapp: false });

  const [form, setForm] = useState({
    customerId: '',
    customerName: '',
    phone: '',
    email: '',
    brandId: deviceBrands[0].id,
    model: deviceBrands[0].models[0],
    serialNumber: '',
    issueSummary: '',
    receivedDate: todayString(),
    priority: 'high' as RepairPriority,
    laborRateId: laborRates[0].id,
    technician: technicianRoster[0].name,
    warrantyStatus: 'in_warranty' as MockRepairJob['warrantyStatus'],
    warrantyEnds: '2027-02-05',
    deposit: 3000,
    notes: '',
  });

  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? jobs[0];
  const selectedBrand = deviceBrands.find((b) => b.id === form.brandId) ?? deviceBrands[0];

  const estimate = useMemo(() => {
    const labor = laborRates.find((rate) => rate.id === form.laborRateId) ?? laborRates[0];
    const total = labor.basePrice + Number(form.deposit || 0);
    return { labor, laborCost: labor.basePrice, total };
  }, [form.laborRateId, form.deposit]);

  const setField = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddJob = (event: React.FormEvent) => {
    event.preventDefault();

    const newJob: MockRepairJob = {
      id: `RJ-${Math.floor(1000 + Math.random() * 9000)}`,
      jobId: `RJ-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: form.customerName || 'New customer',
      customerPhone: form.phone,
      deviceLabel: `${selectedBrand.name} ${form.model}`,
      serial: form.serialNumber || 'N/A',
      issueSummary: form.issueSummary || 'Issue not specified',
      assignedTechName: form.technician,
      estimatedCost: estimate.total,
      depositPaid: Number(form.deposit || 0),
      status: 'to_do',
      priority: form.priority,
      intakeNotes: form.notes || 'Repair intake created and awaiting approval.',
      createdAt: form.receivedDate,
      warrantyStatus: form.warrantyStatus,
      warrantyEnds: form.warrantyEnds || '—',
      readyNotifiedAt: null,
      parts: [],
      photos: [],
    };

    setJobs((prev) => [newJob, ...prev]);
    setSelectedJobId(newJob.id);
    setIsCreateOpen(false);
    setForm({
      customerId: '',
      customerName: '',
      phone: '',
      email: '',
      brandId: deviceBrands[0].id,
      model: deviceBrands[0].models[0],
      serialNumber: '',
      issueSummary: '',
      receivedDate: todayString(),
      priority: 'high',
      laborRateId: laborRates[0].id,
      technician: technicianRoster[0].name,
      warrantyStatus: 'in_warranty',
      warrantyEnds: '2027-02-05',
      deposit: 3000,
      notes: '',
    });
  };

  const addPartToSelectedJob = (part: { name: string; unitCost: number }) => {
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== selectedJob.id) return job;
        const existing = job.parts.find((p) => p.name === part.name);
        const parts = existing
          ? job.parts.map((p) => (p.name === part.name ? { ...p, quantity: p.quantity + 1 } : p))
          : [...job.parts, { name: part.name, quantity: 1, unitCost: part.unitCost }];
        return { ...job, parts };
      })
    );
  };

  const setTechnician = (name: string) => {
    setJobs((prev) => prev.map((job) => (job.id === selectedJob.id ? { ...job, assignedTechName: name } : job)));
  };

  const activeJobs = jobs.filter((job) => job.status !== 'ready').length;
  const waitingParts = jobs.filter((job) => job.status === 'waiting_for_parts').length;
  const qaQueue = jobs.filter((job) => job.status === 'quality_check').length;
  const readyNow = jobs.filter((job) => job.status === 'ready').length;

  const partsTotal = selectedJob.parts.reduce((sum, p) => sum + p.quantity * p.unitCost, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Repair operations"
          description="Intake, technician assignment, parts, warranty, and customer updates for every job in the shop."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" className="gap-2">
                <ScanLine className="h-4 w-4" />
                Scan job tag
              </Button>
              <Button variant="outline" className="gap-2">
                <QrCode className="h-4 w-4" />
                Print job sheet
              </Button>
              <Button className="gap-2 bg-slate-900 text-white hover:bg-slate-800" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                New repair
              </Button>
            </div>
          }
        />

        <Card className="border-slate-200">
          <CardContent className="flex flex-wrap divide-x divide-slate-200 p-0 px-5">
            <MetricTile label="Active jobs" value={activeJobs} color="#4C5FD5" icon={Wrench} />
            <MetricTile label="Waiting on parts" value={waitingParts} color="#C2790D" icon={Package} />
            <MetricTile label="In quality check" value={qaQueue} color="#7C57C9" icon={ShieldCheck} />
            <MetricTile label="Ready for pickup" value={readyNow} color="#0F8B5F" icon={CheckCircle2} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* Kanban */}
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">Workflow board</CardTitle>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                Updated moments ago
              </span>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto pb-1">
                <div className="grid min-w-[1080px] grid-cols-5 gap-3">
                  {columns.map((column) => {
                    const meta = STATUS_META[column.key];
                    const columnJobs = jobs.filter((job) => job.status === column.key);
                    return (
                      <div key={column.key} className={cn('rounded-lg border border-slate-200 p-2.5', meta.bg)}>
                        <div className="mb-2.5 flex items-center justify-between px-1">
                          <div className="flex items-center gap-1.5">
                            <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
                            <p className={cn('text-xs font-semibold', meta.text)}>{column.label}</p>
                          </div>
                          <span className="font-mono text-xs text-slate-500">{columnJobs.length}</span>
                        </div>

                        <div className="space-y-2">
                          {columnJobs.map((job) => (
                            <TicketCard
                              key={job.id}
                              job={job}
                              selected={job.id === selectedJobId}
                              onSelect={() => {
                                setSelectedJobId(job.id);
                                setDetailTab('overview');
                              }}
                            />
                          ))}
                          {columnJobs.length === 0 && (
                            <div className="rounded-lg border border-dashed border-slate-300 bg-white/60 p-4 text-center text-[11px] text-muted-foreground">
                              No jobs
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detail panel */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-xs text-slate-400">{selectedJob.jobId}</p>
                  <CardTitle className="text-lg">{selectedJob.customerName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{selectedJob.deviceLabel}</p>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 border-none text-white"
                  style={{ backgroundColor: PRIORITY_META[selectedJob.priority].color }}
                >
                  {PRIORITY_META[selectedJob.priority].label}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <Tabs value={detailTab} onValueChange={setDetailTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="parts">Parts</TabsTrigger>
                  <TabsTrigger value="photos">Photos</TabsTrigger>
                  <TabsTrigger value="notify">Notify</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                    <p className="text-xs font-medium text-slate-500">Issue</p>
                    <p className="mt-1 text-slate-700">{selectedJob.issueSummary}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Serial</p>
                      <p className="font-medium text-slate-900">{selectedJob.serial}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Received</p>
                      <p className="font-medium text-slate-900">{selectedJob.createdAt}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Warranty</p>
                      <p className="font-medium text-slate-900">{selectedJob.warrantyStatus.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Deposit paid</p>
                      <p className="font-mono font-medium text-slate-900">{currency(selectedJob.depositPaid)}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="mb-2 text-xs font-medium text-slate-500">Technician</p>
                    <div className="grid grid-cols-2 gap-2">
                      {technicianRoster.map((tech) => (
                        <Button
                          key={tech.name}
                          type="button"
                          size="sm"
                          variant={selectedJob.assignedTechName === tech.name ? 'default' : 'outline'}
                          className="justify-start"
                          onClick={() => setTechnician(tech.name)}
                        >
                          <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[9px] font-bold text-white">
                            {tech.initials}
                          </span>
                          <span className="truncate">{tech.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {selectedJob.status === 'ready' && (
                    <Button
                      type="button"
                      className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => (window.location.href = `/billing?repair=${selectedJob.id}`)}
                    >
                      <CreditCard className="h-4 w-4" />
                      Convert to bill
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </TabsContent>

                <TabsContent value="parts" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    {selectedJob.parts.length === 0 && (
                      <p className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-xs text-muted-foreground">
                        No parts logged yet.
                      </p>
                    )}
                    {selectedJob.parts.map((part) => (
                      <div key={part.name} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                        <div>
                          <p className="font-medium text-slate-900">{part.name}</p>
                          <p className="text-xs text-muted-foreground">Qty {part.quantity}</p>
                        </div>
                        <span className="font-mono font-semibold text-slate-800">{currency(part.quantity * part.unitCost)}</span>
                      </div>
                    ))}
                    {selectedJob.parts.length > 0 && (
                      <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-sm font-semibold text-slate-900">
                        <span>Parts total</span>
                        <span className="font-mono">{currency(partsTotal)}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium text-slate-500">Quick add (from stock)</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {partCatalog.map((part) => (
                        <button
                          key={part.name}
                          type="button"
                          onClick={() => addPartToSelectedJob(part)}
                          className="flex items-center justify-between rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                        >
                          <span>{part.name}</span>
                          <span className="font-mono text-slate-500">{currency(part.unitCost)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="photos" className="mt-4 space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {selectedJob.photos.map((photo, index) => (
                      <div
                        key={`${photo}-${index}`}
                        className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2 text-center text-[11px] font-medium text-slate-600"
                      >
                        {photo}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 text-slate-400 transition hover:border-slate-400 hover:text-slate-600"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="text-[11px]">Add</span>
                    </button>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Related hardware warranty
                    </div>
                    <div className="space-y-2">
                      {soldHardwareWarranty.map((item) => (
                        <div key={item.item} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs">
                          <div>
                            <p className="font-medium text-slate-900">{item.item}</p>
                            <p className="text-muted-foreground">Ends {item.warrantyEnds}</p>
                          </div>
                          <Badge
                            variant={item.status === 'active' ? 'secondary' : item.status === 'expiring' ? 'outline' : 'destructive'}
                            className="capitalize"
                          >
                            {item.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="notify" className="mt-4 space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {(['sms', 'email', 'both'] as NotifyChannel[]).map((channel) => (
                      <Button
                        key={channel}
                        type="button"
                        size="sm"
                        variant={notifyChannel === channel ? 'default' : 'outline'}
                        onClick={() => setNotifyChannel(channel)}
                        className="capitalize"
                      >
                        {channel}
                      </Button>
                    ))}
                  </div>

                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={notifyPrefs.sms} onChange={(e) => setNotifyPrefs((p) => ({ ...p, sms: e.target.checked }))} />
                      SMS update
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={notifyPrefs.email} onChange={(e) => setNotifyPrefs((p) => ({ ...p, email: e.target.checked }))} />
                      Email update
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={notifyPrefs.whatsapp} onChange={(e) => setNotifyPrefs((p) => ({ ...p, whatsapp: e.target.checked }))} />
                      WhatsApp
                    </label>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    {notifyChannel} update will be sent to {selectedJob.customerName} ({selectedJob.customerPhone}) with status and pickup timing.
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                    <CalendarDays className="h-4 w-4 text-slate-500" />
                    {selectedJob.readyNotifiedAt ? `Notified on ${selectedJob.readyNotifiedAt}` : 'Not yet notified'}
                  </div>

                  <Button type="button" className="w-full gap-2">
                    <Bell className="h-4 w-4" />
                    Send status update
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Intake dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Wrench className="h-5 w-5 text-slate-900" />
              New repair intake
            </DialogTitle>
            <DialogDescription>Capture the customer, device, diagnosis, and technician assignment.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddJob} className="space-y-6 pt-2">
            <section className="space-y-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <UserRound className="h-3.5 w-3.5" /> Customer
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="customerName">Name</Label>
                  <Input
                    id="customerName"
                    list="existing-customers"
                    value={form.customerName}
                    onChange={(e) => setField('customerName', e.target.value)}
                    placeholder="Full name"
                  />
                  <datalist id="existing-customers">
                    {existingCustomers.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="98xxxxxxxx" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email (optional)</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="name@email.com" />
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <p className="text-xs font-semibold text-slate-500">Device</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="brand">Brand</Label>
                  <select
                    id="brand"
                    value={form.brandId}
                    onChange={(e) => {
                      const brand = deviceBrands.find((b) => b.id === e.target.value) ?? deviceBrands[0];
                      setField('brandId', brand.id);
                      setField('model', brand.models[0]);
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {deviceBrands.map((brand) => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="model">Model</Label>
                  <select
                    id="model"
                    value={form.model}
                    onChange={(e) => setField('model', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {selectedBrand.models.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="serialNumber">Serial / IMEI</Label>
                  <Input id="serialNumber" value={form.serialNumber} onChange={(e) => setField('serialNumber', e.target.value)} placeholder="Serial or IMEI" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={form.priority}
                    onChange={(e) => setField('priority', e.target.value as RepairPriority)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="issueSummary">Problem description</Label>
                <Textarea
                  id="issueSummary"
                  value={form.issueSummary}
                  onChange={(e) => setField('issueSummary', e.target.value)}
                  rows={3}
                  placeholder="Symptoms, and any previous repair attempts."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="warrantyStatus">Warranty</Label>
                  <select
                    id="warrantyStatus"
                    value={form.warrantyStatus}
                    onChange={(e) => setField('warrantyStatus', e.target.value as MockRepairJob['warrantyStatus'])}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="in_warranty">In warranty</option>
                    <option value="out_of_warranty">Out of warranty</option>
                    <option value="void">Void</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="warrantyEnds">Warranty end</Label>
                  <Input id="warrantyEnds" type="date" value={form.warrantyEnds} onChange={(e) => setField('warrantyEnds', e.target.value)} />
                </div>
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <p className="text-xs font-semibold text-slate-500">Assignment & pricing</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="laborRate">Labor service</Label>
                  <select
                    id="laborRate"
                    value={form.laborRateId}
                    onChange={(e) => setField('laborRateId', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {laborRates.map((rate) => (
                      <option key={rate.id} value={rate.id}>{rate.serviceName} — {currency(rate.basePrice)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="technician">Technician</Label>
                  <select
                    id="technician"
                    value={form.technician}
                    onChange={(e) => setField('technician', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {technicianRoster.map((tech) => (
                      <option key={tech.name} value={tech.name}>{tech.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deposit">Deposit collected (NPR)</Label>
                <Input
                  id="deposit"
                  type="number"
                  min={0}
                  value={form.deposit}
                  onChange={(e) => setField('deposit', Number(e.target.value))}
                />
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">Estimate</p>
                  <Badge variant="outline">{estimate.labor.serviceName}</Badge>
                </div>
                <div className="mt-2 space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Labor</span>
                    <span className="font-mono">{currency(estimate.laborCost)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Deposit</span>
                    <span className="font-mono">{currency(Number(form.deposit || 0))}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-semibold text-slate-900">
                    <span>Total estimate</span>
                    <span className="font-mono">{currency(estimate.total)}</span>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Parts aren't priced yet — add them from the job's Parts tab once it's created.
                </p>
              </div>
            </section>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Internal notes</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => setField('notes', e.target.value)} rows={2} placeholder="Notes for technicians or policy details." />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                <X className="mr-1.5 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit">Create repair job</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default LabPage;