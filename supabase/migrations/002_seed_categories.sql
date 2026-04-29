-- LumeFin — Migration 002
-- Seed: system bill categories

insert into bill_categories (id, user_id, name, icon, is_system) values
  (gen_random_uuid(), null, 'Energia',     'zap',           true),
  (gen_random_uuid(), null, 'Água',        'droplets',      true),
  (gen_random_uuid(), null, 'Internet',    'wifi',          true),
  (gen_random_uuid(), null, 'Streaming',   'tv',            true),
  (gen_random_uuid(), null, 'Alimentação', 'shopping-cart', true),
  (gen_random_uuid(), null, 'Aluguel',     'home',          true),
  (gen_random_uuid(), null, 'Saúde',       'heart-pulse',   true),
  (gen_random_uuid(), null, 'Transporte',  'car',           true),
  (gen_random_uuid(), null, 'Outros',      'tag',           true);
