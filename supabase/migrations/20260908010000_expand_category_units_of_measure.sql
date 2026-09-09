-- Keep the database constraint aligned with the unit dropdown used by category
-- and product forms. Existing rows remain unchanged.
alter table public.product_categories
  drop constraint if exists product_categories_default_unit_of_measure_check;

alter table public.product_categories
  add constraint product_categories_default_unit_of_measure_check
  check (default_unit_of_measure in (
    'unit', 'piece', 'set', 'pair', 'dozen', 'pack', 'box', 'bundle', 'roll',
    'sheet', 'meter', 'centimeter', 'millimeter', 'foot', 'inch',
    'square_foot', 'square_meter', 'kilogram', 'gram', 'liter', 'milliliter',
    'thickness'
  ));

notify pgrst, 'reload schema';
