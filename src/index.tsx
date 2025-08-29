import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { CloudflareBindings, Material, InventoryItem, Order, Product, PurchaseRecommendation, VendorPurchaseGroup } from './types'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// API Routes

// Get all materials
app.get('/api/materials', async (c) => {
  const { env } = c;
  
  const { results } = await env.DB.prepare(`
    SELECT m.*, i.current_stock_kg, i.location, i.last_updated as inventory_updated
    FROM materials m
    LEFT JOIN inventory i ON m.id = i.material_id
    ORDER BY m.system, m.name
  `).all();
  
  return c.json(results);
});

// Add material
app.post('/api/materials', async (c) => {
  const { env } = c;
  const { name, system, supplier, cost_per_kg, minimum_stock_kg } = await c.req.json();
  
  // Insert material
  const materialResult = await env.DB.prepare(`
    INSERT INTO materials (name, system, supplier, cost_per_kg, minimum_stock_kg) 
    VALUES (?, ?, ?, ?, ?)
  `).bind(name, system, supplier, cost_per_kg, minimum_stock_kg).run();
  
  // Create initial inventory record
  await env.DB.prepare(`
    INSERT INTO inventory (material_id, current_stock_kg, location) 
    VALUES (?, 0, 'Main Warehouse')
  `).bind(materialResult.meta.last_row_id).run();
  
  return c.json({ success: true, id: materialResult.meta.last_row_id });
});

// Update inventory
app.put('/api/inventory/:id', async (c) => {
  const { env } = c;
  const inventoryId = c.req.param('id');
  const { current_stock_kg, location } = await c.req.json();
  
  await env.DB.prepare(`
    UPDATE inventory 
    SET current_stock_kg = ?, location = ?, last_updated = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(current_stock_kg, location, inventoryId).run();
  
  return c.json({ success: true });
});

// Get all orders
app.get('/api/orders', async (c) => {
  const { env } = c;
  
  const { results } = await env.DB.prepare(`
    SELECT o.*, m.name as material_name, m.system, m.supplier, m.cost_per_kg
    FROM orders o
    JOIN materials m ON o.material_id = m.id
    ORDER BY o.created_at DESC
  `).all();
  
  return c.json(results);
});

// Add order
app.post('/api/orders', async (c) => {
  const { env } = c;
  const { material_id, quantity_kg, notes } = await c.req.json();
  
  const result = await env.DB.prepare(`
    INSERT INTO orders (material_id, quantity_kg, notes, status) 
    VALUES (?, ?, ?, 'pending')
  `).bind(material_id, quantity_kg, notes || '').run();
  
  return c.json({ success: true, id: result.meta.last_row_id });
});

// Delete order
app.delete('/api/orders/:id', async (c) => {
  const { env } = c;
  const orderId = c.req.param('id');
  
  // Check if order exists and is pending
  const order = await env.DB.prepare(`
    SELECT status FROM orders WHERE id = ?
  `).bind(orderId).first();
  
  if (!order) {
    return c.json({ success: false, error: 'Order not found' }, 404);
  }
  
  if (order.status !== 'pending') {
    return c.json({ success: false, error: 'Can only delete pending orders' }, 400);
  }
  
  await env.DB.prepare(`
    DELETE FROM orders WHERE id = ?
  `).bind(orderId).run();
  
  return c.json({ success: true });
});

// Update order status
app.put('/api/orders/:id', async (c) => {
  const { env } = c;
  const orderId = c.req.param('id');
  const { status, notes } = await c.req.json();
  
  await env.DB.prepare(`
    UPDATE orders 
    SET status = ?, notes = ?
    WHERE id = ?
  `).bind(status, notes || '', orderId).run();
  
  return c.json({ success: true });
});

// Get purchase recommendations
app.get('/api/purchase-recommendations', async (c) => {
  const { env } = c;
  
  // Get all materials with inventory
  const { results: materials } = await env.DB.prepare(`
    SELECT m.*, COALESCE(i.current_stock_kg, 0) as current_stock_kg
    FROM materials m
    LEFT JOIN inventory i ON m.id = i.material_id
    ORDER BY m.supplier, m.name
  `).all();
  
  // Get pending orders to add to current stock
  const { results: orders } = await env.DB.prepare(`
    SELECT material_id, SUM(quantity_kg) as pending_quantity
    FROM orders 
    WHERE status = 'pending'
    GROUP BY material_id
  `).all();
  
  const pendingByMaterial = new Map();
  orders.forEach((order: any) => {
    pendingByMaterial.set(order.material_id, order.pending_quantity);
  });
  
  const recommendations: PurchaseRecommendation[] = [];
  
  materials.forEach((material: any) => {
    const pendingStock = pendingByMaterial.get(material.id) || 0;
    const projectedStock = material.current_stock_kg + pendingStock;
    
    if (projectedStock < material.minimum_stock_kg) {
      const shortfall = material.minimum_stock_kg - projectedStock;
      const recommendedPurchase = Math.ceil(shortfall / 25) * 25; // Round up to nearest 25kg
      
      recommendations.push({
        material: material,
        current_stock: projectedStock,
        minimum_stock: material.minimum_stock_kg,
        shortfall: shortfall,
        recommended_purchase: recommendedPurchase,
        estimated_cost: recommendedPurchase * material.cost_per_kg
      });
    }
  });
  
  // Group by vendor and apply vendor-specific logic
  const vendorGroups = new Map<string, VendorPurchaseGroup>();
  
  recommendations.forEach(rec => {
    if (!vendorGroups.has(rec.material.supplier)) {
      vendorGroups.set(rec.material.supplier, {
        vendor: rec.material.supplier,
        materials: [],
        total_cost: 0,
        minimum_order_value: rec.material.supplier === 'Rampf' ? 15000 : 0,
        meets_minimum: false
      });
    }
    
    const group = vendorGroups.get(rec.material.supplier)!;
    group.materials.push(rec);
    group.total_cost += rec.estimated_cost;
  });
  
  // For Rampf, apply minimum order logic
  if (vendorGroups.has('Rampf')) {
    const rampfGroup = vendorGroups.get('Rampf')!;
    
    if (rampfGroup.total_cost < 15000) {
      // Get ALL Rampf materials for ratio balancing
      const { results: allRampfMaterials } = await env.DB.prepare(`
        SELECT m.*, COALESCE(i.current_stock_kg, 0) as current_stock_kg
        FROM materials m
        LEFT JOIN inventory i ON m.id = i.material_id
        WHERE m.supplier = 'Rampf'
      `).all();
      
      const additionalNeeded = 15000 - rampfGroup.total_cost;
      
      // Calculate balanced allocation based on ratios
      const allMaterials = allRampfMaterials.map((mat: any) => {
        const pendingStock = pendingByMaterial.get(mat.id) || 0;
        const existing = rampfGroup.materials.find(r => r.material.id === mat.id);
        return {
          material: mat,
          current_allocation: existing ? existing.recommended_purchase : 0,
          ratio_weight: 1.0 // Equal weighting for now
        };
      });
      
      // Distribute additional amount proportionally
      const totalWeight = allMaterials.reduce((sum, mat) => sum + mat.ratio_weight, 0);
      
      allMaterials.forEach(mat => {
        const additionalForThis = (additionalNeeded * mat.ratio_weight / totalWeight);
        const roundedAdditional = Math.ceil(additionalForThis / 25) * 25;
        
        const existingIndex = rampfGroup.materials.findIndex(r => r.material.id === mat.material.id);
        if (existingIndex >= 0) {
          rampfGroup.materials[existingIndex].recommended_purchase += roundedAdditional;
          rampfGroup.materials[existingIndex].estimated_cost = 
            rampfGroup.materials[existingIndex].recommended_purchase * mat.material.cost_per_kg;
        } else {
          // Add new material to purchase list
          const pendingStock = pendingByMaterial.get(mat.material.id) || 0;
          const projectedStock = mat.material.current_stock_kg + pendingStock;
          
          rampfGroup.materials.push({
            material: mat.material,
            current_stock: projectedStock,
            minimum_stock: mat.material.minimum_stock_kg,
            shortfall: 0, // Not based on shortfall
            recommended_purchase: roundedAdditional,
            estimated_cost: roundedAdditional * mat.material.cost_per_kg
          });
        }
      });
      
      // Recalculate total
      rampfGroup.total_cost = rampfGroup.materials.reduce((sum, mat) => sum + mat.estimated_cost, 0);
    }
    
    rampfGroup.meets_minimum = rampfGroup.total_cost >= 15000;
  }
  
  // Mark all other vendors as meeting minimum (no restrictions)
  vendorGroups.forEach((group, vendor) => {
    if (vendor !== 'Rampf') {
      group.meets_minimum = true;
    }
  });
  
  return c.json(Array.from(vendorGroups.values()));
});

// Get dashboard data
app.get('/api/dashboard', async (c) => {
  const { env } = c;
  
  // Get material counts by system
  const { results: materialCounts } = await env.DB.prepare(`
    SELECT system, COUNT(*) as count
    FROM materials 
    GROUP BY system
  `).all();
  
  // Get low stock alerts
  const { results: lowStock } = await env.DB.prepare(`
    SELECT m.name, m.system, m.minimum_stock_kg, COALESCE(i.current_stock_kg, 0) as current_stock_kg
    FROM materials m
    LEFT JOIN inventory i ON m.id = i.material_id
    WHERE COALESCE(i.current_stock_kg, 0) < m.minimum_stock_kg
    ORDER BY (COALESCE(i.current_stock_kg, 0) / m.minimum_stock_kg) ASC
  `).all();
  
  // Get pending orders count
  const pendingOrdersResult = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM orders WHERE status = 'pending'
  `).first();
  
  // Get total inventory value
  const { results: inventoryValue } = await env.DB.prepare(`
    SELECT SUM(COALESCE(i.current_stock_kg, 0) * m.cost_per_kg) as total_value
    FROM materials m
    LEFT JOIN inventory i ON m.id = i.material_id
  `).all();
  
  return c.json({
    materialCounts,
    lowStock,
    pendingOrders: pendingOrdersResult?.count || 0,
    totalInventoryValue: inventoryValue[0]?.total_value || 0
  });
});

// Get all products
app.get('/api/products', async (c) => {
  const { env } = c;
  
  const { results } = await env.DB.prepare(`
    SELECT * FROM products ORDER BY system, name
  `).all();
  
  return c.json(results);
});

// Add product
app.post('/api/products', async (c) => {
  const { env } = c;
  const { name, system, tb_ratio, gm_ratio, rm_ratio, woven_ratio, chopped_ratio } = await c.req.json();
  
  const result = await env.DB.prepare(`
    INSERT INTO products (name, system, tb_ratio, gm_ratio, rm_ratio, woven_ratio, chopped_ratio) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(name, system, tb_ratio, gm_ratio, rm_ratio, woven_ratio, chopped_ratio).run();
  
  return c.json({ success: true, id: result.meta.last_row_id });
});

// Main page with Material Tracker UI
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Material Tracking System</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body class="bg-gray-100">
        <!-- Header -->
        <header class="bg-blue-900 text-white p-4 shadow-lg">
            <div class="container mx-auto">
                <h1 class="text-2xl font-bold">
                    <i class="fas fa-boxes mr-2"></i>
                    Material Tracking System
                </h1>
                <p class="text-blue-200">Multi-System Inventory & Order Management</p>
            </div>
        </header>

        <!-- Navigation -->
        <nav class="bg-blue-800 text-white p-2">
            <div class="container mx-auto">
                <div class="flex space-x-4" id="nav-tabs">
                    <button class="nav-tab px-4 py-2 rounded hover:bg-blue-700 active" data-tab="dashboard">
                        <i class="fas fa-tachometer-alt mr-1"></i>Dashboard
                    </button>
                    <button class="nav-tab px-4 py-2 rounded hover:bg-blue-700" data-tab="materials">
                        <i class="fas fa-layer-group mr-1"></i>Materials
                    </button>
                    <button class="nav-tab px-4 py-2 rounded hover:bg-blue-700" data-tab="inventory">
                        <i class="fas fa-warehouse mr-1"></i>Inventory
                    </button>
                    <button class="nav-tab px-4 py-2 rounded hover:bg-blue-700" data-tab="orders">
                        <i class="fas fa-shopping-cart mr-1"></i>Orders
                    </button>
                    <button class="nav-tab px-4 py-2 rounded hover:bg-blue-700" data-tab="purchase">
                        <i class="fas fa-shopping-bag mr-1"></i>Purchase Recommendations
                    </button>
                    <button class="nav-tab px-4 py-2 rounded hover:bg-blue-700" data-tab="products">
                        <i class="fas fa-cube mr-1"></i>Products
                    </button>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <main class="container mx-auto p-4">
            <div id="app">
                <!-- Content will be loaded here -->
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
});

export default app