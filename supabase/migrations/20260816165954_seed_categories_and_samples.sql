/*
# Seed initial categories + sample brands/products

## Purpose
Populate the catalog with the 11 required initial categories plus a few
sample brands and products so the storefront renders real content on
first load. Admins can add, update, and delete all of these dynamically
through the admin module.

## Changes
- Inserts 11 categories (slugs used in SEO-friendly URLs like /category/fans).
- Inserts 3 sample brands.
- Inserts a handful of sample products across categories with images and
  specs to demonstrate filtering, search, and product detail pages.

## Security
No security changes — inserts only.
*/

-- Categories
INSERT INTO categories (name, slug, description, sort_order) VALUES
('Wires & Cables', 'wires-cables', 'Electrical wires and cables for all wiring needs', 1),
('Bulbs & Tubes', 'bulbs-tubes', 'LED bulbs and tube lights', 2),
('Wall & Hanging Lights', 'wall-hanging-lights', 'Wall and hanging light fixtures', 3),
('Profile & Strips', 'profile-strips', 'Aluminium profiles and LED strips', 4),
('Appliances', 'appliances', 'Home and kitchen electrical appliances', 5),
('Panels & COB', 'panels-cob', 'Light panels and COB spotlights', 6),
('Fans', 'fans', 'Ceiling, table, and wall fans', 7),
('Outdoor Lighting', 'outdoor-lighting', 'Outdoor and garden lighting solutions', 8),
('VX Lights', 'vx-lights', 'VX series decorative lights', 9),
('Fancy Lights & Zoomers', 'fancy-lights-zoomers', 'Fancy lights and zoomer fixtures', 10),
('Switches, Plates & Accessories', 'switches-plates-accessories', 'Switches, plates and electrical accessories', 11)
ON CONFLICT (slug) DO NOTHING;

-- Brands
INSERT INTO brands (name, slug, description) VALUES
('Havells', 'havells', 'Havells India Ltd.'),
('Philips', 'philips', 'Philips Lighting'),
('Anchor', 'anchor', 'Anchor Electricals')
ON CONFLICT (slug) DO NOTHING;

-- Helper to fetch category/brand ids, then insert sample products
DO $$
DECLARE
  c_fans uuid; c_bulbs uuid; c_wires uuid; c_switches uuid; c_wall uuid;
  b_havells uuid; b_philips uuid; b_anchor uuid;
  p1 uuid; p2 uuid; p3 uuid; p4 uuid; p5 uuid;
BEGIN
  SELECT id INTO c_fans FROM categories WHERE slug='fans';
  SELECT id INTO c_bulbs FROM categories WHERE slug='bulbs-tubes';
  SELECT id INTO c_wires FROM categories WHERE slug='wires-cables';
  SELECT id INTO c_switches FROM categories WHERE slug='switches-plates-accessories';
  SELECT id INTO c_wall FROM categories WHERE slug='wall-hanging-lights';
  SELECT id INTO b_havells FROM brands WHERE slug='havells';
  SELECT id INTO b_philips FROM brands WHERE slug='philips';
  SELECT id INTO b_anchor FROM brands WHERE slug='anchor';

  INSERT INTO products (name, slug, sku, description, category_id, brand_id, mrp, discount_price, stock, status, is_featured, rating, search_keywords)
  VALUES
    ('Havells Ceiling Fan 1200mm', 'havells-ceiling-fan-1200mm', 'HVL-CF1200', 'High-speed 1200mm ceiling fan with aerodynamic blades.', c_fans, b_havells, 3200, 2899, 25, 'in_stock', true, 4.5, 'ceiling fan havells high speed 1200mm')
    RETURNING id INTO p1;
  INSERT INTO products (name, slug, sku, description, category_id, brand_id, mrp, discount_price, stock, status, is_featured, rating, search_keywords)
  VALUES
    ('Philips LED Bulb 9W', 'philips-led-bulb-9w', 'PHL-LED9', 'Energy-efficient 9W LED bulb, cool day light.', c_bulbs, b_philips, 250, 199, 100, 'in_stock', true, 4.7, 'led bulb philips 9w day light energy')
    RETURNING id INTO p2;
  INSERT INTO products (name, slug, sku, description, category_id, brand_id, mrp, discount_price, stock, status, is_featured, rating, search_keywords)
  VALUES
    ('Anchor 1.5 sq mm Wire 90m', 'anchor-wire-15sq-90m', 'ANC-W15-90', 'FR insulated copper wire, 1.5 sq mm, 90 metre coil.', c_wires, b_anchor, 2100, 1899, 40, 'in_stock', false, 4.3, 'wire cable anchor copper fr insulated 1.5')
    RETURNING id INTO p3;
  INSERT INTO products (name, slug, sku, description, category_id, brand_id, mrp, discount_price, stock, status, is_featured, rating, search_keywords)
  VALUES
    ('Anchor Modular Switch 10A', 'anchor-modular-switch-10a', 'ANC-SW10', 'Premium modular switch, 10A, white finish.', c_switches, b_anchor, 120, 89, 200, 'in_stock', true, 4.4, 'switch modular anchor 10a white')
    RETURNING id INTO p4;
  INSERT INTO products (name, slug, sku, description, category_id, brand_id, mrp, discount_price, stock, status, is_featured, rating, search_keywords)
  VALUES
    ('Havells Wall Light Chrome', 'havells-wall-light-chrome', 'HVL-WL-CHR', 'Decorative chrome-finish wall light.', c_wall, b_havells, 1800, 1499, 10, 'in_stock', false, 4.2, 'wall light havells chrome decorative')
    RETURNING id INTO p5;

  -- Images (using Unsplash placeholder URLs for electricals)
  INSERT INTO product_images (product_id, image_url, sort_order) VALUES
    (p1, 'https://images.unsplash.com/photo-1581275288578-bf9bff6f9ad9?w=600', 0),
    (p2, 'https://images.unsplash.com/photo-1565814329452-e1a7ec5fc51a?w=600', 0),
    (p3, 'https://images.unsplash.com/photo-1565608087340-3787b2bff4e3?w=600', 0),
    (p4, 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1ac?w=600', 0),
    (p5, 'https://images.unsplash.com/photo-1513506739341-374e7f9c3b62?w=600', 0);

  -- Specs
  INSERT INTO product_specifications (product_id, spec_name, spec_value, sort_order) VALUES
    (p1, 'Blade Size', '1200 mm', 0),
    (p1, 'Warranty', '2 Years', 1),
    (p1, 'Color', 'Brown', 2),
    (p2, 'Wattage', '9 W', 0),
    (p2, 'Color Temperature', '6500K (Cool Day Light)', 1),
    (p2, 'Base Type', 'B22', 2),
    (p3, 'Wire Size', '1.5 sq mm', 0),
    (p3, 'Length', '90 m', 1),
    (p3, 'Type', 'FR Insulated Copper', 2),
    (p4, 'Current Rating', '10 A', 0),
    (p4, 'Color', 'White', 1),
    (p5, 'Material', 'Chrome + Glass', 0),
    (p5, 'Wattage', '12 W', 1);
END $$;
