import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
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
import { Plus, MoreHorizontal, Edit, Archive, Eye, Filter, Printer, Trash2, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react';
import { Product, getProductQuantity, getProductQuantityLabel } from '@/types';
import { toast } from '@/hooks/use-toast';
import { LabelPrintDialog } from '@/components/LabelPrintDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const ProductsPage = () => {
  const { products, categories, archiveProduct, deleteProduct } = useData();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productSearch, setProductSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showLabelPrint, setShowLabelPrint] = useState(false);

  const filteredProducts = products.filter(product => {
    if (typeFilter !== 'all' && product.type !== typeFilter) return false;
    if (categoryFilter !== 'all' && product.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && product.status !== statusFilter) return false;
    const search = productSearch.trim().toLowerCase();
    if (search && ![product.name, product.productCode, product.barcode, product.category].some(value => value.toLowerCase().includes(search))) return false;
    return true;
  });

  const categoryGroups = useMemo(() => {
    const groups = categories.map(category => ({
      id: category.id,
      name: category.name,
      products: filteredProducts.filter(product => product.categoryId === category.id || product.category === category.name),
    }));
    const knownCategoryNames = new Set(categories.map(category => category.name));
    const uncategorized = filteredProducts.filter(product => !knownCategoryNames.has(product.category));
    if (uncategorized.length) groups.push({ id: 'other-categories', name: 'Other Categories', products: uncategorized });
    return groups;
  }, [categories, filteredProducts]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(current => {
      const next = new Set(current);
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });
  };

  const handleArchive = (product: Product) => {
    archiveProduct(product.id);
    toast({
      title: 'Product Archived',
      description: `${product.name} has been archived.`,
    });
  };

  const handleDelete = (product: Product) => {
    deleteProduct(product.id);
    toast({
      title: 'Product Removed',
      description: `${product.name} has been permanently removed.`,
      variant: 'destructive',
    });
  };

  const getStockDisplay = (product: Product) => {
    const quantity = getProductQuantity(product);
    const label = getProductQuantityLabel(product);
    if (quantity === 0) return <StatusBadge status={product.type === 'software' ? 'No Licenses' : 'Out of Stock'} variant="danger" />;
    if (quantity <= 5) return <StatusBadge status={`${quantity} ${label}`} variant="warning" />;
    return <span className="text-foreground">{quantity} {label}</span>;
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
      cell: (product: Product) => product.type ? (
        <StatusBadge status={product.type} variant={product.type === 'hardware' ? 'info' : 'success'} />
      ) : <span className="text-sm text-muted-foreground">{product.category}</span>,
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(event) => event.preventDefault()} className="text-warning-foreground">
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive product?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark {product.name} as inactive. This action requires your confirmation.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button type="button" variant="default" onClick={() => handleArchive(product)}>Confirm</Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(event) => event.preventDefault()} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Product
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this product?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove {product.name} from the inventory. This action cannot be undone unless you restore it from a backup.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button type="button" variant="destructive" onClick={() => handleDelete(product)}>Delete</Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
            {categories.map(category => (
              <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
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

      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Input
            value={productSearch}
            onChange={(event) => setProductSearch(event.target.value)}
            placeholder="Search products across categories..."
          />
        </div>

        {categoryGroups.map(category => {
          const isExpanded = expandedCategories.has(category.id);
          return (
            <Card key={category.id} className="overflow-hidden">
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-muted/40"
                aria-expanded={isExpanded}
              >
                <span className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="h-5 w-5 text-primary" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                  <FolderOpen className="h-5 w-5 text-primary" />
                  <span>
                    <span className="block font-semibold">{category.name}</span>
                    <span className="block text-sm text-muted-foreground">{category.products.length} product{category.products.length === 1 ? '' : 's'}</span>
                  </span>
                </span>
                <span className="text-sm text-muted-foreground">{isExpanded ? 'Hide products' : 'View products'}</span>
              </button>

              {isExpanded && (
                <div className="border-t border-border p-4">
                  <DataTable
                    data={category.products}
                    columns={columns}
                    searchable={false}
                    pageSize={10}
                    emptyMessage="No products in this category match the current filters."
                  />
                </div>
              )}
            </Card>
          );
        })}

        {categoryGroups.length === 0 && (
          <Card><div className="p-12 text-center text-muted-foreground">No categories or products match the current filters.</div></Card>
        )}
      </div>

      <LabelPrintDialog 
        open={showLabelPrint} 
        onOpenChange={setShowLabelPrint} 
        products={products} 
      />
    </AppLayout>
  );
};

export default ProductsPage;
