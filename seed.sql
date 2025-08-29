-- Insert tooling materials
INSERT OR REPLACE INTO materials (id, name, system, supplier, cost_per_kg, minimum_stock_kg) VALUES 
(1, 'TB Tooling Board', 'Tooling', 'Rampf', 8.50, 500),
(2, 'GM Glass Mat', 'Tooling', 'Owens Corning', 4.25, 300),
(3, 'RM Release Mat', 'Tooling', 'Airtech', 12.75, 200);

-- Insert initial inventory for tooling materials
INSERT OR REPLACE INTO inventory (id, material_id, current_stock_kg, location) VALUES 
(1, 1, 450, 'Main Warehouse'),
(2, 2, 280, 'Main Warehouse'),
(3, 3, 150, 'Main Warehouse');

-- Insert some sample products for tooling
INSERT OR REPLACE INTO products (id, name, system, tb_ratio, gm_ratio, rm_ratio) VALUES 
(1, 'Standard Tooling Mold', 'Tooling', 0.6, 0.3, 0.1),
(2, 'Heavy Duty Tool', 'Tooling', 0.7, 0.2, 0.1),
(3, 'Precision Tool', 'Tooling', 0.5, 0.35, 0.15);