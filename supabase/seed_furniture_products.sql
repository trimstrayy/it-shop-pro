-- Seed the furniture tenants' product catalog.
-- Safe to run more than once: existing tenant/category/product-name rows are skipped.
-- Product variants and specifications are stored in description because the
-- linked products table currently has no attributes JSONB column.

with catalog(category_name, product_name, details, is_fallback) as (
  values
    ('PVC Carpet', 'Janaki Classic', 'Thickness: 0.35 mm', false),
    ('PVC Carpet', 'Micro Luxe', 'Thickness: 0.5 mm', false),
    ('PVC Carpet', 'Mini Luxe', 'Thickness: 0.6 mm', false),
    ('PVC Carpet', 'Luxe', 'Thickness: 1.1 mm', false),
    ('PVC Carpet', 'Coxy Soft', 'Thickness: 1.5 mm', false),
    ('Heritage Carpet', 'Heritage Ribbed Diamond', '', false),
    ('Heritage Carpet', 'Heritage Ribbed Red', '', false),
    ('Heritage Carpet', 'Heritage Ribbed Green', '', false),
    ('Heritage Carpet', 'Heritage Silver Maroon', '', false),
    ('Heritage Carpet', 'Heritage Silver Gray', '', false),
    ('Berlin Carpet', 'Berlin Red', '', false),
    ('Berlin Carpet', 'Berlin Gray', '', false),
    ('Dynasty Deluxe Carpet', 'Dynasty Cherry', '', false),
    ('Dynasty Deluxe Carpet', 'Dynasty Brown', '', false),
    ('Graphic Carpet', 'Graphic Peal Red', '', false),
    ('Graphic Carpet', 'Graphic Peal Gray', '', false),
    ('Graphic Carpet', 'Graphic Azzura Brown', '', false),
    ('Graphic Carpet', 'Graphic Azzura Blue', '', false),
    ('Havana Carpet', 'Havana Beige', '', false),
    ('Marina Carpet', 'Marina Red', '', false),
    ('Lapis Gray', 'Lapis Gray', '', true),
    ('Mattress', 'Starlife Bonded EPE Foam', 'Warranty: 2 Years', false),
    ('Mattress', 'Gemini Bonded EPE Bonded', 'Warranty: 5 Years', false),
    ('Mattress', 'Nova Bonded', 'Warranty: 10 Years', false),
    ('Mattress', 'Nova (P.T) Bonded', 'Warranty: 10 Years', false),
    ('Mattress', 'Sagun Spring', 'Warranty: 10 Years', false),
    ('Mattress', 'Sagun (P.T) Spring', 'Warranty: 10 Years', false),
    ('Mattress', 'PE Foam Royal Mattress', 'Warranty: 2 Years', false),
    ('RJ Velvet Galaicha', 'RJ Velvet Galaicha', 'Dimensions: 60x180, 80x180, 120x180, 160x200, 200x300', true),
    ('Bubble Rabbit Fur Galaicha', 'Bubble Rabbit Fur Galaicha', 'Dimensions: 60x180, 120x180, 160x200, 200x300', true),
    ('Ultimate Roll Mat', 'Red', 'Size: 2 FT', false),
    ('Ultimate Roll Mat', 'Green', 'Size: 4 FT', false),
    ('Ultimate Pyramid Mat', '2 FT Green', '', false),
    ('Dining Table Mat', 'Dining Table Mat', 'Thickness: 1.1 mm', true),
    ('PE Foam', '8 mm', '', false),
    ('PE Foam', '12 mm', '', false),
    ('Bed Sheet', '3 Set', '', false),
    ('Bed Sheet', '4 Set', '', false),
    ('Kitchen Mat', 'Kitchen Mat', '', true),
    ('Bathroom Mat', 'Rectangular', '', false),
    ('Bathroom Mat', 'Oval', '', false),
    ('Door Mat', '18x30', '', false),
    ('Door Mat', '18x24', '', false),
    ('Wooden Study Table', 'Wooden Study Table', '', true),
    ('N. Key Holder', 'N. Key Holder', '', true),
    ('Stool', 'Mg Rattan Stool', '', false),
    ('Chair', 'BC 010', '', false),
    ('Chair', 'CM 03', '', false),
    ('Chair', 'VCH 07', '', false),
    ('Chair', 'NC 01', '', false),
    ('Chair', 'CP 103', '', false),
    ('Chair', 'CP 104', '', false),
    ('Chair', 'VC 107', '', false),
    ('Chair', 'Tool 1', '', false),
    ('Wardrobe', 'Wardrobe', '', true),
    ('Normal Bed', 'Normal Bed', '', true),
    ('Hydraulic Bed', 'Hydraulic Bed', '', true),
    ('Dressing Table', 'Dressing Table', '', true),
    ('Study Table', 'With Compartment', '', false),
    ('Study Table', 'Without Compartment', '', false),
    ('Office Table', '4 FT', '', false),
    ('Office Table', '5 FT', '', false),
    ('TV Stand', '5 FT', '', false),
    ('TV Stand', '6 FT', '', false),
    ('Shoe Rack', 'Shoe Rack', '', true),
    ('Tea Table', 'With Drawer', '', false),
    ('Tea Table', 'Without Drawer', '', false),
    ('File Cabinet', 'File Cabinet', '', true),
    ('Show Rack', '4 FT', '', false),
    ('Show Rack', '5 FT', '', false),
    ('Sofa', '7 Seater', '', false),
    ('Pillow', '17/27 Inch', '', false),
    ('Parda', 'Cotton Parda', '', false),
    ('Parda', 'Normal', '', false),
    ('Parda Pipe Steel', 'Parda Pipe Steel', '', true),
    ('S.S Double Bracket', 'S.S Double Bracket', '', true),
    ('S.S Single Bracket', 'S.S Single Bracket', '', true),
    ('Zing Bracket', 'Zing Bracket', '', true),
    ('PVC Parda Pipe', 'PVC Parda Pipe', '', true),
    ('PVC Finel', 'PVC Finel', '', true),
    ('S.S Finel', 'S.S Finel', '', true)
)
insert into public.products (
  tenant_id,
  category_id,
  name,
  category,
  type,
  cost_price,
  selling_price,
  tax_percent,
  status,
  description,
  stock_quantity
)
select
  tenant.id,
  category.id,
  catalog.product_name,
  category.name,
  null,
  0,
  0,
  0,
  'active'::product_status,
  nullif(catalog.details, ''),
  0
from public.tenants tenant
join public.product_categories category
  on category.tenant_id = tenant.id
join catalog
  on lower(catalog.category_name) = lower(category.name)
where lower(tenant.business_name) like '%furniture%'
  and category.is_active = true
  and (
    not catalog.is_fallback
    or not exists (
      select 1
      from public.products existing_category_product
      where existing_category_product.tenant_id = tenant.id
        and existing_category_product.category_id = category.id
    )
  )
  and not exists (
    select 1
    from public.products existing_product
    where existing_product.tenant_id = tenant.id
      and existing_product.category_id = category.id
      and lower(existing_product.name) = lower(catalog.product_name)
  );
