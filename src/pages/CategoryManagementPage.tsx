import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { ProductCategory, CategoryFieldSchema, CategoryFieldType } from '@/types';
import { UNIT_OF_MEASURE_OPTIONS } from '@/lib/units-of-measure';

const CategoryManagementPage = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [fields, setFields] = useState<CategoryFieldSchema[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('unit');
  const [cutToOrder, setCutToOrder] = useState(false);
  const [fieldKey, setFieldKey] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<CategoryFieldType>('text');
  const [fieldOptions, setFieldOptions] = useState('');
  const [fieldRequired, setFieldRequired] = useState(false);

  const load = async () => {
    const { data: categoryRows, error: categoryError } = await supabase.from('product_categories').select('*').eq('tenant_id', user.tenantId).order('sort_order');
    const categoryIds = (categoryRows ?? []).map(row => row.id);
    const { data: fieldRows, error: fieldError } = categoryIds.length
      ? await supabase.from('category_field_schemas').select('*').in('category_id', categoryIds).order('sort_order')
      : { data: [], error: null };
    if (categoryError || fieldError) {
      toast({ title: 'Unable to load categories', description: categoryError?.message || fieldError?.message, variant: 'destructive' });
      return;
    }
    setCategories((categoryRows ?? []).map(row => ({
      id: row.id, name: row.name || row.category_name || row.category, defaultUnitOfMeasure: row.default_unit_of_measure || 'unit',
      defaultIsCutToOrder: Boolean(row.default_is_cut_to_order), sortOrder: Number(row.sort_order ?? 0), isActive: Boolean(row.is_active),
    })));
    setFields((fieldRows ?? []).map(row => ({
      id: row.id, categoryId: row.category_id, fieldKey: row.field_key, fieldLabel: row.field_label,
      fieldType: row.field_type, fieldOptions: Array.isArray(row.field_options) ? row.field_options : [],
      isRequired: Boolean(row.is_required), sortOrder: Number(row.sort_order ?? 0), isActive: row.is_active === undefined ? true : Boolean(row.is_active),
    })));
  };

  useEffect(() => { void load(); }, []);

  if (!user) return <Navigate to="/login" replace />;
  if (user.isPlatformAdmin || user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const selectedCategory = categories.find(category => category.id === selectedId);
  const selectedFields = fields.filter(field => field.categoryId === selectedId).sort((a, b) => a.sortOrder - b.sortOrder);

  const saveCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = { name: name.trim(), default_unit_of_measure: unit.trim() || 'unit', default_is_cut_to_order: cutToOrder };
    const result = selectedId
      ? await supabase.from('product_categories').update(payload).eq('id', selectedId).eq('tenant_id', user.tenantId)
      : await supabase.from('product_categories').insert({ ...payload, tenant_id: user.tenantId, sort_order: categories.length, is_active: true });
    if (result.error) toast({ title: 'Category save failed', description: result.error.message, variant: 'destructive' });
    else { toast({ title: selectedId ? 'Category updated' : 'Category added' }); await load(); }
  };

  const selectCategory = (category: ProductCategory) => {
    setSelectedId(category.id); setName(category.name); setUnit(category.defaultUnitOfMeasure); setCutToOrder(category.defaultIsCutToOrder);
  };

  const deactivateCategory = async (category: ProductCategory) => {
    const { error } = await supabase.from('product_categories').update({ is_active: false }).eq('id', category.id).eq('tenant_id', user.tenantId);
    if (error) toast({ title: 'Could not deactivate category', description: error.message, variant: 'destructive' });
    else await load();
  };

  const addField = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId || !fieldKey.trim() || !fieldLabel.trim()) return;
    const { error } = await supabase.from('category_field_schemas').insert({
      category_id: selectedId, field_key: fieldKey.trim(), field_label: fieldLabel.trim(),
      field_type: fieldType, field_options: fieldOptions.split(',').map(value => value.trim()).filter(Boolean),
      is_required: fieldRequired, sort_order: selectedFields.length,
    });
    if (error) toast({ title: 'Field save failed', description: error.message, variant: 'destructive' });
    else { setFieldKey(''); setFieldLabel(''); setFieldOptions(''); setFieldRequired(false); await load(); }
  };

  const removeField = async (field: CategoryFieldSchema) => {
    const { error } = await supabase.from('category_field_schemas').delete().eq('id', field.id);
    if (error) toast({ title: 'Field removal failed', description: error.message, variant: 'destructive' }); else await load();
  };

  const moveField = async (field: CategoryFieldSchema, direction: -1 | 1) => {
    const index = selectedFields.findIndex(item => item.id === field.id);
    const target = selectedFields[index + direction];
    if (!target) return;
    await Promise.all([
      supabase.from('category_field_schemas').update({ sort_order: target.sortOrder }).eq('id', field.id),
      supabase.from('category_field_schemas').update({ sort_order: field.sortOrder }).eq('id', target.id),
    ]);
    await load();
  };

  return <AppLayout>
    <PageHeader title="Category Management" description="Manage tenant categories and their product fields." />
    <div className="grid max-w-6xl gap-6 lg:grid-cols-[280px_1fr]">
      <Card><CardHeader><CardTitle>Categories</CardTitle></CardHeader><CardContent className="space-y-2">
        {categories.map(category => <button key={category.id} type="button" onClick={() => selectCategory(category)} className={`w-full rounded-md border p-3 text-left ${selectedId === category.id ? 'border-primary bg-primary/5' : ''}`}><span className="font-medium">{category.name}</span><span className="block text-xs text-muted-foreground">{category.defaultUnitOfMeasure} · {category.defaultIsCutToOrder ? 'Cut to order' : 'Standard'}{!category.isActive ? ' · Inactive' : ''}</span></button>)}
        <Button variant="outline" className="w-full" onClick={() => { setSelectedId(''); setName(''); setUnit('unit'); setCutToOrder(false); }}><Plus className="mr-2 h-4 w-4" />New category</Button>
      </CardContent></Card>
      <div className="space-y-6">
        <Card><CardHeader><CardTitle>{selectedCategory ? 'Edit Category' : 'Add Category'}</CardTitle></CardHeader><CardContent><form onSubmit={saveCategory} className="grid gap-4 sm:grid-cols-3"><div><Label htmlFor="categoryName">Name</Label><Input id="categoryName" value={name} onChange={event => setName(event.target.value)} required /></div><div><Label htmlFor="categoryUnit">Default unit</Label><select id="categoryUnit" value={unit} onChange={event => setUnit(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" required>{UNIT_OF_MEASURE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div><div className="flex items-center gap-3 pt-6"><Switch checked={cutToOrder} onCheckedChange={setCutToOrder} /><Label>Cut to order</Label></div><div className="flex gap-2 sm:col-span-3"><Button type="submit">Save category</Button>{selectedCategory?.isActive && <Button type="button" variant="outline" onClick={() => void deactivateCategory(selectedCategory)}>Deactivate</Button>}</div></form></CardContent></Card>
        {selectedId && <Card><CardHeader><CardTitle>Dynamic fields for {selectedCategory?.name}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2">{selectedFields.map((field, index) => <div key={field.id} className="flex items-center justify-between rounded-md border p-3"><div><p className="font-medium">{field.fieldLabel}</p><p className="text-xs text-muted-foreground">{field.fieldKey} · {field.fieldType}{field.isRequired ? ' · required' : ''}</p></div><div className="flex gap-1"><Button type="button" size="icon" variant="ghost" disabled={index === 0} onClick={() => void moveField(field, -1)}><ArrowUp className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" disabled={index === selectedFields.length - 1} onClick={() => void moveField(field, 1)}><ArrowDown className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" onClick={() => void removeField(field)}><Trash2 className="h-4 w-4" /></Button></div></div>)}</div><form onSubmit={addField} className="grid gap-3 border-t pt-4 sm:grid-cols-2"><Input placeholder="Field key" value={fieldKey} onChange={event => setFieldKey(event.target.value)} required /><Input placeholder="Field label" value={fieldLabel} onChange={event => setFieldLabel(event.target.value)} required /><select value={fieldType} onChange={event => setFieldType(event.target.value as CategoryFieldType)} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="text">Text</option><option value="number">Number</option><option value="select">Select</option><option value="date">Date</option></select><Input placeholder="Options, comma separated" value={fieldOptions} onChange={event => setFieldOptions(event.target.value)} disabled={fieldType !== 'select'} /><div className="flex items-center gap-2"><Switch checked={fieldRequired} onCheckedChange={setFieldRequired} /><Label>Required</Label></div><Button type="submit"><Plus className="mr-2 h-4 w-4" />Add field</Button></form></CardContent></Card>}
      </div>
    </div>
  </AppLayout>;
};

export default CategoryManagementPage;
