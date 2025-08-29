# Material Tracking System

## Project Overview
- **Name**: Material Tracking System
- **Goal**: Comprehensive inventory management for multiple business operations (Tooling, Core Kits, Glass Kits)
- **Features**: Multi-user network access, database storage, inventory management, order processing, purchase optimization

## URLs
- **Production**: (Will be set after Cloudflare Pages deployment)
- **GitHub**: (Will be set after repository creation)
- **API Base**: `/api`

## Data Architecture
- **Database**: Cloudflare D1 (SQLite-based distributed database)
- **Storage Services**: D1 for relational data storage
- **Data Models**: Materials, Inventory, Orders, Products with proper relationships
- **Data Flow**: Frontend → Hono API → D1 Database → Response

## Key Features Implemented
### ✅ Currently Completed Features
1. **Dashboard Tab**: Overview with material counts, low stock alerts, pending orders, inventory value
2. **Materials Management**: Add/view materials with system classification, supplier info, costs
3. **Inventory Management**: Real-time stock tracking with visual charts and minimum stock indicators
4. **Order Management**: Create, track, and manage orders with status updates and deletion capability
5. **Purchase Recommendations**: Intelligent purchasing suggestions with vendor-specific logic
6. **Product Management**: Define products with material ratio tracking
7. **Vendor-Based Purchasing**: Rampf $15k minimum order logic with ratio balancing
8. **Visual Analytics**: Chart.js integration for inventory and material visualization

### 📊 Functional Entry URIs
- `GET /` - Main application interface with 6-tab navigation
- `GET /api/materials` - Retrieve all materials with inventory data
- `POST /api/materials` - Add new material
- `GET /api/orders` - Retrieve all orders with material details
- `POST /api/orders` - Create new order
- `DELETE /api/orders/:id` - Delete pending order
- `PUT /api/orders/:id` - Update order status
- `GET /api/purchase-recommendations` - Get intelligent purchase suggestions
- `GET /api/dashboard` - Dashboard analytics data
- `GET /api/products` - Product management
- `POST /api/products` - Add new product
- `PUT /api/inventory/:id` - Update inventory levels

## Tech Stack
- **Backend**: Hono Framework + TypeScript
- **Frontend**: Vanilla JavaScript + TailwindCSS + Chart.js
- **Database**: Cloudflare D1 (SQLite)
- **Platform**: Cloudflare Pages/Workers
- **Development**: Wrangler + Vite + PM2

## User Guide
1. **Dashboard**: View system overview, alerts, and key metrics
2. **Materials**: Add and manage materials by system (Tooling/Core Kits/Glass Kits)
3. **Inventory**: Update stock levels and locations with visual feedback
4. **Orders**: Create, track, and manage purchase orders with status workflow
5. **Purchase Recommendations**: Review intelligent purchasing suggestions with vendor optimization
6. **Products**: Define products and their material ratios for planning

## Database Schema
- **Materials**: Core material definitions with costs and minimum stock levels
- **Inventory**: Real-time stock tracking with location management
- **Orders**: Purchase order workflow with status tracking
- **Products**: Product definitions with material ratio specifications

## Deployment Status
- **Platform**: Cloudflare Pages (Ready for deployment)
- **Status**: ✅ Development Complete / ⏳ Pending Deployment
- **Last Updated**: 2025-01-29

## Next Steps for Development
1. **Deploy to Cloudflare Pages**: Set up production hosting
2. **Create GitHub Repository**: Version control and CI/CD
3. **Production Database**: Configure D1 production database
4. **User Authentication**: Add user management (future enhancement)
5. **Advanced Analytics**: Enhanced reporting and forecasting features