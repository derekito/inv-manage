## Shopify Inventory Management

Build a Shopify app that tracks inventory levels from two different Shopify stores and "merges" that data into a very basic warehouse system. The warehouse system tracks products along with their assigned shelf and bin locations. The system allows users to look up real-time inventory levels for any product in the warehouse location. 

The app will be built using the Shopify API and the Next.js framework. The app will be deployed to Vercel.

## Features

- Track inventory levels from two different Shopify stores
– Listen for inventory change events from both stores (for example, via the inventory_levels/update webhook).
- Merge inventory data into a warehouse system
- Track products along with their assigned shelf and bin locations
- Allow users to look up real-time inventory levels for any product in the warehouse location
- Allow users to add, edit, and delete products in the warehouse system
- Allow users update inventory though the front-end per product or as an import via csv file

## Project Setup

### Prerequisites
- Node.js (version X.X.X)
- Shopify Partner Account
- Firebase Account
- Vercel Account

### Installation
1. Clone the repository
```bash
git clone [repository-url]
cd inv-manage
```
2. Install dependencies
```bash
npm install
```
3. Set up environment variables
```bash
cp .env.example .env.local
```
4. Configure Firebase credentials
5. Configure Shopify API credentials

## Architecture

### Tech Stack
- Next.js (Frontend & API routes)
- Firebase Firestore (Database)
- Shopify API (Store integration)
  - Store One: Naked Armor
  - Store Two: Grown Man Shave
- Vercel (Deployment)

### Environment Setup
1. Copy the `.env.example` file to create a new `.env` file:
```bash
cp .env.example .env
```

2. Fill in your Firebase credentials in `.env`:
- Get these from your Firebase Console
- Project Settings > General > Your Apps
- Create a new Web App if needed

3. Fill in your Shopify credentials in `.env`:
- Get these from your Shopify Partner account
- Apps > App Setup
- API credentials section

4. Never commit the `.env` file to version control

### System Design
[Include a basic system diagram showing the flow between Shopify stores, webhooks, and your warehouse system]

## Mapping Shopify Data to Warehouse Records:

- When a webhook event is received, determine which store sent it (using request headers or by using a different endpoint per store).
- Update your local inventory records. Each record might include: 
- Shopify store identifier which will be handled by product sku`
- Current inventory quantity
- Warehouse details: shelf and bin location

## API Documentation

### Webhooks
- `/api/webhooks/store1/inventory` - Handles inventory updates from Store 1
- `/api/webhooks/store2/inventory` - Handles inventory updates from Store 2

### REST Endpoints
- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Create new inventory item
- `PUT /api/inventory/:sku` - Update inventory item
- `DELETE /api/inventory/:sku` - Delete inventory item

## Security Considerations
- Shopify webhook verification
- Firebase security rules
- API authentication
- Rate limiting
- Data validation

## Development Workflow

### Local Development
```bash
npm run dev
```

### Testing
```bash
npm run test
```

### Deployment
```bash
npm run build
npm run deploy
```

## Database Schema & Structure

Use Firebase Firestore for the database.

### Firestore Collections

#### Products Collection
- `SKU` (string, primary key)
- `ProductName` (string)
- `WarehouseName` (string)
- `Loc1` (string)
- `Loc2` (string)
- `Loc3` (string)
- `Loc4` (string)
- `OnHand` (number)
- `LastUpdated` (timestamp)
- `StoreIdentifier` (string)
- `ShopifyProductId` (string)
- `Status` (string)

#### Audit Collection
- Track inventory changes
- Record user actions
- Maintain history of updates

#### Warehouse Collection
- Warehouse configuration
- Location mappings
- Storage capacity

## Features Roadmap

### Phase 1 - Core Features
- Basic inventory tracking
- Webhook integration
- Warehouse location management

### Phase 2 - Enhanced Features
- Batch updates via CSV
- Inventory alerts
- Advanced search
- Reporting dashboard

### Phase 3 - Optimization
- Performance improvements
- Analytics integration
- Mobile optimization

## Troubleshooting

### Common Issues
- Webhook verification failures
- Inventory sync delays
- Database connection issues

### Logging
- Error logging strategy
- Monitoring setup
- Debug procedures

## Contributing

### Development Guidelines
- Code style guide
- Pull request process
- Testing requirements

### Branch Strategy
- main: production
- develop: development
- feature/*: new features
- hotfix/*: urgent fixes

## License

[Specify your license type]