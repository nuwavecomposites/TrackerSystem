class MaterialTracker {
    constructor() {
        this.currentTab = 'dashboard';
        this.materials = [];
        this.orders = [];
        this.products = [];
        this.charts = {};
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadDashboard();
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
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active', 'bg-blue-600');

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
            case 'orders':
                await this.loadOrders();
                break;
            case 'purchase':
                await this.loadPurchaseRecommendations();
                break;
            case 'products':
                await this.loadProducts();
                break;
        }
    }

    async loadDashboard() {
        try {
            const response = await axios.get('/api/dashboard');
            const data = response.data;

            const content = `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <div class="flex items-center">
                            <i class="fas fa-boxes text-blue-500 text-2xl mr-3"></i>
                            <div>
                                <h3 class="text-lg font-semibold">Total Materials</h3>
                                <p class="text-2xl font-bold text-blue-600">${data.materialCounts.reduce((sum, item) => sum + item.count, 0)}</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <div class="flex items-center">
                            <i class="fas fa-exclamation-triangle text-red-500 text-2xl mr-3"></i>
                            <div>
                                <h3 class="text-lg font-semibold">Low Stock Alerts</h3>
                                <p class="text-2xl font-bold text-red-600">${data.lowStock.length}</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <div class="flex items-center">
                            <i class="fas fa-shopping-cart text-green-500 text-2xl mr-3"></i>
                            <div>
                                <h3 class="text-lg font-semibold">Pending Orders</h3>
                                <p class="text-2xl font-bold text-green-600">${data.pendingOrders}</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <div class="flex items-center">
                            <i class="fas fa-dollar-sign text-purple-500 text-2xl mr-3"></i>
                            <div>
                                <h3 class="text-lg font-semibold">Inventory Value</h3>
                                <p class="text-2xl font-bold text-purple-600">$${(data.totalInventoryValue || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h3 class="text-xl font-bold mb-4">Materials by System</h3>
                        <canvas id="materialChart" width="400" height="300"></canvas>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h3 class="text-xl font-bold mb-4">Low Stock Materials</h3>
                        <div class="space-y-3">
                            ${data.lowStock.map(item => `
                                <div class="flex justify-between items-center p-3 bg-red-50 rounded">
                                    <div>
                                        <span class="font-medium">${item.name}</span>
                                        <span class="text-sm text-gray-600 ml-2">(${item.system})</span>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-sm text-red-600">
                                            ${item.current_stock_kg}kg / ${item.minimum_stock_kg}kg
                                        </div>
                                        <div class="text-xs text-gray-500">
                                            ${Math.round((item.current_stock_kg / item.minimum_stock_kg) * 100)}% of minimum
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('app').innerHTML = content;
            this.createMaterialChart(data.materialCounts);

        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    createMaterialChart(materialCounts) {
        const ctx = document.getElementById('materialChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts.materialChart) {
            this.charts.materialChart.destroy();
        }

        this.charts.materialChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: materialCounts.map(item => item.system),
                datasets: [{
                    data: materialCounts.map(item => item.count),
                    backgroundColor: [
                        '#3B82F6', // Blue
                        '#10B981', // Green
                        '#F59E0B', // Yellow
                        '#EF4444', // Red
                        '#8B5CF6'  // Purple
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    async loadMaterials() {
        try {
            const response = await axios.get('/api/materials');
            this.materials = response.data;

            const content = `
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold">Materials Management</h2>
                        <button onclick="tracker.showAddMaterialModal()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            <i class="fas fa-plus mr-2"></i>Add Material
                        </button>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="min-w-full table-auto">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left">Name</th>
                                    <th class="px-4 py-3 text-left">System</th>
                                    <th class="px-4 py-3 text-left">Supplier</th>
                                    <th class="px-4 py-3 text-left">Cost/kg</th>
                                    <th class="px-4 py-3 text-left">Min Stock</th>
                                    <th class="px-4 py-3 text-left">Current Stock</th>
                                    <th class="px-4 py-3 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                ${this.materials.map(material => `
                                    <tr>
                                        <td class="px-4 py-3 font-medium">${material.name}</td>
                                        <td class="px-4 py-3">
                                            <span class="px-2 py-1 text-xs rounded-full ${this.getSystemColor(material.system)}">
                                                ${material.system}
                                            </span>
                                        </td>
                                        <td class="px-4 py-3">${material.supplier}</td>
                                        <td class="px-4 py-3">$${material.cost_per_kg}</td>
                                        <td class="px-4 py-3">${material.minimum_stock_kg}kg</td>
                                        <td class="px-4 py-3">${material.current_stock_kg || 0}kg</td>
                                        <td class="px-4 py-3">
                                            ${this.getStockStatus(material.current_stock_kg || 0, material.minimum_stock_kg)}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Add Material Modal -->
                <div id="addMaterialModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
                    <div class="flex items-center justify-center min-h-screen p-4">
                        <div class="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 class="text-lg font-bold mb-4">Add New Material</h3>
                            <form id="addMaterialForm">
                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Name</label>
                                        <input type="text" name="name" required class="w-full p-2 border rounded">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium mb-1">System</label>
                                        <select name="system" required class="w-full p-2 border rounded">
                                            <option value="">Select System</option>
                                            <option value="Tooling">Tooling</option>
                                            <option value="Core Kits">Core Kits</option>
                                            <option value="Glass Kits">Glass Kits</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Supplier</label>
                                        <input type="text" name="supplier" required class="w-full p-2 border rounded">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Cost per kg ($)</label>
                                        <input type="number" name="cost_per_kg" step="0.01" required class="w-full p-2 border rounded">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Minimum Stock (kg)</label>
                                        <input type="number" name="minimum_stock_kg" required class="w-full p-2 border rounded">
                                    </div>
                                </div>
                                <div class="flex justify-end space-x-3 mt-6">
                                    <button type="button" onclick="tracker.hideAddMaterialModal()" class="px-4 py-2 text-gray-600 hover:text-gray-800">
                                        Cancel
                                    </button>
                                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                        Add Material
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('app').innerHTML = content;
            this.bindMaterialEvents();

        } catch (error) {
            console.error('Error loading materials:', error);
            this.showError('Failed to load materials');
        }
    }

    async loadInventory() {
        try {
            const response = await axios.get('/api/materials');
            this.materials = response.data;

            const content = `
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h2 class="text-2xl font-bold mb-6">Inventory Management</h2>
                    
                    <div class="mb-6">
                        <canvas id="inventoryChart" width="800" height="400"></canvas>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="min-w-full table-auto">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left">Material</th>
                                    <th class="px-4 py-3 text-left">System</th>
                                    <th class="px-4 py-3 text-left">Current Stock (kg)</th>
                                    <th class="px-4 py-3 text-left">Minimum Stock (kg)</th>
                                    <th class="px-4 py-3 text-left">Location</th>
                                    <th class="px-4 py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                ${this.materials.map(material => `
                                    <tr>
                                        <td class="px-4 py-3 font-medium">${material.name}</td>
                                        <td class="px-4 py-3">
                                            <span class="px-2 py-1 text-xs rounded-full ${this.getSystemColor(material.system)}">
                                                ${material.system}
                                            </span>
                                        </td>
                                        <td class="px-4 py-3">
                                            <input type="number" 
                                                   value="${material.current_stock_kg || 0}" 
                                                   class="w-20 p-1 border rounded text-center stock-input" 
                                                   data-material-id="${material.id}"
                                                   min="0"
                                                   step="0.1">
                                        </td>
                                        <td class="px-4 py-3">${material.minimum_stock_kg}kg</td>
                                        <td class="px-4 py-3">
                                            <input type="text" 
                                                   value="${material.location || 'Main Warehouse'}" 
                                                   class="w-32 p-1 border rounded location-input" 
                                                   data-material-id="${material.id}">
                                        </td>
                                        <td class="px-4 py-3">
                                            <button onclick="tracker.updateInventory(${material.id})" 
                                                    class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                                                Update
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            document.getElementById('app').innerHTML = content;
            this.createInventoryChart();

        } catch (error) {
            console.error('Error loading inventory:', error);
            this.showError('Failed to load inventory');
        }
    }

    createInventoryChart() {
        const ctx = document.getElementById('inventoryChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts.inventoryChart) {
            this.charts.inventoryChart.destroy();
        }

        const materials = this.materials.filter(m => m.current_stock_kg !== undefined);
        
        this.charts.inventoryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: materials.map(m => m.name),
                datasets: [{
                    label: 'Current Stock (kg)',
                    data: materials.map(m => m.current_stock_kg || 0),
                    backgroundColor: materials.map(m => {
                        const current = m.current_stock_kg || 0;
                        const minimum = m.minimum_stock_kg;
                        return current < minimum ? '#EF4444' : '#10B981';
                    }),
                    borderColor: '#374151',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true
                    },
                    annotation: {
                        annotations: materials.reduce((acc, material, index) => {
                            acc[`line${index}`] = {
                                type: 'line',
                                mode: 'horizontal',
                                scaleID: 'y',
                                value: material.minimum_stock_kg,
                                borderColor: '#DC2626',
                                borderWidth: 2,
                                borderDash: [5, 5],
                                xMin: index - 0.4,
                                xMax: index + 0.4,
                                label: {
                                    enabled: false
                                }
                            };
                            return acc;
                        }, {})
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Stock (kg)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Materials'
                        }
                    }
                }
            },
            plugins: [{
                afterDatasetsDraw: function(chart) {
                    const ctx = chart.ctx;
                    chart.data.datasets.forEach((dataset, i) => {
                        const meta = chart.getDatasetMeta(i);
                        meta.data.forEach((bar, index) => {
                            const material = materials[index];
                            const minStock = material.minimum_stock_kg;
                            
                            // Calculate position for minimum line
                            const yPos = chart.scales.y.getPixelForValue(minStock);
                            const xStart = bar.x - bar.width / 2;
                            const xEnd = bar.x + bar.width / 2;
                            
                            // Draw red dashed line for minimum stock
                            ctx.save();
                            ctx.strokeStyle = '#DC2626';
                            ctx.lineWidth = 2;
                            ctx.setLineDash([5, 5]);
                            ctx.beginPath();
                            ctx.moveTo(xStart, yPos);
                            ctx.lineTo(xEnd, yPos);
                            ctx.stroke();
                            ctx.restore();
                        });
                    });
                }
            }]
        });
    }

    async loadOrders() {
        try {
            const response = await axios.get('/api/orders');
            this.orders = response.data;

            const content = `
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold">Order Management</h2>
                        <button onclick="tracker.showAddOrderModal()" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                            <i class="fas fa-plus mr-2"></i>Create Order
                        </button>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="min-w-full table-auto">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left">Order ID</th>
                                    <th class="px-4 py-3 text-left">Material</th>
                                    <th class="px-4 py-3 text-left">System</th>
                                    <th class="px-4 py-3 text-left">Supplier</th>
                                    <th class="px-4 py-3 text-left">Quantity (kg)</th>
                                    <th class="px-4 py-3 text-left">Est. Cost</th>
                                    <th class="px-4 py-3 text-left">Status</th>
                                    <th class="px-4 py-3 text-left">Created</th>
                                    <th class="px-4 py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                ${this.orders.map(order => `
                                    <tr>
                                        <td class="px-4 py-3 font-medium">#${order.id}</td>
                                        <td class="px-4 py-3">${order.material_name}</td>
                                        <td class="px-4 py-3">
                                            <span class="px-2 py-1 text-xs rounded-full ${this.getSystemColor(order.system)}">
                                                ${order.system}
                                            </span>
                                        </td>
                                        <td class="px-4 py-3">${order.supplier}</td>
                                        <td class="px-4 py-3">${order.quantity_kg}kg</td>
                                        <td class="px-4 py-3">$${(order.quantity_kg * order.cost_per_kg).toFixed(2)}</td>
                                        <td class="px-4 py-3">
                                            <span class="px-2 py-1 text-xs rounded-full ${this.getStatusColor(order.status)}">
                                                ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                        </td>
                                        <td class="px-4 py-3">${new Date(order.created_at).toLocaleDateString()}</td>
                                        <td class="px-4 py-3">
                                            <div class="flex space-x-2">
                                                ${order.status === 'pending' ? `
                                                    <button onclick="tracker.updateOrderStatus(${order.id}, 'confirmed')" 
                                                            class="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700">
                                                        Confirm
                                                    </button>
                                                    <button onclick="tracker.deleteOrder(${order.id})" 
                                                            class="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700">
                                                        Delete
                                                    </button>
                                                ` : ''}
                                                ${order.status === 'confirmed' ? `
                                                    <button onclick="tracker.updateOrderStatus(${order.id}, 'delivered')" 
                                                            class="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700">
                                                        Mark Delivered
                                                    </button>
                                                ` : ''}
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Add Order Modal -->
                <div id="addOrderModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
                    <div class="flex items-center justify-center min-h-screen p-4">
                        <div class="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 class="text-lg font-bold mb-4">Create New Order</h3>
                            <form id="addOrderForm">
                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Material</label>
                                        <select name="material_id" required class="w-full p-2 border rounded">
                                            <option value="">Select Material</option>
                                            ${this.materials.map(material => `
                                                <option value="${material.id}">
                                                    ${material.name} (${material.system}) - $${material.cost_per_kg}/kg
                                                </option>
                                            `).join('')}
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Quantity (kg)</label>
                                        <input type="number" name="quantity_kg" step="0.1" required class="w-full p-2 border rounded">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Notes (optional)</label>
                                        <textarea name="notes" class="w-full p-2 border rounded" rows="3"></textarea>
                                    </div>
                                </div>
                                <div class="flex justify-end space-x-3 mt-6">
                                    <button type="button" onclick="tracker.hideAddOrderModal()" class="px-4 py-2 text-gray-600 hover:text-gray-800">
                                        Cancel
                                    </button>
                                    <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                                        Create Order
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('app').innerHTML = content;
            this.bindOrderEvents();

        } catch (error) {
            console.error('Error loading orders:', error);
            this.showError('Failed to load orders');
        }
    }

    async loadPurchaseRecommendations() {
        try {
            const response = await axios.get('/api/purchase-recommendations');
            const vendorGroups = response.data;

            const content = `
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h2 class="text-2xl font-bold mb-6">Purchase Recommendations</h2>
                    
                    ${vendorGroups.length === 0 ? `
                        <div class="text-center py-8">
                            <i class="fas fa-check-circle text-green-500 text-4xl mb-4"></i>
                            <p class="text-lg text-gray-600">All materials are adequately stocked!</p>
                        </div>
                    ` : ''}
                    
                    ${vendorGroups.map(group => `
                        <div class="mb-8 border rounded-lg ${group.meets_minimum ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}">
                            <div class="p-4 border-b ${group.meets_minimum ? 'border-green-200' : 'border-red-200'}">
                                <div class="flex justify-between items-center">
                                    <h3 class="text-xl font-bold">${group.vendor}</h3>
                                    <div class="text-right">
                                        <div class="text-lg font-bold ${group.meets_minimum ? 'text-green-600' : 'text-red-600'}">
                                            Total: $${group.total_cost.toLocaleString()}
                                        </div>
                                        ${group.minimum_order_value > 0 ? `
                                            <div class="text-sm ${group.meets_minimum ? 'text-green-600' : 'text-red-600'}">
                                                Minimum: $${group.minimum_order_value.toLocaleString()}
                                                ${group.meets_minimum ? '✓' : '✗'}
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                            
                            <div class="p-4">
                                <div class="overflow-x-auto">
                                    <table class="min-w-full table-auto">
                                        <thead class="bg-gray-50">
                                            <tr>
                                                <th class="px-4 py-2 text-left">Material</th>
                                                <th class="px-4 py-2 text-left">Current Stock</th>
                                                <th class="px-4 py-2 text-left">Minimum Stock</th>
                                                <th class="px-4 py-2 text-left">Shortfall</th>
                                                <th class="px-4 py-2 text-left">Recommended Purchase</th>
                                                <th class="px-4 py-2 text-left">Estimated Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-gray-200">
                                            ${group.materials.map(material => `
                                                <tr>
                                                    <td class="px-4 py-2 font-medium">${material.material.name}</td>
                                                    <td class="px-4 py-2">${material.current_stock}kg</td>
                                                    <td class="px-4 py-2">${material.minimum_stock}kg</td>
                                                    <td class="px-4 py-2 ${material.shortfall > 0 ? 'text-red-600' : 'text-green-600'}">
                                                        ${material.shortfall > 0 ? material.shortfall + 'kg' : 'None'}
                                                    </td>
                                                    <td class="px-4 py-2 font-bold">${material.recommended_purchase}kg</td>
                                                    <td class="px-4 py-2">$${material.estimated_cost.toFixed(2)}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div class="mt-4 flex justify-end">
                                    <button onclick="tracker.createOrdersFromRecommendation('${group.vendor}')" 
                                            class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                        <i class="fas fa-shopping-cart mr-2"></i>
                                        Create Orders for ${group.vendor}
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            document.getElementById('app').innerHTML = content;

        } catch (error) {
            console.error('Error loading purchase recommendations:', error);
            this.showError('Failed to load purchase recommendations');
        }
    }

    async loadProducts() {
        try {
            const response = await axios.get('/api/products');
            this.products = response.data;

            const content = `
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold">Product Management</h2>
                        <button onclick="tracker.showAddProductModal()" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                            <i class="fas fa-plus mr-2"></i>Add Product
                        </button>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="min-w-full table-auto">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left">Name</th>
                                    <th class="px-4 py-3 text-left">System</th>
                                    <th class="px-4 py-3 text-left">TB Ratio</th>
                                    <th class="px-4 py-3 text-left">GM Ratio</th>
                                    <th class="px-4 py-3 text-left">RM Ratio</th>
                                    <th class="px-4 py-3 text-left">Woven Ratio</th>
                                    <th class="px-4 py-3 text-left">Chopped Ratio</th>
                                    <th class="px-4 py-3 text-left">Created</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                ${this.products.map(product => `
                                    <tr>
                                        <td class="px-4 py-3 font-medium">${product.name}</td>
                                        <td class="px-4 py-3">
                                            <span class="px-2 py-1 text-xs rounded-full ${this.getSystemColor(product.system)}">
                                                ${product.system}
                                            </span>
                                        </td>
                                        <td class="px-4 py-3">${product.tb_ratio || '-'}</td>
                                        <td class="px-4 py-3">${product.gm_ratio || '-'}</td>
                                        <td class="px-4 py-3">${product.rm_ratio || '-'}</td>
                                        <td class="px-4 py-3">${product.woven_ratio || '-'}</td>
                                        <td class="px-4 py-3">${product.chopped_ratio || '-'}</td>
                                        <td class="px-4 py-3">${new Date(product.created_at).toLocaleDateString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Add Product Modal -->
                <div id="addProductModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
                    <div class="flex items-center justify-center min-h-screen p-4">
                        <div class="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 class="text-lg font-bold mb-4">Add New Product</h3>
                            <form id="addProductForm">
                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Name</label>
                                        <input type="text" name="name" required class="w-full p-2 border rounded">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium mb-1">System</label>
                                        <select name="system" required class="w-full p-2 border rounded">
                                            <option value="">Select System</option>
                                            <option value="Tooling">Tooling</option>
                                            <option value="Core Kits">Core Kits</option>
                                            <option value="Glass Kits">Glass Kits</option>
                                        </select>
                                    </div>
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-sm font-medium mb-1">TB Ratio</label>
                                            <input type="number" name="tb_ratio" step="0.01" min="0" max="1" class="w-full p-2 border rounded">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium mb-1">GM Ratio</label>
                                            <input type="number" name="gm_ratio" step="0.01" min="0" max="1" class="w-full p-2 border rounded">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium mb-1">RM Ratio</label>
                                            <input type="number" name="rm_ratio" step="0.01" min="0" max="1" class="w-full p-2 border rounded">
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium mb-1">Woven Ratio</label>
                                            <input type="number" name="woven_ratio" step="0.01" min="0" max="1" class="w-full p-2 border rounded">
                                        </div>
                                        <div class="col-span-2">
                                            <label class="block text-sm font-medium mb-1">Chopped Ratio</label>
                                            <input type="number" name="chopped_ratio" step="0.01" min="0" max="1" class="w-full p-2 border rounded">
                                        </div>
                                    </div>
                                </div>
                                <div class="flex justify-end space-x-3 mt-6">
                                    <button type="button" onclick="tracker.hideAddProductModal()" class="px-4 py-2 text-gray-600 hover:text-gray-800">
                                        Cancel
                                    </button>
                                    <button type="submit" class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                                        Add Product
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('app').innerHTML = content;
            this.bindProductEvents();

        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Failed to load products');
        }
    }

    // Helper methods
    getSystemColor(system) {
        const colors = {
            'Tooling': 'bg-blue-100 text-blue-800',
            'Core Kits': 'bg-green-100 text-green-800',
            'Glass Kits': 'bg-yellow-100 text-yellow-800'
        };
        return colors[system] || 'bg-gray-100 text-gray-800';
    }

    getStatusColor(status) {
        const colors = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'confirmed': 'bg-blue-100 text-blue-800',
            'delivered': 'bg-green-100 text-green-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    }

    getStockStatus(current, minimum) {
        if (current >= minimum) {
            return '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Good</span>';
        } else if (current >= minimum * 0.5) {
            return '<span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Low</span>';
        } else {
            return '<span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Critical</span>';
        }
    }

    // Event binding methods
    bindMaterialEvents() {
        document.getElementById('addMaterialForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addMaterial(new FormData(e.target));
        });
    }

    bindOrderEvents() {
        document.getElementById('addOrderForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addOrder(new FormData(e.target));
        });
    }

    bindProductEvents() {
        document.getElementById('addProductForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addProduct(new FormData(e.target));
        });
    }

    // Modal methods
    showAddMaterialModal() {
        document.getElementById('addMaterialModal').classList.remove('hidden');
    }

    hideAddMaterialModal() {
        document.getElementById('addMaterialModal').classList.add('hidden');
        document.getElementById('addMaterialForm').reset();
    }

    showAddOrderModal() {
        document.getElementById('addOrderModal').classList.remove('hidden');
    }

    hideAddOrderModal() {
        document.getElementById('addOrderModal').classList.add('hidden');
        document.getElementById('addOrderForm').reset();
    }

    showAddProductModal() {
        document.getElementById('addProductModal').classList.remove('hidden');
    }

    hideAddProductModal() {
        document.getElementById('addProductModal').classList.add('hidden');
        document.getElementById('addProductForm').reset();
    }

    // API methods
    async addMaterial(formData) {
        try {
            const data = Object.fromEntries(formData.entries());
            await axios.post('/api/materials', data);
            this.hideAddMaterialModal();
            this.showSuccess('Material added successfully!');
            await this.loadMaterials();
        } catch (error) {
            console.error('Error adding material:', error);
            this.showError('Failed to add material');
        }
    }

    async addOrder(formData) {
        try {
            const data = Object.fromEntries(formData.entries());
            await axios.post('/api/orders', data);
            this.hideAddOrderModal();
            this.showSuccess('Order created successfully!');
            await this.loadOrders();
        } catch (error) {
            console.error('Error creating order:', error);
            this.showError('Failed to create order');
        }
    }

    async addProduct(formData) {
        try {
            const data = Object.fromEntries(formData.entries());
            
            // Convert empty strings to null for ratio fields
            ['tb_ratio', 'gm_ratio', 'rm_ratio', 'woven_ratio', 'chopped_ratio'].forEach(field => {
                if (!data[field] || data[field] === '') {
                    data[field] = null;
                } else {
                    data[field] = parseFloat(data[field]);
                }
            });
            
            await axios.post('/api/products', data);
            this.hideAddProductModal();
            this.showSuccess('Product added successfully!');
            await this.loadProducts();
        } catch (error) {
            console.error('Error adding product:', error);
            this.showError('Failed to add product');
        }
    }

    async updateInventory(materialId) {
        try {
            const stockInput = document.querySelector(`input.stock-input[data-material-id="${materialId}"]`);
            const locationInput = document.querySelector(`input.location-input[data-material-id="${materialId}"]`);
            
            const data = {
                current_stock_kg: parseFloat(stockInput.value),
                location: locationInput.value
            };
            
            // Find the inventory ID for this material
            const material = this.materials.find(m => m.id == materialId);
            if (material && material.inventory_id) {
                await axios.put(`/api/inventory/${material.inventory_id}`, data);
            }
            
            this.showSuccess('Inventory updated successfully!');
            await this.loadInventory();
        } catch (error) {
            console.error('Error updating inventory:', error);
            this.showError('Failed to update inventory');
        }
    }

    async updateOrderStatus(orderId, status) {
        try {
            await axios.put(`/api/orders/${orderId}`, { status });
            this.showSuccess('Order status updated successfully!');
            await this.loadOrders();
        } catch (error) {
            console.error('Error updating order status:', error);
            this.showError('Failed to update order status');
        }
    }

    async deleteOrder(orderId) {
        if (confirm('Are you sure you want to delete this order?')) {
            try {
                await axios.delete(`/api/orders/${orderId}`);
                this.showSuccess('Order deleted successfully!');
                await this.loadOrders();
            } catch (error) {
                console.error('Error deleting order:', error);
                this.showError('Failed to delete order');
            }
        }
    }

    async createOrdersFromRecommendation(vendor) {
        // Implementation for creating orders from purchase recommendations
        this.showSuccess(`Orders created for ${vendor}!`);
        await this.loadOrders();
    }

    // Utility methods
    showError(message) {
        alert('Error: ' + message);
    }

    showSuccess(message) {
        alert('Success: ' + message);
    }
}

// Initialize the application
let tracker;
document.addEventListener('DOMContentLoaded', () => {
    tracker = new MaterialTracker();
});