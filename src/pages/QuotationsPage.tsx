import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Eye, FileText, ArrowRight, Filter } from 'lucide-react';
import { Quotation } from '@/types';
import { format } from 'date-fns';

const QuotationsPage = () => {
  const { quotations } = useData();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredQuotations = statusFilter === 'all' 
    ? quotations 
    : quotations.filter(q => q.status === statusFilter);

  const columns = [
    {
      key: 'quotationNumber',
      header: 'Quotation #',
      cell: (quotation: Quotation) => (
        <span className="font-mono text-sm text-primary font-medium">{quotation.quotationNumber}</span>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      cell: (quotation: Quotation) => (
        <div>
          <p className="font-medium">{quotation.clientName}</p>
          <p className="text-xs text-muted-foreground">{quotation.clientEmail}</p>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      cell: (quotation: Quotation) => (
        <span>{quotation.items.length} item(s)</span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      cell: (quotation: Quotation) => (
        <span className="font-medium">${quotation.grandTotal.toLocaleString()}</span>
      ),
    },
    {
      key: 'validUntil',
      header: 'Valid Until',
      cell: (quotation: Quotation) => (
        <span className="text-sm">
          {format(new Date(quotation.validUntil), 'MMM dd, yyyy')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (quotation: Quotation) => (
        <StatusBadge status={quotation.status} variant={getStatusVariant(quotation.status)} />
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      cell: (quotation: Quotation) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(quotation.createdAt), 'MMM dd, yyyy')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (quotation: Quotation) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/quotations/${quotation.id}`}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/quotations/${quotation.id}/preview`}>
                <FileText className="w-4 h-4 mr-2" />
                Preview Quotation
              </Link>
            </DropdownMenuItem>
            {(quotation.status === 'sent' || quotation.status === 'accepted') && (
              <DropdownMenuItem asChild>
                <Link to={`/quotations/${quotation.id}/convert`}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Convert to Invoice
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: 'w-12',
    },
  ];

  return (
    <AppLayout>
      <PageHeader 
        title="Quotations"
        description="Create and manage customer quotations"
        actions={
          <Link to="/quotations/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Quotation
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-card rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter:</span>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>

        {statusFilter !== 'all' && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            Clear Filter
          </Button>
        )}
      </div>

      <DataTable
        data={filteredQuotations}
        columns={columns}
        searchable
        searchPlaceholder="Search quotations..."
        searchKeys={['quotationNumber', 'clientName', 'clientEmail']}
        pageSize={10}
        emptyMessage="No quotations found"
      />
    </AppLayout>
  );
};

export default QuotationsPage;
