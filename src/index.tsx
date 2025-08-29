import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for frontend-backend communication
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Main page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Business Tracking Systems</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100 min-h-screen">
        <header class="bg-blue-900 text-white p-6 shadow-lg">
            <div class="container mx-auto text-center">
                <h1 class="text-4xl font-bold mb-2">
                    <i class="fas fa-industry mr-3"></i>
                    Business Tracking Systems
                </h1>
                <p class="text-blue-200 text-lg">Comprehensive tracking tools for all business operations</p>
            </div>
        </header>

        <main class="container mx-auto p-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div class="p-8 text-center">
                        <div class="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-tools text-blue-600 text-3xl"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-800 mb-3">Tooling Tracker</h2>
                        <p class="text-gray-600 mb-6">Track tooling board, plywood, and manage tooling jobs from order to completion.</p>
                        <button onclick="window.location.href='/tooling'" 
                                class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200">
                            <i class="fas fa-arrow-right mr-2"></i>
                            Open Tooling Tracker
                        </button>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div class="p-8 text-center">
                        <div class="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-cube text-green-600 text-3xl"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-800 mb-3">Core Kits Tracker</h2>
                        <p class="text-gray-600 mb-6">Manage core kit materials and track core production jobs efficiently.</p>
                        <button onclick="alert('Core Kits Tracker - Coming Soon!')" 
                                class="bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold cursor-not-allowed">
                            <i class="fas fa-clock mr-2"></i>
                            Coming Soon
                        </button>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div class="p-8 text-center">
                        <div class="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-gem text-purple-600 text-3xl"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-800 mb-3">Glass Kits Tracker</h2>
                        <p class="text-gray-600 mb-6">Track glass materials and manage glass kit production workflows.</p>
                        <button onclick="alert('Glass Kits Tracker - Coming Soon!')" 
                                class="bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold cursor-not-allowed">
                            <i class="fas fa-clock mr-2"></i>
                            Coming Soon
                        </button>
                    </div>
                </div>
            </div>
        </main>

        <footer class="bg-gray-800 text-white p-6 mt-12">
            <div class="container mx-auto text-center">
                <p>&copy; 2024 Business Tracking Systems. All rights reserved.</p>
            </div>
        </footer>
    </body>
    </html>
  `)
})

// Tooling Tracker main page with complete frontend and backend
app.get('/tooling', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tooling Tracker</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gray-100">
        <!-- Header -->
        <header class="bg-blue-900 text-white p-4 shadow-lg">
            <div class="container mx-auto flex items-center justify-between">
                <div class="flex items-center">
                    <button onclick="window.location.href='/'" class="text-blue-200 hover:text-white mr-4">
                        <i class="fas fa-arrow-left text-xl"></i>
                    </button>
                    <h1 class="text-2xl font-bold">
                        <i class="fas fa-tools mr-2"></i>
                        Tooling Tracker
                    </h1>
                </div>
                <p class="text-blue-200">Tooling Board & Plywood Management</p>
            </div>
        </header>

        <!-- Navigation -->
        <nav class="bg-blue-800 text-white p-2">
            <div class="container mx-auto">
                <div class="flex space-x-4" id="nav-tabs">
                    <button class="nav-tab px-4 py-2 rounded hover:bg-blue-700 active bg-blue-600" data-tab="dashboard">
                        <i class="fas fa-tachometer-alt mr-1"></i>Dashboard
                    </button>
                    <button class="nav-tab px-4 py-2 rounded hover:bg-blue-700" data-tab="materials">
                        <i class="fas fa-layer-group mr-1"></i>Materials
                    </button>
                    <button class="nav-tab px-4 py-2 rounded hover:bg-blue-700" data-tab="inventory">
                        <i class="fas fa-warehouse mr-1"></i>Inventory
                    </button>
                    <button class="nav-tab px-4 py-2 rounded hover:bg-blue-700" data-tab="new-orders">
                        <i class="fas fa-plus-circle mr-1"></i>New Orders
                    </button>
                    <button class="nav-tab px-4 py-2 rounded hover:bg-blue-700" data-tab="purchase-orders">
                        <i class="fas fa-shopping-cart mr-1"></i>Purchase Orders
                    </button>
                    <button class="nav-tab px-4 py-2 rounded hover:bg-blue-700" data-tab="orders-in-process">
                        <i class="fas fa-cogs mr-1"></i>Orders in Process
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

        <script>
          class ToolingTracker {
              constructor() {
                  this.currentTab = 'dashboard';
                  this.materials = [];
                  this.inventory = [];
                  this.jobs = [];
                  this.charts = {};
                  this.materialsEditMode = false;
                  this.inventoryEditMode = false;
                  this.init();
              }

              async init() {
                  await this.loadData();
                  this.bindEvents();
                  await this.loadDashboard();
              }

              async loadData() {
                  try {
                      // Load materials
                      const materialsResponse = await axios.get('/api/tooling/materials');
                      this.materials = materialsResponse.data;

                      // Load inventory
                      const inventoryResponse = await axios.get('/api/tooling/inventory');
                      this.inventory = inventoryResponse.data;

                      // Load jobs
                      const jobsResponse = await axios.get('/api/tooling/jobs');
                      this.jobs = jobsResponse.data;
                  } catch (error) {
                      console.error('Error loading data:', error);
                  }
              }

              bindEvents() {
                  // Navigation
                  document.querySelectorAll('.nav-tab').forEach(tab => {
                      tab.addEventListener('click', (e) => {
                          const tabName = e.target.getAttribute('data-tab');
                          this.switchTab(tabName);
                      });
                  });
              }

              async switchTab(tabName) {
                  // Update active tab
                  document.querySelectorAll('.nav-tab').forEach(tab => {
                      tab.classList.remove('active', 'bg-blue-600');
                  });
                  document.querySelector(\`[data-tab="\${tabName}"]\`).classList.add('active', 'bg-blue-600');

                  this.currentTab = tabName;

                  // Load tab content
                  switch (tabName) {
                      case 'dashboard':
                          await this.loadDashboard();
                          break;
                      case 'materials':
                          await this.loadMaterials();
                          break;
                      case 'inventory':
                          await this.loadInventory();
                          break;
                      case 'new-orders':
                          await this.loadNewOrders();
                          break;
                      case 'purchase-orders':
                          await this.loadPurchaseOrders();
                          break;
                      case 'orders-in-process':
                          await this.loadOrdersInProcess();
                          break;
                  }
              }

              async loadDashboard() {
                  // Group inventory by material type
                  const toolingBoardData = this.inventory.filter(item => 
                      item.material_name.includes('TB')
                  );
                  const plywoodData = this.inventory.filter(item => 
                      item.material_name.includes('Plywood')
                  );

                  const content = \`
                      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <!-- Tooling Board Chart -->
                          <div class="bg-white p-6 rounded-lg shadow-md">
                              <h3 class="text-xl font-bold mb-4">Tooling Board Inventory</h3>
                              <div class="h-96">
                                  <canvas id="toolingBoardChart"></canvas>
                              </div>
                          </div>

                          <!-- Plywood Chart -->
                          <div class="bg-white p-6 rounded-lg shadow-md">
                              <h3 class="text-xl font-bold mb-4">Plywood Inventory</h3>
                              <div class="h-96">
                                  <canvas id="plywoodChart"></canvas>
                              </div>
                          </div>
                      </div>

                      <!-- Summary Cards -->
                      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
                          <div class="bg-white p-6 rounded-lg shadow-md">
                              <div class="flex items-center">
                                  <i class="fas fa-boxes text-blue-500 text-2xl mr-3"></i>
                                  <div>
                                      <h3 class="text-lg font-semibold">Total Materials</h3>
                                      <p class="text-2xl font-bold text-blue-600">\${this.materials.length}</p>
                                  </div>
                              </div>
                          </div>
                          <div class="bg-white p-6 rounded-lg shadow-md">
                              <div class="flex items-center">
                                  <i class="fas fa-warehouse text-green-500 text-2xl mr-3"></i>
                                  <div>
                                      <h3 class="text-lg font-semibold">On Hand Total</h3>
                                      <p class="text-2xl font-bold text-green-600">\${this.inventory.reduce((sum, item) => sum + item.on_hand, 0)}</p>
                                  </div>
                              </div>
                          </div>
                          <div class="bg-white p-6 rounded-lg shadow-md">
                              <div class="flex items-center">
                                  <i class="fas fa-lock text-orange-500 text-2xl mr-3"></i>
                                  <div>
                                      <h3 class="text-lg font-semibold">Allocated Total</h3>
                                      <p class="text-2xl font-bold text-orange-600">\${this.inventory.reduce((sum, item) => sum + item.allocated, 0)}</p>
                                  </div>
                              </div>
                          </div>
                          <div class="bg-white p-6 rounded-lg shadow-md">
                              <div class="flex items-center">
                                  <i class="fas fa-cogs text-purple-500 text-2xl mr-3"></i>
                                  <div>
                                      <h3 class="text-lg font-semibold">Active Jobs</h3>
                                      <p class="text-2xl font-bold text-purple-600">\${this.jobs.filter(job => job.status === 'in_process').length}</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  \`;

                  document.getElementById('app').innerHTML = content;
                  
                  // Create charts
                  this.createInventoryChart('toolingBoardChart', toolingBoardData, 'Tooling Board');
                  this.createInventoryChart('plywoodChart', plywoodData, 'Plywood');
              }

              createInventoryChart(canvasId, data, title) {
                  const ctx = document.getElementById(canvasId).getContext('2d');
                  
                  // Destroy existing chart
                  if (this.charts[canvasId]) {
                      this.charts[canvasId].destroy();
                  }

                  // Create custom plugin for minimum lines
                  const minimumLinePlugin = {
                      id: 'minimumLines',
                      afterDatasetsDraw: (chart) => {
                          const ctx = chart.ctx;
                          chart.data.datasets[0].data.forEach((value, index) => {
                              const dataItem = data[index];
                              if (dataItem) {
                                  const minimum = dataItem.minimum_on_hand;
                                  
                                  if (minimum > 0) {
                                      // Get bar position
                                      const meta = chart.getDatasetMeta(0);
                                      const bar = meta.data[index];
                                      const yPos = chart.scales.y.getPixelForValue(minimum);
                                      
                                      // Draw red line for minimum
                                      ctx.save();
                                      ctx.strokeStyle = '#DC2626';
                                      ctx.lineWidth = 3;
                                      ctx.setLineDash([5, 5]);
                                      ctx.beginPath();
                                      ctx.moveTo(bar.x - bar.width / 2, yPos);
                                      ctx.lineTo(bar.x + bar.width / 2, yPos);
                                      ctx.stroke();
                                      ctx.restore();
                                      
                                      // Add minimum label
                                      ctx.save();
                                      ctx.fillStyle = '#DC2626';
                                      ctx.font = '10px Arial';
                                      ctx.textAlign = 'right';
                                      ctx.fillText('Min: ' + minimum, bar.x + bar.width / 2 - 5, yPos - 5);
                                      ctx.restore();
                                  }
                              }
                          });
                      }
                  };

                  this.charts[canvasId] = new Chart(ctx, {
                      type: 'bar',
                      data: {
                          labels: data.map(item => item.material_name),
                          datasets: [{
                              label: 'On Hand',
                              data: data.map(item => item.on_hand),
                              backgroundColor: '#10B981',
                              stack: 'Stack 0'
                          }, {
                              label: 'Allocated',
                              data: data.map(item => item.allocated),
                              backgroundColor: '#F59E0B',
                              stack: 'Stack 0'
                          }]
                      },
                      options: {
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                              title: {
                                  display: true,
                                  text: title + ' Inventory Status'
                              },
                              legend: {
                                  display: true
                              }
                          },
                          scales: {
                              x: {
                                  stacked: true
                              },
                              y: {
                                  stacked: true,
                                  beginAtZero: true,
                                  title: {
                                      display: true,
                                      text: 'Quantity'
                                  }
                              }
                          }
                      },
                      plugins: [minimumLinePlugin]
                  });
              }

              async loadMaterials() {
                  const content = \`
                      <div class="bg-white p-6 rounded-lg shadow-md">
                          <div class="flex justify-between items-center mb-6">
                              <div>
                                  <h2 class="text-2xl font-bold">Materials Management</h2>
                                  <p class="text-gray-600 mt-2">Manage material specifications and supplier information. Values are locked for data integrity.</p>
                              </div>
                              <button onclick="toolingTracker.toggleMaterialsEdit()" 
                                      id="materials-edit-btn"
                                      class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded">
                                  <i class="fas fa-edit mr-2"></i>Enable Editing
                              </button>
                          </div>
                          
                          <div class="overflow-x-auto">
                              <table class="min-w-full table-auto">
                                  <thead class="bg-gray-50">
                                      <tr>
                                          <th class="px-4 py-3 text-left">Material Name</th>
                                          <th class="px-4 py-3 text-left">Type</th>
                                          <th class="px-4 py-3 text-left">Cost per Unit</th>
                                          <th class="px-4 py-3 text-left">Supplier</th>
                                          <th class="px-4 py-3 text-left">Order Increment</th>
                                          <th class="px-4 py-3 text-left">Vendor Min Order</th>
                                          <th class="px-4 py-3 text-left">Minimum on Hand</th>
                                      </tr>
                                  </thead>
                                  <tbody class="divide-y divide-gray-200">
                                      \${this.materials.map(material => \`
                                          <tr>
                                              <td class="px-4 py-3 font-medium">\${material.name}</td>
                                              <td class="px-4 py-3">\${material.tool_type}</td>
                                              <td class="px-4 py-3">
                                                  <input type="number" 
                                                         value="\${material.cost_per_unit}" 
                                                         class="w-24 p-1 border rounded text-center materials-input"
                                                         data-field="cost_per_unit"
                                                         data-id="\${material.id}"
                                                         onchange="toolingTracker.updateMaterial(\${material.id}, 'cost_per_unit', this.value)"
                                                         disabled>
                                              </td>
                                              <td class="px-4 py-3">\${material.supplier}</td>
                                              <td class="px-4 py-3">
                                                  <input type="number" 
                                                         value="\${material.order_increment}" 
                                                         class="w-20 p-1 border rounded text-center materials-input"
                                                         data-field="order_increment"
                                                         data-id="\${material.id}"
                                                         onchange="toolingTracker.updateMaterial(\${material.id}, 'order_increment', this.value)"
                                                         disabled>
                                              </td>
                                              <td class="px-4 py-3">$\${material.vendor_minimum_order.toLocaleString()}</td>
                                              <td class="px-4 py-3">
                                                  <input type="number" 
                                                         value="\${material.minimum_on_hand}" 
                                                         class="w-20 p-1 border rounded text-center materials-input"
                                                         data-field="minimum_on_hand"
                                                         data-id="\${material.id}"
                                                         onchange="toolingTracker.updateMaterial(\${material.id}, 'minimum_on_hand', this.value)"
                                                         disabled>
                                              </td>
                                          </tr>
                                      \`).join('')}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  \`;

                  document.getElementById('app').innerHTML = content;
              }

              toggleMaterialsEdit() {
                  this.materialsEditMode = !this.materialsEditMode;
                  const inputs = document.querySelectorAll('.materials-input');
                  const button = document.getElementById('materials-edit-btn');
                  
                  if (this.materialsEditMode) {
                      inputs.forEach(input => input.disabled = false);
                      button.innerHTML = '<i class="fas fa-lock mr-2"></i>Lock Editing';
                      button.className = 'px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded';
                  } else {
                      inputs.forEach(input => input.disabled = true);
                      button.innerHTML = '<i class="fas fa-edit mr-2"></i>Enable Editing';
                      button.className = 'px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded';
                  }
              }

              async updateMaterial(materialId, field, value) {
                  try {
                      await axios.put(\`/api/tooling/materials/\${materialId}\`, {
                          [field]: parseFloat(value) || value
                      });
                      
                      // Update local data
                      const material = this.materials.find(m => m.id === materialId);
                      if (material) {
                          material[field] = parseFloat(value) || value;
                      }
                      
                      // Visual feedback
                      const input = document.querySelector(\`[data-id="\${materialId}"][data-field="\${field}"]\`);
                      if (input) {
                          input.classList.add('bg-green-100');
                          setTimeout(() => input.classList.remove('bg-green-100'), 1000);
                      }
                  } catch (error) {
                      console.error('Error updating material:', error);
                      alert('Error updating material. Please try again.');
                  }
              }

              async loadInventory() {
                  const content = \`
                      <div class="bg-white p-6 rounded-lg shadow-md">
                          <div class="flex justify-between items-center mb-6">
                              <div>
                                  <h2 class="text-2xl font-bold">Inventory Management</h2>
                                  <p class="text-gray-600 mt-2">Adjust on-hand quantities to correct for any errors. Allocated amounts are automatically managed by jobs.</p>
                              </div>
                              <button onclick="toolingTracker.toggleInventoryEdit()" 
                                      id="inventory-edit-btn"
                                      class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded">
                                  <i class="fas fa-edit mr-2"></i>Enable Editing
                              </button>
                          </div>
                          
                          <div class="overflow-x-auto">
                              <table class="min-w-full table-auto">
                                  <thead class="bg-gray-50">
                                      <tr>
                                          <th class="px-4 py-3 text-left">Material</th>
                                          <th class="px-4 py-3 text-left">On Hand</th>
                                          <th class="px-4 py-3 text-left">Allocated</th>
                                          <th class="px-4 py-3 text-left">Available</th>
                                          <th class="px-4 py-3 text-left">Minimum Required</th>
                                          <th class="px-4 py-3 text-left">Status</th>
                                          <th class="px-4 py-3 text-left">Value</th>
                                      </tr>
                                  </thead>
                                  <tbody class="divide-y divide-gray-200">
                                      \${this.inventory.map(item => {
                                          const available = item.on_hand - item.allocated;
                                          const status = available >= item.minimum_on_hand ? 'Good' : 
                                                        available >= item.minimum_on_hand * 0.5 ? 'Low' : 'Critical';
                                          const statusColor = status === 'Good' ? 'text-green-600 bg-green-100' :
                                                             status === 'Low' ? 'text-yellow-600 bg-yellow-100' :
                                                             'text-red-600 bg-red-100';
                                          const totalValue = (item.on_hand * item.cost_per_unit).toFixed(2);
                                          
                                          return \`
                                              <tr>
                                                  <td class="px-4 py-3 font-medium">\${item.material_name}</td>
                                                  <td class="px-4 py-3">
                                                      <input type="number" 
                                                             value="\${item.on_hand}" 
                                                             class="w-20 p-2 border rounded text-center inventory-input"
                                                             onchange="toolingTracker.updateInventory(\${item.id}, this.value)"
                                                             disabled>
                                                  </td>
                                                  <td class="px-4 py-3 text-center">\${item.allocated}</td>
                                                  <td class="px-4 py-3 text-center font-semibold">\${available}</td>
                                                  <td class="px-4 py-3 text-center">\${item.minimum_on_hand}</td>
                                                  <td class="px-4 py-3">
                                                      <span class="px-2 py-1 text-xs rounded-full \${statusColor}">
                                                          \${status}
                                                      </span>
                                                  </td>
                                                  <td class="px-4 py-3 text-right font-medium">$\${totalValue}</td>
                                              </tr>
                                          \`;
                                      }).join('')}
                                  </tbody>
                                  <tfoot class="bg-gray-50">
                                      <tr>
                                          <td colspan="6" class="px-4 py-3 text-right font-bold">Total Inventory Value:</td>
                                          <td class="px-4 py-3 text-right font-bold">
                                              $\${this.inventory.reduce((sum, item) => sum + (item.on_hand * item.cost_per_unit), 0).toLocaleString()}
                                          </td>
                                      </tr>
                                  </tfoot>
                              </table>
                          </div>
                      </div>
                  \`;

                  document.getElementById('app').innerHTML = content;
              }

              toggleInventoryEdit() {
                  this.inventoryEditMode = !this.inventoryEditMode;
                  const inputs = document.querySelectorAll('.inventory-input');
                  const button = document.getElementById('inventory-edit-btn');
                  
                  if (this.inventoryEditMode) {
                      inputs.forEach(input => input.disabled = false);
                      button.innerHTML = '<i class="fas fa-lock mr-2"></i>Lock Editing';
                      button.className = 'px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded';
                  } else {
                      inputs.forEach(input => input.disabled = true);
                      button.innerHTML = '<i class="fas fa-edit mr-2"></i>Enable Editing';
                      button.className = 'px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded';
                  }
              }

              async updateInventory(inventoryId, newQuantity) {
                  try {
                      await axios.put(\`/api/tooling/inventory/\${inventoryId}\`, {
                          on_hand: parseInt(newQuantity)
                      });
                      
                      // Update local data
                      const inventoryItem = this.inventory.find(item => item.id === inventoryId);
                      if (inventoryItem) {
                          inventoryItem.on_hand = parseInt(newQuantity);
                      }
                      
                      // Reload inventory to update calculations
                      await this.loadData();
                      await this.loadInventory();
                  } catch (error) {
                      console.error('Error updating inventory:', error);
                      alert('Error updating inventory. Please try again.');
                  }
              }

              async loadNewOrders() {
                  const content = \`
                      <div class="bg-white p-6 rounded-lg shadow-md">
                          <div class="flex justify-between items-center mb-6">
                              <h2 class="text-2xl font-bold">New Orders</h2>
                              <button onclick="toolingTracker.showNewOrderForm()" 
                                      class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                                  <i class="fas fa-plus mr-2"></i>Create New Job Order
                              </button>
                          </div>
                          
                          <div id="new-order-form" class="hidden mb-6 p-4 bg-blue-50 rounded-lg">
                              <h3 class="text-lg font-bold mb-4">Create Job Order</h3>
                              <form id="jobOrderForm">
                                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                      <div>
                                          <label class="block text-sm font-medium mb-2">Job Name</label>
                                          <input type="text" id="jobName" class="w-full p-2 border rounded" placeholder="Enter job name" required>
                                      </div>
                                      <div>
                                          <label class="block text-sm font-medium mb-2">Tool Type</label>
                                          <select id="toolType" class="w-full p-2 border rounded">
                                              <option value="Tooling">Tooling</option>
                                              <option value="Core Kits">Core Kits</option>
                                              <option value="Glass Kits">Glass Kits</option>
                                          </select>
                                      </div>
                                  </div>
                                  
                                  <h4 class="text-md font-bold mb-3">Material Requirements</h4>
                                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                      \${this.materials.map(material => \`
                                          <div class="border p-3 rounded">
                                              <label class="block text-sm font-medium mb-2">\${material.name}</label>
                                              <input type="number" 
                                                     id="material_\${material.id}" 
                                                     class="w-full p-2 border rounded" 
                                                     placeholder="Quantity" 
                                                     min="0">
                                              <p class="text-xs text-gray-500 mt-1">$\${material.cost_per_unit}/unit</p>
                                          </div>
                                      \`).join('')}
                                  </div>
                                  
                                  <div class="flex gap-4">
                                      <button type="button" onclick="toolingTracker.submitJobOrder()" 
                                              class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded">
                                          <i class="fas fa-save mr-2"></i>Create Job Order
                                      </button>
                                      <button type="button" onclick="toolingTracker.hideNewOrderForm()" 
                                              class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded">
                                          Cancel
                                      </button>
                                  </div>
                              </form>
                          </div>

                          \${await this.getNewOrdersList()}
                      </div>
                  \`;

                  document.getElementById('app').innerHTML = content;
              }

              async getNewOrdersList() {
                  const newJobs = this.jobs.filter(job => job.status === 'new');
                  
                  if (newJobs.length === 0) {
                      return '<div class="text-center py-8"><i class="fas fa-inbox text-gray-400 text-4xl mb-4"></i><p class="text-lg text-gray-600">No new orders found. Create a new job order to get started.</p></div>';
                  }

                  return \`
                      <div class="space-y-4">
                          \${newJobs.map(job => \`
                              <div class="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                                  <div class="flex justify-between items-start">
                                      <div>
                                          <h3 class="text-lg font-bold">\${job.job_name}</h3>
                                          <p class="text-sm text-gray-600">Created: \${new Date(job.created_at).toLocaleDateString()}</p>
                                          <p class="text-sm text-gray-600">Materials: \${job.materials_summary || 'No materials assigned'}</p>
                                      </div>
                                      <div class="text-right">
                                          <button onclick="toolingTracker.deleteJob(\${job.id})" 
                                                  class="text-red-600 hover:text-red-800 p-2 mr-2" 
                                                  title="Delete Job Order">
                                              <i class="fas fa-trash"></i>
                                          </button>
                                          <span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                                              New Order
                                          </span>
                                      </div>
                                  </div>
                              </div>
                          \`).join('')}
                      </div>
                  \`;
              }

              showNewOrderForm() {
                  document.getElementById('new-order-form').classList.remove('hidden');
              }

              hideNewOrderForm() {
                  document.getElementById('new-order-form').classList.add('hidden');
                  document.getElementById('jobOrderForm').reset();
              }

              async submitJobOrder() {
                  const jobName = document.getElementById('jobName').value;
                  const toolType = document.getElementById('toolType').value;
                  
                  if (!jobName.trim()) {
                      alert('Please enter a job name.');
                      return;
                  }

                  const materials = [];
                  this.materials.forEach(material => {
                      const quantityInput = document.getElementById(\`material_\${material.id}\`);
                      const quantity = parseInt(quantityInput.value) || 0;
                      if (quantity > 0) {
                          materials.push({
                              material_id: material.id,
                              quantity: quantity
                          });
                      }
                  });

                  if (materials.length === 0) {
                      alert('Please specify at least one material quantity.');
                      return;
                  }

                  try {
                      await axios.post('/api/tooling/jobs', {
                          job_name: jobName,
                          tool_type: toolType,
                          materials: materials
                      });
                      
                      alert('Job order created successfully!');
                      this.hideNewOrderForm();
                      await this.loadData();
                      await this.loadNewOrders();
                  } catch (error) {
                      console.error('Error creating job order:', error);
                      alert('Error creating job order. Please try again.');
                  }
              }

              async deleteJob(jobId) {
                  if (confirm('Are you sure you want to delete this job order? This action cannot be undone.')) {
                      try {
                          await axios.delete(\`/api/tooling/jobs/\${jobId}\`);
                          await this.loadData();
                          await this.loadNewOrders();
                          alert('Job order deleted successfully.');
                      } catch (error) {
                          console.error('Error deleting job:', error);
                          alert('Error deleting job order. Please try again.');
                      }
                  }
              }

              async loadPurchaseOrders() {
                  try {
                      const response = await axios.get('/api/tooling/purchase-recommendations');
                      const recommendations = response.data;
                      
                      const content = \`
                          <div class="bg-white p-6 rounded-lg shadow-md">
                              <h2 class="text-2xl font-bold mb-6">Purchase Orders</h2>
                              <p class="text-gray-600 mb-6">
                                  Purchase recommendations consider current available materials and new order requirements. 
                                  <strong>Formula:</strong> (Available - NewOrderQuantity + SuggestedAmount) / MinOnHand ratio balanced while meeting vendor minimums.
                              </p>
                              
                              \${Object.keys(recommendations).filter(key => key !== 'totals' && recommendations[key].length > 0).map(supplier => {
                                  const supplierRecommendations = recommendations[supplier];
                                  const total = recommendations.totals[supplier];
                                  const meetsMinimum = supplier === 'Rampf' ? total >= 15000 : true;
                                  
                                  return \`
                                      <div class="supplier-border mb-8 border rounded-lg \${meetsMinimum ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}" data-supplier="\${supplier}">
                                          <div class="p-4 border-b \${meetsMinimum ? 'border-green-200' : 'border-red-200'}">
                                              <div class="flex justify-between items-center">
                                                  <h3 class="text-xl font-bold">\${supplier}</h3>
                                                  <div class="text-right">
                                                      <div class="text-lg font-bold \${meetsMinimum ? 'text-green-600' : 'text-red-600'}">
                                                          Total: <span class="supplier-total">$\${total.toLocaleString()}</span>
                                                      </div>
                                                      \${supplier === 'Rampf' ? \`
                                                          <div class="text-sm \${meetsMinimum ? 'text-green-600' : 'text-red-600'}">
                                                              Minimum: $15,000 <span class="minimum-indicator \${meetsMinimum ? 'text-green-600' : 'text-red-600'}">\${meetsMinimum ? '✓' : '✗'}</span>
                                                          </div>
                                                      \` : ''}
                                                  </div>
                                              </div>
                                          </div>
                                          
                                          <div class="p-4">
                                              <div class="overflow-x-auto">
                                                  <table class="min-w-full table-auto">
                                                      <thead class="bg-gray-50">
                                                          <tr>
                                                              <th class="px-4 py-2 text-left">Material</th>
                                                              <th class="px-4 py-2 text-left">Available</th>
                                                              <th class="px-4 py-2 text-left">New Orders</th>
                                                              <th class="px-4 py-2 text-left">Projected</th>
                                                              <th class="px-4 py-2 text-left">Minimum</th>
                                                              <th class="px-4 py-2 text-left">Final Ratio</th>
                                                              <th class="px-4 py-2 text-left">Recommended</th>
                                                              <th class="px-4 py-2 text-left">Adjust Qty</th>
                                                              <th class="px-4 py-2 text-left">Cost</th>
                                                          </tr>
                                                      </thead>
                                                      <tbody class="divide-y divide-gray-200">
                                                          \${supplierRecommendations.map((rec, index) => \`
                                                              <tr>
                                                                  <td class="px-4 py-2 font-medium">\${rec.material_name}</td>
                                                                  <td class="px-4 py-2">\${rec.available}</td>
                                                                  <td class="px-4 py-2 text-orange-600">\${rec.new_order_quantity}</td>
                                                                  <td class="px-4 py-2 font-semibold \${rec.projected_available < rec.minimum_on_hand ? 'text-red-600' : 'text-green-600'}">
                                                                      \${rec.projected_available}
                                                                  </td>
                                                                  <td class="px-4 py-2">\${rec.minimum_on_hand}</td>
                                                                  <td class="px-4 py-2 font-bold text-blue-600">
                                                                      \${rec.ratio}
                                                                  </td>
                                                                  <td class="px-4 py-2 font-bold">\${rec.recommended_purchase}</td>
                                                                  <td class="px-4 py-2">
                                                                      <input type="number" min="0" 
                                                                             value="\${rec.recommended_purchase}" 
                                                                             class="w-20 p-1 border rounded text-center purchase-qty"
                                                                             data-material-id="\${rec.material_id}"
                                                                             data-cost="\${rec.cost_per_unit}"
                                                                             onchange="toolingTracker.updatePurchaseRecommendation(this)">
                                                                  </td>
                                                                  <td class="px-4 py-2 purchase-cost">$\${rec.estimated_cost.toFixed(2)}</td>
                                                              </tr>
                                                          \`).join('')}
                                                      </tbody>
                                                  </table>
                                              </div>
                                          </div>
                                      </div>
                                  \`;
                              }).join('') || '<div class="text-center py-8"><i class="fas fa-check-circle text-green-500 text-4xl mb-4"></i><p class="text-lg text-gray-600">All materials are adequately stocked for current and new orders!</p></div>'}
                              
                              \${Object.keys(recommendations).some(key => key !== 'totals' && recommendations[key].length > 0) ? \`
                                  <div class="flex justify-end mt-6">
                                      <button onclick="toolingTracker.markAsPurchased()" 
                                              class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold">
                                          <i class="fas fa-check mr-2"></i>
                                          Mark as Purchased & Move Orders to Process
                                      </button>
                                  </div>
                              \` : ''}
                          </div>
                      \`;

                      document.getElementById('app').innerHTML = content;
                  } catch (error) {
                      console.error('Error loading purchase orders:', error);
                  }
              }

              updatePurchaseRecommendation(input) {
                  const materialId = parseInt(input.dataset.materialId);
                  const costPerUnit = parseFloat(input.dataset.cost);
                  const newQuantity = parseInt(input.value) || 0;
                  
                  // Update the cost cell
                  const newCost = newQuantity * costPerUnit;
                  const costCell = input.closest('tr').querySelector('.purchase-cost');
                  costCell.textContent = '$' + newCost.toFixed(2);
                  
                  // Recalculate totals
                  this.recalculatePurchaseTotals();
              }

              recalculatePurchaseTotals() {
                  // Get all supplier sections
                  const supplierSections = document.querySelectorAll('[data-supplier]');
                  
                  supplierSections.forEach(section => {
                      const supplier = section.dataset.supplier;
                      const purchaseInputs = section.querySelectorAll('.purchase-qty');
                      
                      let total = 0;
                      purchaseInputs.forEach(input => {
                          const quantity = parseInt(input.value) || 0;
                          const cost = parseFloat(input.dataset.cost);
                          total += quantity * cost;
                      });
                      
                      // Update total display
                      const totalDisplay = section.querySelector('.supplier-total');
                      if (totalDisplay) {
                          totalDisplay.textContent = '$' + total.toLocaleString();
                      }
                      
                      // Update minimum requirement indicator for Rampf
                      if (supplier === 'Rampf') {
                          const meetsMinimum = total >= 15000;
                          const minimumIndicator = section.querySelector('.minimum-indicator');
                          if (minimumIndicator) {
                              minimumIndicator.textContent = meetsMinimum ? '✓' : '✗';
                              minimumIndicator.className = meetsMinimum ? 'text-green-600 minimum-indicator' : 'text-red-600 minimum-indicator';
                          }
                          
                          // Update section styling
                          const borderEl = section;
                          if (borderEl) {
                              borderEl.className = meetsMinimum ? 
                                  'supplier-border mb-8 border rounded-lg border-green-200 bg-green-50' : 
                                  'supplier-border mb-8 border rounded-lg border-red-200 bg-red-50';
                              borderEl.setAttribute('data-supplier', supplier);
                          }
                      }
                  });
              }

              async markAsPurchased() {
                  if (confirm('Mark all recommended purchases as purchased? This will move new orders to "in process" and update inventory.')) {
                      try {
                          // Get all purchase recommendations
                          const purchases = [];
                          document.querySelectorAll('.purchase-qty').forEach(input => {
                              const quantity = parseInt(input.value) || 0;
                              if (quantity > 0) {
                                  purchases.push({
                                      material_id: parseInt(input.dataset.materialId),
                                      quantity: quantity
                                  });
                              }
                          });
                          
                          if (purchases.length === 0) {
                              alert('No purchases to process.');
                              return;
                          }

                          await axios.post('/api/tooling/mark-purchased', { purchases });
                          
                          alert('Purchases marked as completed! Orders moved to process.');
                          await this.loadData();
                          await this.loadPurchaseOrders();
                      } catch (error) {
                          console.error('Error marking purchases:', error);
                          alert('Error processing purchases. Please try again.');
                      }
                  }
              }

              async loadOrdersInProcess() {
                  const content = \`
                      <div class="bg-white p-6 rounded-lg shadow-md">
                          <h2 class="text-2xl font-bold mb-6">Orders in Process</h2>
                          <p class="text-gray-600 mb-6">Jobs that are currently in production. Materials are allocated and cannot be used for other orders until completion.</p>
                          
                          \${await this.getInProcessOrdersList()}
                      </div>
                  \`;

                  document.getElementById('app').innerHTML = content;
              }

              async getInProcessOrdersList() {
                  const inProcessJobs = this.jobs.filter(job => job.status === 'in_process');
                  
                  if (inProcessJobs.length === 0) {
                      return '<div class="text-center py-8"><i class="fas fa-cogs text-gray-400 text-4xl mb-4"></i><p class="text-lg text-gray-600">No jobs currently in process.</p></div>';
                  }

                  return \`
                      <div class="space-y-4">
                          \${inProcessJobs.map(job => \`
                              <div class="border rounded-lg p-4 bg-blue-50 border-blue-200">
                                  <div class="flex justify-between items-start">
                                      <div>
                                          <h3 class="text-lg font-bold">\${job.job_name}</h3>
                                          <p class="text-sm text-gray-600">Started: \${new Date(job.created_at).toLocaleDateString()}</p>
                                          <p class="text-sm text-gray-600">Materials: \${job.materials_summary || 'No materials assigned'}</p>
                                      </div>
                                      <div class="text-right">
                                          <button onclick="toolingTracker.completeJob(\${job.id})" 
                                                  class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm mr-2">
                                              <i class="fas fa-check mr-1"></i>Complete
                                          </button>
                                          <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                              In Process
                                          </span>
                                      </div>
                                  </div>
                              </div>
                          \`).join('')}
                      </div>
                  \`;
              }

              async completeJob(jobId) {
                  if (confirm('Mark this job as completed? This will free up allocated materials.')) {
                      try {
                          await axios.put(\`/api/tooling/jobs/\${jobId}/complete\`);
                          
                          alert('Job completed successfully! Materials have been released.');
                          await this.loadData();
                          await this.loadOrdersInProcess();
                      } catch (error) {
                          console.error('Error completing job:', error);
                          alert('Error completing job. Please try again.');
                      }
                  }
              }
          }

          // Initialize the app
          const toolingTracker = new ToolingTracker();
        </script>
    </body>
    </html>
  `)
})

// API Routes

// Get all materials
app.get('/api/tooling/materials', async (c) => {
  const { env } = c;
  const { results } = await env.DB.prepare(`
    SELECT * FROM materials 
    WHERE tool_type = 'Tooling' 
    ORDER BY supplier, name
  `).all();
  
  return c.json(results);
});

// Update material
app.put('/api/tooling/materials/:id', async (c) => {
  const { env } = c;
  const materialId = c.req.param('id');
  const updates = await c.req.json();
  
  // Build dynamic update query
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = fields.map(field => `${field} = ?`).join(', ');
  
  await env.DB.prepare(`
    UPDATE materials 
    SET ${setClause}
    WHERE id = ?
  `).bind(...values, materialId).run();
  
  return c.json({ success: true });
});

// Get inventory with material details
app.get('/api/tooling/inventory', async (c) => {
  const { env } = c;
  
  const { results } = await env.DB.prepare(`
    SELECT 
      i.*,
      m.name as material_name,
      m.minimum_on_hand,
      m.cost_per_unit,
      m.supplier
    FROM inventory i
    JOIN materials m ON i.material_id = m.id
    WHERE m.tool_type = 'Tooling'
    ORDER BY m.supplier, m.name
  `).all();
  
  return c.json(results);
});

// Update inventory
app.put('/api/tooling/inventory/:id', async (c) => {
  const { env } = c;
  const inventoryId = c.req.param('id');
  const { on_hand } = await c.req.json();
  
  await env.DB.prepare(`
    UPDATE inventory 
    SET on_hand = ?, last_updated = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(on_hand, inventoryId).run();
  
  return c.json({ success: true });
});

// Get jobs with materials summary
app.get('/api/tooling/jobs', async (c) => {
  const { env } = c;
  
  const { results: jobs } = await env.DB.prepare(`
    SELECT * FROM jobs 
    WHERE tool_type = 'Tooling' 
    ORDER BY created_at DESC
  `).all();
  
  // Get materials for each job
  for (const job of jobs) {
    const { results: jobMaterials } = await env.DB.prepare(`
      SELECT 
        jm.quantity,
        m.name as material_name
      FROM job_materials jm
      JOIN materials m ON jm.material_id = m.id
      WHERE jm.job_id = ?
    `).bind(job.id).all();
    
    job.materials_summary = jobMaterials.map(jm => `${jm.material_name} (${jm.quantity})`).join(',');
  }
  
  return c.json(jobs);
});

// Create new job order (does NOT allocate materials until purchased)
app.post('/api/tooling/jobs', async (c) => {
  const { env } = c;
  const { job_name, tool_type, materials } = await c.req.json();
  
  try {
    // Create job with 'new' status (no allocation yet)
    const jobResult = await env.DB.prepare(`
      INSERT INTO jobs (job_name, tool_type, status) 
      VALUES (?, ?, 'new')
    `).bind(job_name, tool_type || 'Tooling').run();
    
    const jobId = jobResult.meta.last_row_id;
    
    // Add materials to job (NO allocation to inventory yet)
    for (const material of materials) {
      if (material.quantity > 0) {
        await env.DB.prepare(`
          INSERT INTO job_materials (job_id, material_id, quantity) 
          VALUES (?, ?, ?)
        `).bind(jobId, material.material_id, material.quantity).run();
      }
    }
    
    return c.json({ success: true, job_id: jobId });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete job order
app.delete('/api/tooling/jobs/:id', async (c) => {
  const { env } = c;
  const jobId = c.req.param('id');
  
  try {
    // Delete job materials first (foreign key constraint)
    await env.DB.prepare(`DELETE FROM job_materials WHERE job_id = ?`).bind(jobId).run();
    
    // Delete job
    await env.DB.prepare(`DELETE FROM jobs WHERE id = ?`).bind(jobId).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Complete job (move from in_process to completed and free up materials)
app.put('/api/tooling/jobs/:id/complete', async (c) => {
  const { env } = c;
  const jobId = c.req.param('id');
  
  try {
    // Get job materials to free up allocation
    const { results: jobMaterials } = await env.DB.prepare(`
      SELECT material_id, quantity FROM job_materials WHERE job_id = ?
    `).bind(jobId).all();
    
    // Free up allocated materials
    for (const jm of jobMaterials) {
      await env.DB.prepare(`
        UPDATE inventory 
        SET allocated = allocated - ?, last_updated = CURRENT_TIMESTAMP
        WHERE material_id = ?
      `).bind(jm.quantity, jm.material_id).run();
    }
    
    // Mark job as completed
    await env.DB.prepare(`
      UPDATE jobs 
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(jobId).run();
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// CORRECTED Purchase Recommendations Algorithm
app.get('/api/tooling/purchase-recommendations', async (c) => {
  const { env } = c;
  
  // Get all materials with current inventory
  const { results: materials } = await env.DB.prepare(`
    SELECT 
      m.*,
      i.on_hand,
      i.allocated
    FROM materials m
    JOIN inventory i ON m.id = i.material_id
    WHERE m.tool_type = 'Tooling'
    ORDER BY m.supplier, m.name
  `).all();
  
  // Get new orders quantities (not allocated yet)
  const { results: newOrderQuantities } = await env.DB.prepare(`
    SELECT 
      jm.material_id,
      SUM(jm.quantity) as new_order_quantity
    FROM job_materials jm
    JOIN jobs j ON jm.job_id = j.id
    WHERE j.status = 'new' AND j.tool_type = 'Tooling'
    GROUP BY jm.material_id
  `).all();
  
  // Create map for new order quantities
  const newOrderMap = new Map();
  newOrderQuantities.forEach(item => {
    newOrderMap.set(item.material_id, item.new_order_quantity || 0);
  });
  
  // Prepare material data for calculation
  const materialData = materials.map(material => {
    const available = material.on_hand - material.allocated;
    const newOrderQty = newOrderMap.get(material.id) || 0;
    
    return {
      material_id: material.id,
      material_name: material.name,
      supplier: material.supplier,
      on_hand: material.on_hand,
      allocated: material.allocated,
      available: available,
      new_order_quantity: newOrderQty,
      projected_available: available - newOrderQty,
      minimum_on_hand: material.minimum_on_hand,
      cost_per_unit: material.cost_per_unit,
      order_increment: material.order_increment || 1,
      recommended_purchase: 0
    };
  });
  
  // Group by supplier
  const rampfMaterials = materialData.filter(m => m.supplier === 'Rampf');
  const dixieplyMaterials = materialData.filter(m => m.supplier === 'DixiePly');
  
  const recommendations = [];
  
  // RAMPF MATERIALS WITH RATIO BALANCING
  const rampfNeedingPurchase = rampfMaterials.filter(m => m.projected_available < m.minimum_on_hand);
  
  if (rampfNeedingPurchase.length > 0) {
    // Step 1: Calculate absolute minimum purchases needed
    rampfNeedingPurchase.forEach(material => {
      const shortfall = material.minimum_on_hand - material.projected_available;
      material.recommended_purchase = Math.ceil(shortfall / material.order_increment) * material.order_increment;
    });
    
    // Step 2: Calculate minimum cost
    let totalCost = rampfNeedingPurchase.reduce((sum, m) => sum + (m.recommended_purchase * m.cost_per_unit), 0);
    
    // Step 3: If under $15K, balance ratios by iteratively improving the worst ratio
    if (totalCost < 15000) {
      const targetBudget = 15000;
      
      // Function to calculate ratio: (available - neworderquantity + suggested amount) / min on hand
      const calculateFinalRatio = (material) => {
        return (material.available - material.new_order_quantity + material.recommended_purchase) / material.minimum_on_hand;
      };
      
      // Iteratively balance ratios until we spend close to $15K
      while (totalCost < targetBudget) {
        // Calculate current ratios for all materials
        rampfNeedingPurchase.forEach(material => {
          material.current_ratio = calculateFinalRatio(material);
        });
        
        // Find the material with the LOWEST ratio (worst case)
        let worstMaterial = rampfNeedingPurchase.reduce((worst, current) => 
          current.current_ratio < worst.current_ratio ? current : worst
        );
        
        // Calculate cost to add one increment to worst material
        const incrementCost = worstMaterial.order_increment * worstMaterial.cost_per_unit;
        
        // If adding an increment would exceed budget, stop
        if (totalCost + incrementCost > targetBudget) {
          break;
        }
        
        // Add one increment to the worst material
        worstMaterial.recommended_purchase += worstMaterial.order_increment;
        totalCost += incrementCost;
        
        // Recalculate ratio
        worstMaterial.current_ratio = calculateFinalRatio(worstMaterial);
      }
      
      // If there's remaining budget, try to add to cheapest material
      const remainingBudget = targetBudget - totalCost;
      if (remainingBudget > 0) {
        const cheapestMaterial = rampfNeedingPurchase.reduce((cheapest, current) => 
          current.cost_per_unit < cheapest.cost_per_unit ? current : cheapest
        );
        
        const maxAdditionalUnits = Math.floor(remainingBudget / cheapestMaterial.cost_per_unit);
        if (maxAdditionalUnits > 0) {
          const alignedUnits = Math.floor(maxAdditionalUnits / cheapestMaterial.order_increment) * cheapestMaterial.order_increment;
          if (alignedUnits > 0) {
            cheapestMaterial.recommended_purchase += alignedUnits;
          }
        }
      }
    }
    
    // Create final recommendations for Rampf
    rampfNeedingPurchase.forEach(material => {
      const finalRatio = (material.available - material.new_order_quantity + material.recommended_purchase) / material.minimum_on_hand;
      const shortfall = Math.max(0, material.minimum_on_hand - material.projected_available);
      
      recommendations.push({
        material_id: material.material_id,
        material_name: material.material_name,
        supplier: material.supplier,
        on_hand: material.on_hand,
        allocated: material.allocated,
        available: material.available,
        new_order_quantity: material.new_order_quantity,
        projected_available: material.projected_available,
        minimum_on_hand: material.minimum_on_hand,
        ratio: finalRatio.toFixed(2),
        shortfall: shortfall,
        recommended_purchase: material.recommended_purchase,
        cost_per_unit: material.cost_per_unit,
        estimated_cost: material.recommended_purchase * material.cost_per_unit
      });
    });
  }
  
  // DIXIEPLY MATERIALS (simple minimum requirements)
  dixieplyMaterials.forEach(material => {
    if (material.projected_available < material.minimum_on_hand) {
      const shortfall = material.minimum_on_hand - material.projected_available;
      const recommendedPurchase = Math.ceil(shortfall / material.order_increment) * material.order_increment;
      const finalRatio = (material.available - material.new_order_quantity + recommendedPurchase) / material.minimum_on_hand;
      
      recommendations.push({
        material_id: material.material_id,
        material_name: material.material_name,
        supplier: material.supplier,
        on_hand: material.on_hand,
        allocated: material.allocated,
        available: material.available,
        new_order_quantity: material.new_order_quantity,
        projected_available: material.projected_available,
        minimum_on_hand: material.minimum_on_hand,
        ratio: finalRatio.toFixed(2),
        shortfall: shortfall,
        recommended_purchase: recommendedPurchase,
        cost_per_unit: material.cost_per_unit,
        estimated_cost: recommendedPurchase * material.cost_per_unit
      });
    }
  });
  
  // Group by supplier for response
  const groupedRecommendations = {
    Rampf: recommendations.filter(r => r.supplier === 'Rampf'),
    DixiePly: recommendations.filter(r => r.supplier === 'DixiePly'),
    totals: {
      Rampf: recommendations.filter(r => r.supplier === 'Rampf').reduce((sum, item) => sum + item.estimated_cost, 0),
      DixiePly: recommendations.filter(r => r.supplier === 'DixiePly').reduce((sum, item) => sum + item.estimated_cost, 0)
    }
  };
  
  return c.json(groupedRecommendations);
});

// Mark purchases as completed and allocate materials
app.post('/api/tooling/mark-purchased', async (c) => {
  const { env } = c;
  const { purchases } = await c.req.json();
  
  try {
    // Update inventory with purchased quantities
    for (const purchase of purchases) {
      await env.DB.prepare(`
        UPDATE inventory 
        SET on_hand = on_hand + ?
        WHERE material_id = ?
      `).bind(purchase.quantity, purchase.material_id).run();
    }
    
    // Move all 'new' jobs to 'in_process' and allocate materials
    const { results: newJobs } = await env.DB.prepare(`
      SELECT * FROM jobs WHERE status = 'new' AND tool_type = 'Tooling'
    `).all();
    
    for (const job of newJobs) {
      // Get job materials
      const { results: jobMaterials } = await env.DB.prepare(`
        SELECT material_id, quantity FROM job_materials WHERE job_id = ?
      `).bind(job.id).all();
      
      // Allocate materials
      for (const jm of jobMaterials) {
        await env.DB.prepare(`
          UPDATE inventory 
          SET allocated = allocated + ?, last_updated = CURRENT_TIMESTAMP
          WHERE material_id = ?
        `).bind(jm.quantity, jm.material_id).run();
      }
      
      // Update job status
      await env.DB.prepare(`
        UPDATE jobs SET status = 'in_process' WHERE id = ?
      `).bind(job.id).run();
    }
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app
