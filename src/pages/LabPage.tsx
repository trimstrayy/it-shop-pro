import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { RepairJob, User } from '@/types';
import {
  ArrowUpRight,
  Clock3,
  QrCode,
  ScanLine,
  ShieldCheck,
  Wrench,
  BatteryCharging,
  Droplets,
  ClipboardList,
  AlertTriangle,
  Sparkles,
  Users,
  FileText
} from 'lucide-react';

type LabStatus = 'To Do' | 'In Progress' | 'Waiting for Parts' | 'Quality Check' | 'Ready';

const columns: LabStatus[] = ['To Do', 'In Progress', 'Waiting for Parts', 'Quality Check', 'Ready'];

interface LabJobView {
  id: string;
  customer: string;
  device: string;
  issue: string;
  technician: string;
  estimate: string;
  status: LabStatus;
  priority: 'normal' | 'high';
  note: string;
}

const LabPage = () => {
  const [jobs, setJobs] = useState<LabJobView[]>([]);
  const [activityLog, setActivityLog] = useState<{ time: string; title: string; detail: string }[]>([]);
  const [technicianRoster, setTechnicianRoster] = useState<{ name: string; initials: string; skill: string }[]>([]);

  useEffect(() => {
    const loadLabData = async () => {
      const [jobsResult, techniciansResult, updatesResult] = await Promise.all([
        supabase.from('repair_jobs').select('id, job_id, status, priority, estimated_cost, issue_summary, public_update, assigned_tech_id, customer_id, updated_at, created_at').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, name, email, role').eq('role', 'technician').order('name'),
        supabase.from('repair_job_updates').select('job_id, logged_at, note, visibility').order('logged_at', { ascending: false }).limit(10),
      ]);

      const technicianRows = techniciansResult.data || [];
      setTechnicianRoster(technicianRows.map((tech) => ({
        name: tech.name,
        initials: tech.name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2),
        skill: tech.email.includes('tech1') ? 'Display & Diagnostics' : tech.email.includes('tech2') ? 'Power & Battery' : 'Board-Level Repair',
      })));

      setJobs((jobsResult.data || []).map((job, index) => ({
        id: job.job_id,
        customer: job.customer_id || 'Customer',
        device: job.issue_summary || 'Repair job',
        issue: job.public_update || job.issue_summary || 'Service in progress',
        technician: technicianRows.find((tech) => tech.id === job.assigned_tech_id)?.name || 'Unassigned',
        estimate: `$${Number(job.estimated_cost ?? 0).toLocaleString()}`,
        status: job.status === 'to_do' ? 'To Do' : job.status === 'in_progress' ? 'In Progress' : job.status === 'waiting_for_parts' ? 'Waiting for Parts' : job.status === 'quality_check' ? 'Quality Check' : 'Ready',
        priority: job.priority === 'urgent' || (job.priority === 'high' && index === 0) ? 'high' : 'normal',
        note: job.public_update || job.issue_summary || 'Awaiting technician update.',
      })));

      setActivityLog((updatesResult.data || []).map((update) => ({
        time: new Date(update.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: update.note.slice(0, 40),
        detail: update.visibility === 'public' ? 'Customer-visible update' : 'Internal technician note',
      })));
    };

    void loadLabData();
  }, []);

  const selectedJob = jobs[0];
  const activeJobs = jobs.filter((job) => job.status !== 'Ready').length;
  const waitingParts = jobs.filter((job) => job.status === 'Waiting for Parts').length;
  const qaQueue = jobs.filter((job) => job.status === 'Quality Check').length;
  const readyNow = jobs.filter((job) => job.status === 'Ready').length;

  return (
    <AppLayout>
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6 lg:p-8 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.28)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_24%)]" />
        <div className="relative">
          <PageHeader
            title="Lab Command Center"
            description="Technician-only workflow for intake, repair tracking, QR scan access, and final quality control."
            actions={(
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" className="gap-2">
                  <ScanLine className="w-4 h-4" />
                  Scan QR Job Tag
                </Button>
                <Button className="gap-2 bg-slate-950 text-white hover:bg-slate-800">
                  <QrCode className="w-4 h-4" />
                  Print Dual Receipt
                </Button>
              </div>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <StatCard title="Active Jobs" value={activeJobs} subtitle="Board items in motion" icon={ClipboardList} variant="primary" />
            <StatCard title="Waiting for Parts" value={waitingParts} subtitle="Inventory follow-up required" icon={BatteryCharging} variant="warning" />
            <StatCard title="Quality Check" value={qaQueue} subtitle="Needs final validation" icon={ShieldCheck} variant="success" />
            <StatCard title="Ready for Pickup" value={readyNow} subtitle="SMS + email triggered" icon={Sparkles} variant="default" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
            <Card className="border-border/70 shadow-sm bg-white/90 backdrop-blur">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">Kanban Board</CardTitle>
                    <p className="text-sm text-muted-foreground">Drag logic can be wired here later; this is the live technician view.</p>
                  </div>
                  <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
                    <Clock3 className="w-3.5 h-3.5" />
                    SLA monitor active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto pb-2">
                  <div className="grid min-w-[1200px] grid-cols-5 gap-4">
                    {columns.map((column) => {
                      const columnJobs = jobs.filter((job) => job.status === column);

                      return (
                        <div key={column} className="rounded-2xl border border-border bg-slate-50/80 p-3">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-semibold text-sm text-slate-900">{column}</p>
                              <p className="text-xs text-muted-foreground">{columnJobs.length} jobs</p>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
                              {columnJobs.length}
                            </div>
                          </div>

                          <div className="space-y-3">
                            {columnJobs.map((job) => (
                              <div key={job.id} className={cn(
                                'rounded-xl border p-4 shadow-sm transition-transform hover:-translate-y-0.5',
                                job.priority === 'high' ? 'border-amber-200 bg-amber-50/70' : 'border-slate-200 bg-white'
                              )}>
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-sm text-slate-900">{job.id}</p>
                                    <p className="text-xs text-muted-foreground">{job.customer}</p>
                                  </div>
                                  <Badge variant={job.priority === 'high' ? 'destructive' : 'outline'} className="rounded-full">
                                    {job.priority === 'high' ? 'High' : 'Normal'}
                                  </Badge>
                                </div>

                                <div className="mt-3 space-y-2 text-sm">
                                  <div className="flex items-center gap-2 text-slate-700">
                                    <Wrench className="w-4 h-4 text-slate-500" />
                                    <span>{job.device}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-700">
                                    <ArrowUpRight className="w-4 h-4 text-slate-500" />
                                    <span>{job.issue}</span>
                                  </div>
                                </div>

                                <Separator className="my-3" />

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>Assigned to {job.technician}</span>
                                  <span>{job.estimate}</span>
                                </div>
                                <p className="mt-2 text-xs leading-5 text-slate-600">{job.note}</p>
                              </div>
                            ))}
                            {columnJobs.length === 0 && (
                              <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-xs text-muted-foreground">
                                No jobs in this stage.
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

            <div className="space-y-6">
              <Card className="border-border/70 shadow-sm bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Selected Job
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{selectedJob?.id}</p>
                        <p className="text-xs text-muted-foreground">QR job tag and intake summary</p>
                      </div>
                      <Badge variant="secondary">Live</Badge>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-slate-700">
                      <p><span className="font-medium">Customer:</span> {selectedJob?.customer}</p>
                      <p><span className="font-medium">Device:</span> {selectedJob?.device}</p>
                      <p><span className="font-medium">Technician:</span> {selectedJob?.technician}</p>
                      <p><span className="font-medium">Estimate:</span> {selectedJob?.estimate}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="justify-start gap-2">
                      <QrCode className="w-4 h-4" />
                      Open Job
                    </Button>
                    <Button variant="outline" className="justify-start gap-2">
                      <ScanLine className="w-4 h-4" />
                      Update Status
                    </Button>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <Droplets className="w-4 h-4 text-sky-600" />
                      Notes
                    </div>
                    <p className="mt-2 text-sm text-slate-600 leading-6">
                      Internal note: keep photos attached for visual evidence, and move the job to Ready only after pickup message is sent.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    Activity Log
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activityLog.map((entry) => (
                    <div key={entry.time + entry.title} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="mt-0.5 rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white">
                        {entry.time}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{entry.title}</p>
                        <p className="text-xs text-muted-foreground leading-5">{entry.detail}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5 text-emerald-600" />
                    Technician Roster
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {technicianRoster.map((tech) => (
                    <div key={tech.name} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-slate-900 text-white">{tech.initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900">{tech.name}</p>
                        <p className="text-xs text-muted-foreground">{tech.skill}</p>
                      </div>
                      <Badge variant="outline" className="rounded-full">
                        Available
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default LabPage;