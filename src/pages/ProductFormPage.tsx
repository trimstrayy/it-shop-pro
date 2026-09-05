import { useEffect, useState } from 'react';
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
import { Product } from '@/types';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { ArrowLeft } from 'lucide-react';
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

const ProductFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { products, categories, categoryFieldSchemas, isLoading, error, addProduct, updateProduct, getProduct } = useData();
  const { user } = useAuth();
  
  const existingProduct = id ? getProduct(id) : null;
  const isEditing = !!existingProduct;

  const [formData, setFormData] = useState({
    name: existingProduct?.name || '',
    category: existingProduct?.category || '',
    categoryId: existingProduct?.categoryId || '',
    attributes: existingProduct?.attributes || {},
    unitOfMeasure: existingProduct?.unitOfMeasure || 'unit',
    isCutToOrder: existingProduct?.isCutToOrder || false,
    costPrice: existingProduct?.costPrice || 0,
    sellingPrice: existingProduct?.sellingPrice || 0,
    taxPercent: existingProduct?.taxPercent || 18,
    description: existingProduct?.description || '',
    status: existingProduct?.status || 'active',
    stockQuantity: Number((existingProduct as Product & { stockQuantity?: number })?.stockQuantity ?? 0),
  });
  const [batches, setBatches] = useState<Array<{ id: string; batchCode: string; totalQuantity: number; remainingQuantity: number }>>([]);
  const [batchCode, setBatchCode] = useState('');
  const [batchQuantity, setBatchQuantity] = useState(0);

  const selectedCategory = categories.find(category => category.id === formData.categoryId);
  const dynamicFields = categoryFieldSchemas.filter(field => field.categoryId === formData.categoryId).sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    if (!existingProduct || formData.categoryId || !categories.length) return;
    const matchedCategory = categories.find(category => category.name === existingProduct.category);
    if (matchedCategory) {
      setFormData(current => ({
        ...current,
        categoryId: matchedCategory.id,
        unitOfMeasure: existingProduct.unitOfMeasure || matchedCategory.defaultUnitOfMeasure,
        isCutToOrder: existingProduct.isCutToOrder ?? matchedCategory.defaultIsCutToOrder,
      }));
    }
  }, [categories, existingProduct, formData.categoryId]);

  useEffect(() => {
    if (!existingProduct?.id) return;
    void supabase.from('product_batches').select('id, batch_code, total_quantity, remaining_quantity').eq('product_id', existingProduct.id).order('created_at').then(({ data }) => {
      setBatches((data ?? []).map(batch => ({ id: batch.id, batchCode: batch.batch_code, totalQuantity: Number(batch.total_quantity), remainingQuantity: Number(batch.remaining_quantity) })));
    });
  }, [existingProduct?.id]);

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find(item => item.id === categoryId);
    if (!category) return;
    setFormData(current => ({
      ...current,
      categoryId,
      category: category.name,
      unitOfMeasure: category.defaultUnitOfMeasure,
      isCutToOrder: category.defaultIsCutToOrder,
      attributes: {},
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missingDynamicField = dynamicFields.find(field => formData.attributes[field.fieldKey] === undefined || formData.attributes[field.fieldKey] === '');
    if (!formData.name || !formData.category || !formData.costPrice || !formData.sellingPrice || missingDynamicField) {
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
      categoryId: formData.categoryId || null,
      attributes: formData.attributes,
      unitOfMeasure: formData.unitOfMeasure,
      isCutToOrder: formData.isCutToOrder,
      type: existingProduct?.type || 'hardware',
      stockQuantity: Number(formData.stockQuantity),
      costPrice: Number(formData.costPrice),
      sellingPrice: Number(formData.sellingPrice),
      taxPercent: Number(formData.taxPercent),
      description: formData.description,
      status: formData.status as 'active' | 'inactive',
    };

    if (isEditing) {
      updateProduct(id!, baseProduct);
      await saveBatches(id!);
    } else {
      const savedProduct = await addProduct(baseProduct as any);
      await saveBatches(savedProduct.id);
    }

    toast({
      title: isEditing ? 'Product Updated' : 'Product Created',
      description: `${formData.name} has been ${isEditing ? 'updated' : 'added'} successfully.`,
    });
    navigate('/products');
  };

  const saveBatches = async (productId: string) => {
    if (!formData.isCutToOrder || !batches.length) return;
    const unsavedBatches = batches.filter(batch => !batch.id.startsWith('local-'));
    if (!unsavedBatches.length) return;
    const { error } = await supabase.from('product_batches').insert(unsavedBatches.map(batch => ({
      product_id: productId,
      tenant_id: user?.tenantId,
      batch_code: batch.batchCode,
      total_quantity: batch.totalQuantity,
      remaining_quantity: batch.remainingQuantity,
    })));
    if (error) toast({ title: 'Batch save failed', description: error.message, variant: 'destructive' });
  };

  const addBatch = () => {
    if (!batchCode.trim() || batchQuantity <= 0) return;
    setBatches(current => [...current, { id: `local-${Date.now()}`, batchCode: batchCode.trim(), totalQuantity: batchQuantity, remainingQuantity: batchQuantity }]);
    setBatchCode('');
    setBatchQuantity(0);
  };

  return (
    <AppLayout>
      <PageHeader 
        title={isEditing ? 'Edit Product' : 'Add New Product'}
        description={isEditing ? `Editing ${existingProduct?.name}` : 'Create a new product using tenant-specific category fields'}
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
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading && <SelectItem value="__loading" disabled>Loading categories...</SelectItem>}
                    {!isLoading && error && <SelectItem value="__error" disabled>{error}</SelectItem>}
                    {!isLoading && !error && categories.length === 0 && <SelectItem value="__empty" disabled>No active categories</SelectItem>}
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
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

          {dynamicFields.length > 0 && (
            <Card>
              <CardHeader><CardTitle>{selectedCategory?.name || 'Category'} Details</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {dynamicFields.map(field => (
                  <div key={field.id}>
                    <Label htmlFor={`attribute-${field.fieldKey}`}>{field.fieldLabel}{field.isRequired ? ' *' : ''}</Label>
                    {field.fieldType === 'select' ? (
                      <Select
                        value={String(formData.attributes[field.fieldKey] ?? '')}
                        onValueChange={(value) => setFormData(current => ({ ...current, attributes: { ...current.attributes, [field.fieldKey]: value } }))}
                      >
                        <SelectTrigger id={`attribute-${field.fieldKey}`}><SelectValue placeholder={`Select ${field.fieldLabel}`} /></SelectTrigger>
                        <SelectContent>{field.fieldOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={`attribute-${field.fieldKey}`}
                        type={field.fieldType}
                        value={String(formData.attributes[field.fieldKey] ?? '')}
                        onChange={(event) => setFormData(current => ({ ...current, attributes: { ...current.attributes, [field.fieldKey]: field.fieldType === 'number' ? Number(event.target.value) : event.target.value } }))}
                        required={field.isRequired}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

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

          <Card>
            <CardHeader><CardTitle>Inventory Details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="stockQuantity">Stock Quantity</Label>
                <Input id="stockQuantity" type="number" min="0" value={formData.stockQuantity} onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })} />
              </div>
                <div>
                  <Label htmlFor="unitOfMeasure">Unit of measure</Label>
                  <Input id="unitOfMeasure" value={formData.unitOfMeasure} onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })} />
                </div>
                <div className="flex items-center justify-between sm:col-span-2">
                  <div><Label>Cut to order</Label><p className="text-sm text-muted-foreground">Manage stock as batches or rolls</p></div>
                  <Switch checked={formData.isCutToOrder} onCheckedChange={(checked) => setFormData({ ...formData, isCutToOrder: checked })} />
                </div>
            </CardContent>
          </Card>

          {formData.isCutToOrder && (
            <Card>
              <CardHeader><CardTitle>Product Batches</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input placeholder="Batch or roll code" value={batchCode} onChange={(event) => setBatchCode(event.target.value)} />
                  <Input type="number" min="0" placeholder="Total quantity" value={batchQuantity || ''} onChange={(event) => setBatchQuantity(Number(event.target.value))} />
                  <Button type="button" variant="outline" onClick={addBatch}>Add batch</Button>
                </div>
                {batches.length > 0 && <div className="space-y-2">{batches.map(batch => <div key={batch.id} className="flex justify-between rounded-md border p-3 text-sm"><span>{batch.batchCode}</span><span>{batch.remainingQuantity} / {batch.totalQuantity} remaining</span></div>)}</div>}
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You have unsaved changes. This action will exit the form and all current edits will be lost unless you confirm.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep editing</AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button type="button" variant="destructive" onClick={() => navigate('/products')}>Discard</Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
