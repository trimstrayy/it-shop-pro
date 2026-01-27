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
import { Plus, MoreHorizontal, Edit, Archive, Eye, Filter, Printer } from 'lucide-react';
import { Product, HardwareProduct, SoftwareProduct, PRODUCT_CATEGORIES } from '@/types';
import { toast } from '@/hooks/use-toast';
import { LabelPrintDialog } from '@/components/LabelPrintDialog';

const ProductsPage = () => {
  const { products, archiveProduct } = useData();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showLabelPrint, setShowLabelPrint] = useState(false);

  const filteredProducts = products.filter(product => {
    if (typeFilter !== 'all' && product.type !== typeFilter) return false;
    if (categoryFilter !== 'all' && product.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && product.status !== statusFilter) return false;
    return true;
  });

  const handleArchive = (product: Product) => {
    archiveProduct(product.id);
    toast({
      title: 'Product Archived',
      description: `${product.name} has been archived.`,
    });
  };

  const getStockDisplay = (product: Product) => {
    if (product.type === 'hardware') {
      const hw = product as HardwareProduct;
      if (hw.stockQuantity === 0) return <StatusBadge status="Out of Stock" variant="danger" />;
      if (hw.stockQuantity <= 5) return <StatusBadge status={`${hw.stockQuantity} units`} variant="warning" />;
      return <span className="text-foreground">{hw.stockQuantity} units</span>;
    } else {
      const sw = product as SoftwareProduct;
      if (sw.licenseQuantity === 0) return <StatusBadge status="No Licenses" variant="danger" />;
      if (sw.licenseQuantity <= 5) return <StatusBadge status={`${sw.licenseQuantity} licenses`} variant="warning" />;
      return <span className="text-foreground">{sw.licenseQuantity} licenses</span>;
    }
  };

  const columns = [
    {
      key: 'productCode',
      header: 'Code',
      cell: (product: Product) => (
        <span className="font-mono text-sm text-primary">{product.productCode}</span>
      ),
    },
    {
      key: 'name',
      header: 'Product Name',
      cell: (product: Product) => (
        <div>
          <p className="font-medium">{product.name}</p>
          <p className="text-xs text-muted-foreground">{product.category}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (product: Product) => (
        <StatusBadge 
          status={product.type} 
          variant={product.type === 'hardware' ? 'info' : 'success'} 
        />
      ),
    },
    {
      key: 'price',
      header: 'Price',
      cell: (product: Product) => (
        <div>
          <p className="font-medium">NPR {product.sellingPrice.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Cost: NPR {product.costPrice.toLocaleString()}</p>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      cell: (product: Product) => getStockDisplay(product),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (product: Product) => (
        <StatusBadge status={product.status} variant={getStatusVariant(product.status)} />
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (product: Product) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/products/${product.id}`}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/products/${product.id}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Product
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleArchive(product)}
              className="text-destructive"
            >
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: 'w-12',
    },
  ];

  return (
    <AppLayout>
      <PageHeader 
        title="Products"
        description="Manage your hardware and software inventory"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowLabelPrint(true)}>
              <Printer className="w-4 h-4 mr-2" />
              Print Labels
            </Button>
            <Link to="/products/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-card rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="hardware">Hardware</SelectItem>
            <SelectItem value="software">Software</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {PRODUCT_CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {(typeFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all') && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setTypeFilter('all');
              setCategoryFilter('all');
              setStatusFilter('all');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      <DataTable
        data={filteredProducts}
        columns={columns}
        searchable
        searchPlaceholder="Search products..."
        searchKeys={['name', 'productCode', 'barcode', 'category']}
        pageSize={10}
        emptyMessage="No products found"
      />

      <LabelPrintDialog 
        open={showLabelPrint} 
        onOpenChange={setShowLabelPrint} 
        products={products} 
      />
    </AppLayout>
  );
};

export default ProductsPage;
