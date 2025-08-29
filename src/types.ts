export interface Material {
  id: number;
  name: string;
  system: 'Tooling' | 'Core Kits' | 'Glass Kits';
  supplier: string;
  cost_per_kg: number;
  minimum_stock_kg: number;
  created_at: string;
}

export interface InventoryItem {
  id: number;
  material_id: number;
  current_stock_kg: number;
  location: string;
  last_updated: string;
  material?: Material;
}

export interface Order {
  id: number;
  material_id: number;
  quantity_kg: number;
  status: 'pending' | 'confirmed' | 'delivered';
  created_at: string;
  notes?: string;
  material?: Material;
}

export interface Product {
  id: number;
  name: string;
  system: 'Tooling' | 'Core Kits' | 'Glass Kits';
  tb_ratio?: number;
  gm_ratio?: number;
  rm_ratio?: number;
  woven_ratio?: number;
  chopped_ratio?: number;
  created_at: string;
}

export interface PurchaseRecommendation {
  material: Material;
  current_stock: number;
  minimum_stock: number;
  shortfall: number;
  recommended_purchase: number;
  estimated_cost: number;
}

export interface VendorPurchaseGroup {
  vendor: string;
  materials: PurchaseRecommendation[];
  total_cost: number;
  minimum_order_value: number;
  meets_minimum: boolean;
}

export interface CloudflareBindings {
  DB: D1Database;
}