import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { PRODUCT_CATEGORIES, ProductType, LicenseType, HardwareProduct, SoftwareProduct } from '@/types';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

const ProductFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { products, addProduct, updateProduct, getProduct } = useData();
  const { user } = useAuth();
  
  const existingProduct = id ? getProduct(id) : null;
  const isEditing = !!existingProduct;

  const [formData, setFormData] = useState({
    name: existingProduct?.name || '',
    category: existingProduct?.category || '',
    type: (existingProduct?.type || 'hardware') as ProductType,
    costPrice: existingProduct?.costPrice || 0,
    sellingPrice: existingProduct?.sellingPrice || 0,
    taxPercent: existingProduct?.taxPercent || 18,
    description: existingProduct?.description || '',
    status: existingProduct?.status || 'active',
    // Hardware fields
    stockQuantity: (existingProduct as HardwareProduct)?.stockQuantity || 0,
    supplier: (existingProduct as HardwareProduct)?.supplier || '',
    warrantyPeriod: (existingProduct as HardwareProduct)?.warrantyPeriod || 12,
    // Software fields
    licenseType: ((existingProduct as SoftwareProduct)?.licenseType || 'single') as LicenseType,
    licenseQuantity: (existingProduct as SoftwareProduct)?.licenseQuantity || 0,
    expiryDate: (existingProduct as SoftwareProduct)?.expiryDate 
      ? new Date((existingProduct as SoftwareProduct).expiryDate!).toISOString().split('T')[0]
      : '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.costPrice || !formData.sellingPrice) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const baseProduct = {
      name: formData.name,
      category: formData.category,
      type: formData.type,
      costPrice: Number(formData.costPrice),
      sellingPrice: Number(formData.sellingPrice),
      taxPercent: Number(formData.taxPercent),
      description: formData.description,
      status: formData.status as 'active' | 'inactive',
    };

    if (formData.type === 'hardware') {
      const hardwareProduct = {
        ...baseProduct,
        type: 'hardware' as const,
        stockQuantity: Number(formData.stockQuantity),
        supplier: formData.supplier,
        warrantyPeriod: Number(formData.warrantyPeriod),
      };

      if (isEditing) {
        updateProduct(id!, hardwareProduct);
      } else {
        addProduct(hardwareProduct as any);
      }
    } else {
      const softwareProduct = {
        ...baseProduct,
        type: 'software' as const,
        licenseType: formData.licenseType,
        licenseQuantity: Number(formData.licenseQuantity),
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
      };

      if (isEditing) {
        updateProduct(id!, softwareProduct);
      } else {
        addProduct(softwareProduct as any);
      }
    }

    toast({
      title: isEditing ? 'Product Updated' : 'Product Created',
      description: `${formData.name} has been ${isEditing ? 'updated' : 'added'} successfully.`,
    });
    navigate('/products');
  };

  return (
    <AppLayout>
      <PageHeader 
        title={isEditing ? 'Edit Product' : 'Add New Product'}
        description={isEditing ? `Editing ${existingProduct?.name}` : 'Create a new hardware or software product'}
        actions={
          <Button variant="outline" onClick={() => navigate('/products')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Product Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: ProductType) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="costPrice">Cost Price ($) *</Label>
                <Input
                  id="costPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="sellingPrice">Selling Price ($) *</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="taxPercent">Tax (%)</Label>
                <Input
                  id="taxPercent"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.taxPercent}
                  onChange={(e) => setFormData({ ...formData, taxPercent: parseFloat(e.target.value) || 0 })}
                />
              </div>

              {formData.sellingPrice > 0 && formData.costPrice > 0 && (
                <div className="sm:col-span-3 p-4 bg-success/10 rounded-lg">
                  <p className="text-sm text-success font-medium">
                    Profit Margin: ${(formData.sellingPrice - formData.costPrice).toFixed(2)} 
                    ({((formData.sellingPrice - formData.costPrice) / formData.sellingPrice * 100).toFixed(1)}%)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hardware-specific fields */}
          {formData.type === 'hardware' && (
            <Card>
              <CardHeader>
                <CardTitle>Hardware Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="stockQuantity">Stock Quantity</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Enter supplier name"
                  />
                </div>

                <div>
                  <Label htmlFor="warrantyPeriod">Warranty (months)</Label>
                  <Input
                    id="warrantyPeriod"
                    type="number"
                    min="0"
                    value={formData.warrantyPeriod}
                    onChange={(e) => setFormData({ ...formData, warrantyPeriod: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Software-specific fields */}
          {formData.type === 'software' && (
            <Card>
              <CardHeader>
                <CardTitle>Software Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="licenseType">License Type</Label>
                  <Select 
                    value={formData.licenseType} 
                    onValueChange={(value: LicenseType) => setFormData({ ...formData, licenseType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select license type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single User</SelectItem>
                      <SelectItem value="multi-user">Multi-User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="licenseQuantity">License Quantity</Label>
                  <Input
                    id="licenseQuantity"
                    type="number"
                    min="0"
                    value={formData.licenseQuantity}
                    onChange={(e) => setFormData({ ...formData, licenseQuantity: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <Label htmlFor="expiryDate">Expiry Date (optional)</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Active Status</Label>
                  <p className="text-sm text-muted-foreground">Enable or disable this product</p>
                </div>
                <Switch
                  checked={formData.status === 'active'}
                  onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? 'active' : 'inactive' })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/products')}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </div>
      </form>
    </AppLayout>
  );
};

export default ProductFormPage;
