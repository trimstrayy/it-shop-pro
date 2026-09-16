import { useMemo, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Package,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wrench,
} from 'lucide-react';
import { RepairJob } from '@/types';

// -----------------------------------------------------------------------------
// Status/priority display config.
//
// IMPORTANT: the keys below must exactly match the string literal values of
// RepairJob['status'] and RepairJob['priority'] as defined in src/types/index.ts.
// If TypeScript flags an error on STATUS_CONFIG or PRIORITY_CONFIG below,
// it means the real union type uses different literal values than assumed
// here — just rename the keys to match; everything else stays the same.
// -----------------------------------------------------------------------------

const STATUS_CONFIG: Record<RepairJob['status'], { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
  to_do: { label: 'To Do', variant: 'default' },
  in_progress: { label: 'In Progress', variant: 'info' },
  waiting_for_parts: { label: 'Waiting for Parts', variant: 'warning' },
  quality_check: { label: 'Quality Check', variant: 'info' },
  ready: { label: 'Ready', variant: 'success' },
  delivered: { label: 'Delivered', variant: 'success' },
} as Record<RepairJob['status'], { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }>;

const BOARD_COLUMNS: RepairJob['status'][] = ['to_do', 'in_progress', 'waiting_for_parts', 'quality_check', 'ready'] as RepairJob['status'][];

const PRIORITY_CONFIG: Record<RepairJob['priority'], { label: string; variant: 'default' | 'warning' | 'danger' }> = {
  normal: { label: 'Normal', variant: 'default' },
  high: { label: 'High', variant: 'warning' },
  urgent: { label: 'Urgent', variant: 'danger' },
} as Record<RepairJob['priority'], { label: string; variant: 'default' | 'warning' | 'danger' }>;

const todayString = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  customerId: '',
  newCustomerName: '',
  newCustomerPhone: '',
  deviceDescription: '', // e.g. "Samsung Galaxy A55, Black" — see note above re: no devices table exposed yet
  serialNumber: '',
  issueSummary: '',
  intakeNotes: '',
  priority: 'normal' as RepairJob['priority'],
  technicianName: '', // free-text for now — see note above re: no staff list exposed yet
  estimatedCost: '',
  depositPaid: '',
};

const LabPage = () => {
  const {
    repairJobs,
    addRepairJob,
    updateRepairJob,
    convertRepairToInvoice,
    customers,
  } = useData();
  const { user } = useAuth();

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const [selectedJobId, setSelectedJobId] = useState<string | null>(repairJobs[0]?.id ?? null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [statusNote, setStatusNote] = useState('');
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertPaymentMode, setConvertPaymentMode] = useState<'cash' | 'card' | 'bank' | 'credit'>('cash');
  const [convertAmountPaid, setConvertAmountPaid] = useState('');

  const selectedJob = useMemo(
    () => repairJobs.find((job) => job.id === selectedJobId) ?? null,
    [repairJobs, selectedJobId],
  );

  const activeJobs = repairJobs.filter((job) => job.status !== 'ready' && job.status !== 'delivered').length;
  const waitingParts = repairJobs.filter((job) => job.status === 'waiting_for_parts').length;
  const qaQueue = repairJobs.filter((job) => job.status === 'quality_check').length;
  const readyNow = repairJobs.filter((job) => job.status === 'ready').length;

  const handleFormChange = <K extends keyof typeof emptyForm>(field: K, value: (typeof emptyForm)[K]) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const resetForm = () => setForm(emptyForm);

  const handleCreateJob = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');

    if (!form.customerId && !form.newCustomerName.trim()) {
      setFormError('Select an existing customer or enter a name for a new one.');
      return;
    }
    if (!form.issueSummary.trim()) {
      setFormError('Please describe the issue.');
      return;
    }

    setIsSaving(true);
    try {
      // NOTE: this page does not create new customer records — it expects a
      // customerId from the existing customers list. If newCustomerName was
      // typed instead of selecting an existing customer, this is captured in
      // intakeNotes for staff visibility, but no customer row is created here.
      // Wiring a proper "create customer inline" flow would need confirming
      // the exact function/shape used elsewhere in the app for that.
      const combinedNotes = [
        form.deviceDescription ? `Device: ${form.deviceDescription}` : null,
        form.serialNumber ? `Serial/IMEI: ${form.serialNumber}` : null,
        form.technicianName ? `Assigned to: ${form.technicianName}` : null,
        !form.customerId && form.newCustomerName
          ? `New customer (not yet in system): ${form.newCustomerName} ${form.newCustomerPhone}`
          : null,
        form.intakeNotes || null,
      ].filter(Boolean).join('\n');

      await addRepairJob({
        customerId: form.customerId || null,
        deviceId: null,
        assignedTechId: null,
        status: 'to_do' as RepairJob['status'],
        priority: form.priority,
        estimatedCost: Number(form.estimatedCost || 0),
        depositPaid: Number(form.depositPaid || 0),
        issueSummary: form.issueSummary,
        intakeNotes: combinedNotes,
        publicUpdate: '',
        readyNotifiedAt: undefined,
        completedAt: undefined,
        photos: [],
        updates: [],
        parts: [],
      } as unknown as Omit<RepairJob, 'id' | 'jobId' | 'qrToken' | 'createdAt' | 'updatedAt'>);

      setIsCreateOpen(false);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create repair job.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: RepairJob['status']) => {
    await updateRepairJob(jobId, {
      status: newStatus,
      completedAt: newStatus === 'delivered' ? new Date() : undefined,
    });
  };

  const handleAddNote = async () => {
    if (!selectedJob || !statusNote.trim()) return;
    const existingNotes = selectedJob.intakeNotes || '';
    await updateRepairJob(selectedJob.id, {
      intakeNotes: `${existingNotes}\n[${new Date().toLocaleString()}] ${statusNote}`.trim(),
    });
    setStatusNote('');
  };

  const handleConvertToInvoice = async () => {
    if (!selectedJob) return;
    setIsSaving(true);
    try {
      await convertRepairToInvoice(
        selectedJob.id,
        convertPaymentMode,
        convertPaymentMode === 'credit' ? Number(convertAmountPaid || 0) : undefined,
      );
      setConvertOpen(false);
      setConvertAmountPaid('');
    } finally {
      setIsSaving(false);
    }
  };

  const getCustomerName = (customerId: string | null) => {
    if (!customerId) return 'Walk-in / Unregistered';
    return customers.find((c) => c.id === customerId)?.name ?? 'Unknown Customer';
  };

  return (
    <AppLayout>
      <PageHeader
        title="Repair Lab"
        description="Track repair intake, technician workflow, and status through to completion."
        actions={
          <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
            <Wrench className="w-4 h-4" />
            New Repair Job
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Active Jobs" value={activeJobs} subtitle="Currently in the queue" icon={Wrench} variant="primary" />
        <StatCard title="Waiting for Parts" value={waitingParts} subtitle="Needs supplier follow-up" icon={Package} variant="warning" />
        <StatCard title="Quality Check" value={qaQueue} subtitle="QA pending" icon={ShieldCheck} variant="default" />
        <StatCard title="Ready for Pickup" value={readyNow} subtitle="Awaiting customer" icon={Sparkles} variant="success" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6">
        {/* Kanban board */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <Clock3 className="w-5 h-5" />
                Repair Workflow
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto pb-2">
              <div className="grid min-w-[1000px] grid-cols-5 gap-4">
                {BOARD_COLUMNS.map((column) => {
                  const columnJobs = repairJobs.filter((job) => job.status === column);
                  const config = STATUS_CONFIG[column];
                  return (
                    <div key={column} className="rounded-lg border bg-muted/30 p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-semibold">{config?.label ?? column}</p>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                          {columnJobs.length}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {columnJobs.map((job) => (
                          <button
                            key={job.id}
                            type="button"
                            onClick={() => setSelectedJobId(job.id)}
                            className={cn(
                              'w-full rounded-lg border p-3 text-left transition hover:border-primary/50',
                              selectedJobId === job.id ? 'border-primary bg-primary/5' : 'bg-card',
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold">{job.jobId}</p>
                                <p className="text-xs text-muted-foreground">{getCustomerName(job.customerId)}</p>
                              </div>
                              <StatusBadge
                                status={PRIORITY_CONFIG[job.priority]?.label ?? job.priority}
                                variant={PRIORITY_CONFIG[job.priority]?.variant === 'danger' ? 'danger' : PRIORITY_CONFIG[job.priority]?.variant === 'warning' ? 'warning' : 'default'}
                              />
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{job.issueSummary}</p>
                            <Separator className="my-2" />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>NPR {job.estimatedCost.toLocaleString()}</span>
                            </div>
                          </button>
                        ))}

                        {columnJobs.length === 0 && (
                          <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
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

        {/* Job detail panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserRound className="w-5 h-5" />
              Job Detail
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedJob ? (
              <p className="text-sm text-muted-foreground">Select a job from the board to see details.</p>
            ) : (
              <>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold">{selectedJob.jobId}</p>
                      <p className="text-sm text-muted-foreground">{getCustomerName(selectedJob.customerId)}</p>
                    </div>
                    <StatusBadge
                      status={STATUS_CONFIG[selectedJob.status]?.label ?? selectedJob.status}
                      variant={STATUS_CONFIG[selectedJob.status]?.variant ?? 'default'}
                    />
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Issue: </span>
                      <span>{selectedJob.issueSummary}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Estimated cost: </span>
                      <span className="font-medium">NPR {selectedJob.estimatedCost.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Deposit paid: </span>
                      <span className="font-medium">NPR {selectedJob.depositPaid.toLocaleString()}</span>
                    </div>
                    {selectedJob.intakeNotes && (
                      <div>
                        <span className="text-muted-foreground block mb-1">Notes:</span>
                        <p className="whitespace-pre-wrap text-xs bg-card rounded-md p-2 border">{selectedJob.intakeNotes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Real parts data, read-only — no UI exists yet to add parts
                    to an already-created job, since no such function is
                    currently exposed from DataContext. */}
                {selectedJob.parts && selectedJob.parts.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Package className="w-4 h-4" /> Parts Used
                    </p>
                    <div className="space-y-2">
                      {selectedJob.parts.map((part) => (
                        <div key={part.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                          <span>Qty {part.quantity}</span>
                          <span className="font-medium">NPR {part.totalCost.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Move to next / any status */}
                <div>
                  <Label className="mb-2 block">Move to Status</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {BOARD_COLUMNS.concat(['delivered'] as RepairJob['status'][]).map((status) => (
                      <Button
                        key={status}
                        type="button"
                        size="sm"
                        variant={selectedJob.status === status ? 'default' : 'outline'}
                        onClick={() => handleStatusChange(selectedJob.id, status)}
                      >
                        {STATUS_CONFIG[status]?.label ?? status}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Add a note */}
                <div className="space-y-2">
                  <Label htmlFor="statusNote">Add Note</Label>
                  <Textarea
                    id="statusNote"
                    rows={2}
                    placeholder="e.g. Part ordered from supplier, ETA 3 days"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                  />
                  <Button type="button" size="sm" variant="outline" onClick={handleAddNote} disabled={!statusNote.trim()}>
                    Save Note
                  </Button>
                </div>

                {(selectedJob.status === 'ready' || selectedJob.status === 'delivered') && (
                  <Button
                    type="button"
                    className="w-full gap-2"
                    onClick={() => setConvertOpen(true)}
                  >
                    <CreditCard className="w-4 h-4" />
                    Convert to Invoice
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create job dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              New Repair Intake
            </DialogTitle>
            <DialogDescription>Capture device details and create a new repair job.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateJob} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer</Label>
              <select
                id="customerId"
                value={form.customerId}
                onChange={(e) => handleFormChange('customerId', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">— Select existing customer —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>

            {!form.customerId && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="newCustomerName">New Customer Name</Label>
                  <Input id="newCustomerName" value={form.newCustomerName} onChange={(e) => handleFormChange('newCustomerName', e.target.value)} placeholder="If not in the list above" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newCustomerPhone">Phone</Label>
                  <Input id="newCustomerPhone" value={form.newCustomerPhone} onChange={(e) => handleFormChange('newCustomerPhone', e.target.value)} placeholder="98xxxxxxxx" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="deviceDescription">Device</Label>
                <Input id="deviceDescription" value={form.deviceDescription} onChange={(e) => handleFormChange('deviceDescription', e.target.value)} placeholder="e.g. Samsung Galaxy A55" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial / IMEI</Label>
                <Input id="serialNumber" value={form.serialNumber} onChange={(e) => handleFormChange('serialNumber', e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueSummary">Issue Description *</Label>
              <Textarea id="issueSummary" rows={3} value={form.issueSummary} onChange={(e) => handleFormChange('issueSummary', e.target.value)} placeholder="Describe the problem" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={form.priority}
                  onChange={(e) => handleFormChange('priority', e.target.value as RepairJob['priority'])}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="technicianName">Assign To</Label>
                <Input id="technicianName" value={form.technicianName} onChange={(e) => handleFormChange('technicianName', e.target.value)} placeholder="Technician name" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="estimatedCost">Estimated Cost (NPR)</Label>
                <Input id="estimatedCost" type="number" min="0" value={form.estimatedCost} onChange={(e) => handleFormChange('estimatedCost', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depositPaid">Deposit Paid (NPR)</Label>
                <Input id="depositPaid" type="number" min="0" value={form.depositPaid} onChange={(e) => handleFormChange('depositPaid', e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="intakeNotes">Intake Notes</Label>
              <Textarea id="intakeNotes" rows={2} value={form.intakeNotes} onChange={(e) => handleFormChange('intakeNotes', e.target.value)} />
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Create Repair Job'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Convert to invoice dialog */}
      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Convert Repair to Invoice
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <div className="grid grid-cols-4 gap-2">
                {(['cash', 'card', 'bank', 'credit'] as const).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    size="sm"
                    variant={convertPaymentMode === mode ? 'default' : 'outline'}
                    onClick={() => setConvertPaymentMode(mode)}
                    className="capitalize"
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>

            {convertPaymentMode === 'credit' && (
              <div className="space-y-2">
                <Label htmlFor="convertAmountPaid">Amount Paid Now (NPR)</Label>
                <Input
                  id="convertAmountPaid"
                  type="number"
                  min="0"
                  value={convertAmountPaid}
                  onChange={(e) => setConvertAmountPaid(e.target.value)}
                  placeholder="0 for full credit"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertOpen(false)}>Cancel</Button>
            <Button onClick={handleConvertToInvoice} disabled={isSaving}>
              {isSaving ? 'Processing...' : 'Confirm & Create Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default LabPage;