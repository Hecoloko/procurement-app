
import { NavSection, Vendor, Cart, Order, Product, Property, Unit, AdminUser, Role, CommunicationThread, Message, ItemApprovalStatus, Permission } from './types';
import {
  DashboardIcon,
  CartIcon,
  ApprovalIcon,
  POIcon,
  ShipmentIcon,
  ReceivingIcon,
  TransactionIcon,
  SupplierIcon,
  IntegrationIcon,
  SettingsIcon,
  DocumentReportIcon,
  PropertiesIcon,
  CommunicationIcon,
} from './components/Icons';

export const NAVIGATION_DATA: NavSection[] = [
  {
    title: 'OPERATIONAL',
    items: [
      { name: 'Dashboard', icon: DashboardIcon },
      { name: 'Product Dashboard', icon: PropertiesIcon }, // Reusing PropertiesIcon for now or find a better one
      { name: 'My Carts', icon: CartIcon },
      { name: 'Properties', icon: PropertiesIcon },
      { name: 'Communications', icon: CommunicationIcon },
    ],
  },
  {
    title: 'ORDER TRACKING',
    items: [
      { name: 'All Orders', icon: POIcon },
      { name: 'Approvals', icon: ApprovalIcon },
      { name: 'Purchase Orders', icon: POIcon },
      { name: 'Receiving', icon: ReceivingIcon },
    ],
  },
  {
    title: 'FINANCIAL',
    items: [
      { name: 'Transactions', icon: TransactionIcon },
      { name: 'Reports', icon: DocumentReportIcon },
      { name: 'Suppliers', icon: SupplierIcon },
    ],
  },
  {
    title: 'SYSTEM SETTINGS',
    items: [
      { name: 'Integrations', icon: IntegrationIcon },
      { name: 'Company Settings', icon: SettingsIcon },
    ],
  },
];

export const CART_CATEGORIES = [
  'Maintenance',
  'Office Supplies',
  'Janitorial',
  'Marketing',
  'IT & Electronics',
  'Furniture',
  'Kitchen & Breakroom',
  'Safety & Security',
];


export const ALL_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    companyId: 'comp-1',
    name: 'Downtown Tower',
    address: {
      street: '123 Main St',
      city: 'Metropolis',
      state: 'NY',
      zip: '10001'
    }
  },
  {
    id: 'prop-2',
    companyId: 'comp-1',
    name: 'Suburban Plaza',
    address: {
      street: '456 Oak Ave',
      city: 'Smallville',
      state: 'KS',
      zip: '66002'
    }
  }
];

export const DUMMY_UNITS: Unit[] = [
  { id: 'unit-1', propertyId: 'prop-1', name: 'Suite 100' },
  { id: 'unit-2', propertyId: 'prop-1', name: 'Suite 101' },
  { id: 'unit-3', propertyId: 'prop-1', name: 'Floor 2' },
  { id: 'unit-4', propertyId: 'prop-1', name: 'Lobby' },
  { id: 'unit-5', propertyId: 'prop-2', name: 'Unit A' },
  { id: 'unit-6', propertyId: 'prop-2', name: 'Unit B' },
  { id: 'unit-7', propertyId: 'prop-2', name: 'Common Area' },
];

export const ALL_VENDORS: Vendor[] = [
  {
    id: 'vendor-1', companyId: 'comp-1', name: 'Office Depot', phone: '800-463-3768', email: 'support@officedepot.com',
    accounts: [
      { id: 'vacc-1-1', propertyId: 'prop-1', accountNumber: 'ACCT-OD-DT987' },
      { id: 'vacc-1-2', propertyId: 'prop-2', accountNumber: 'ACCT-OD-SP123' },
    ]
  },
  {
    id: 'vendor-2', companyId: 'comp-1', name: 'Grainger', phone: '800-323-0620', email: 'info@grainger.com',
    accounts: [
      { id: 'vacc-2-1', propertyId: 'prop-1', accountNumber: 'GRG-DT-456' },
    ]
  },
  { id: 'vendor-3', companyId: 'comp-1', name: 'CDW', phone: '800-800-4239', email: 'sales@cdw.com' },
  { id: 'vendor-4', companyId: 'comp-1', name: 'Vistaprint', phone: '866-207-4955', email: 'support@vistaprint.com' },
  { id: 'vendor-5', companyId: 'comp-1', name: 'Staples', phone: '800-333-3330', email: 'support@staples.com' },
  { id: 'vendor-6', companyId: 'comp-1', name: 'Uline', phone: '800-295-5510', email: 'customer.service@uline.com' },
  {
    id: 'vendor-7', companyId: 'comp-1', name: 'Amazon Business', phone: '888-281-3847', email: 'business@amazon.com',
    accounts: [
      { id: 'vacc-7-1', propertyId: 'prop-1', accountNumber: 'AMZN-BUS-DT' },
    ]
  },
  { id: 'vendor-8', companyId: 'comp-1', name: 'Home Depot Pro', phone: '866-412-6726', email: 'pro@homedepot.com' },
  { id: 'vendor-9', companyId: 'comp-1', name: 'Westlake', phone: '800-569-0589', 'email': 'service@westlakepro.com' },
  { id: 'vendor-10', companyId: 'comp-1', name: 'HD Supply', phone: '877-610-6912', email: 'customerservice@hdsupply.com' }
];

export const DUMMY_CARTS: Cart[] = [
  {
    id: 'cart-01', companyId: 'comp-1', workOrderId: 'WO-0001-0001', name: 'Monthly Office Supplies', type: 'Recurring', itemCount: 2, totalCost: 120.50, status: 'Draft', lastModified: '2024-07-28', propertyId: 'prop-1', category: 'Office Supplies',
    frequency: 'Monthly', startDate: '2024-08-01', dayOfMonth: 1,
    items: [
      { id: 'item-1-1', name: 'A4 Paper Ream (500 sheets)', sku: 'PAP-A4-500', quantity: 10, unitPrice: 5.50, totalPrice: 55.00, note: 'For executive printer only' },
      { id: 'item-1-2', name: 'Black Ballpoint Pens (Box of 50)', sku: 'PEN-BLK-50', quantity: 5, unitPrice: 13.10, totalPrice: 65.50 },
    ]
  },
  {
    id: 'cart-02', companyId: 'comp-1', workOrderId: 'WO-0002-0002', name: 'New Hire Workstations', type: 'Standard', itemCount: 3, totalCost: 6800.00, status: 'Ready for Review', lastModified: '2024-07-27', propertyId: 'prop-1',
    items: [
      { id: 'item-2-1', name: 'Ergonomic Office Chair', sku: 'CHR-ERGO-01', quantity: 4, unitPrice: 350.00, totalPrice: 1400.00, note: 'With extra lumbar support option' },
      { id: 'item-2-2', name: 'Sit-Stand Electric Desk', sku: 'DSK-SST-ELC', quantity: 4, unitPrice: 550.00, totalPrice: 2200.00 },
      { id: 'item-2-3', name: '32" 4K Monitor', sku: 'MON-4K-32', quantity: 8, unitPrice: 400.00, totalPrice: 3200.00 },
    ]
  },
  {
    id: 'cart-03', companyId: 'comp-1', workOrderId: 'WO-0003-0003', name: 'Q4 Marketing Event Swag', type: 'Scheduled', itemCount: 2, totalCost: 3200.50, status: 'Draft', lastModified: '2024-07-25', scheduledDate: '2024-10-15', propertyId: 'prop-2', category: 'Marketing',
    items: [
      { id: 'item-3-1', name: 'Branded T-Shirts (Medium)', sku: 'SWG-TS-M', quantity: 150, unitPrice: 10.00, totalPrice: 1500.00 },
      { id: 'item-3-2', name: 'Custom Water Bottles', sku: 'SWG-WTR-BTL', quantity: 200, unitPrice: 8.50, totalPrice: 1700.50, note: 'Logo placement on the side' },
    ]
  },
  {
    id: 'cart-04', companyId: 'comp-1', workOrderId: 'WO-0004-0004', name: 'Kitchen Restock', type: 'Standard', itemCount: 1, totalCost: 125.00, status: 'Submitted', lastModified: '2024-07-22', propertyId: 'prop-1',
    items: [
      { id: 'item-4-1', name: 'Gourmet Coffee Beans (5lb)', sku: 'COF-GRMT-5LB', quantity: 5, unitPrice: 25.00, totalPrice: 125.00 },
    ]
  },
  {
    id: 'cart-05', companyId: 'comp-1', workOrderId: 'WO-0005-0005', name: 'IT Department - Laptops', type: 'Standard', itemCount: 2, totalCost: 9500.00, status: 'Draft', lastModified: '2024-07-29', propertyId: 'prop-1',
    items: [
      { id: 'item-5-1', name: '16" Pro Laptop', sku: 'LAP-PRO-16', quantity: 5, unitPrice: 1800.00, totalPrice: 9000.00 },
      { id: 'item-5-2', name: 'Laptop Docking Station', sku: 'LAP-DOCK-01', quantity: 5, unitPrice: 100.00, totalPrice: 500.00 },
    ]
  },
  {
    id: 'cart-06', companyId: 'comp-1', workOrderId: 'WO-0006-0006', name: 'Bi-weekly Fruit Delivery', type: 'Recurring', itemCount: 1, totalCost: 80.00, status: 'Submitted', lastModified: '2024-07-26', propertyId: 'prop-2', category: 'Kitchen & Breakroom',
    frequency: 'Bi-weekly', startDate: '2024-08-02', dayOfWeek: 5, // Friday
    items: [
      { id: 'item-6-1', name: 'Office Fruit Basket', sku: 'FRT-BSK-LG', quantity: 1, unitPrice: 80.00, totalPrice: 80.00 },
    ]
  },
  {
    id: 'cart-07', companyId: 'comp-1', workOrderId: 'WO-0007-0007', name: 'Office Expansion Furniture', type: 'Scheduled', itemCount: 3, totalCost: 4500.00, status: 'Ready for Review', lastModified: '2024-07-24', scheduledDate: '2024-09-01', propertyId: 'prop-2', category: 'Furniture',
    items: [
      { id: 'item-7-1', name: 'Conference Table', sku: 'TBL-CONF-10P', quantity: 1, unitPrice: 1200.00, totalPrice: 1200.00 },
      { id: 'item-7-2', name: 'Conference Chairs (Set of 10)', sku: 'CHR-CONF-10', quantity: 1, unitPrice: 2500.00, totalPrice: 2500.00 },
      { id: 'item-7-3', name: 'Whiteboard (72x48 inch)', sku: 'WHT-BRD-72', quantity: 2, unitPrice: 400.00, totalPrice: 800.00 },
    ]
  },
  {
    id: 'cart-08', companyId: 'comp-1', workOrderId: 'WO-0008-0008', name: 'Server Room Upgrade', type: 'Standard', itemCount: 4, totalCost: 25700.00, status: 'Draft', lastModified: '2024-07-30', propertyId: 'prop-1',
    items: [
      { id: 'item-8-1', name: 'Rack Server 2U', sku: 'SRV-RACK-2U', quantity: 4, unitPrice: 5000.00, totalPrice: 20000.00 },
      { id: 'item-8-2', name: '48-Port Network Switch', sku: 'NET-SW-48', quantity: 2, unitPrice: 1500.00, totalPrice: 3000.00 },
      { id: 'item-8-3', name: 'UPS Battery Backup', sku: 'UPS-2200VA', quantity: 2, unitPrice: 1200.00, totalPrice: 2400.00 },
      { id: 'item-8-4', name: 'Server Rack Cabinet', sku: 'SRV-RACK-CAB', quantity: 1, unitPrice: 300.00, totalPrice: 300.00 },
    ]
  },
];

export const DUMMY_ORDERS: Order[] = [
  // ... existing orders
];

const sampleCategories = {
  "Building Materials": ["Lumber & Composites", "Doors & Windows", "Flooring", "Roofing"],
  "Plumbing": ["Pipes & Fittings", "Faucets", "Toilets", "Water Heaters"],
  "Electrical": ["Wiring & Conduit", "Lighting", "Breakers & Fuses", "Outlets & Switches"],
  "Office Supplies": ["Paper Products", "Writing Instruments", "Desk Organizers", "Filing & Storage"],
  "Furniture": ["Chairs", "Desks", "Tables", "Storage Units"],
  "Electronics": ["Computers", "Monitors", "Printers & Scanners", "Networking"]
};

const sampleTags = ["eco-friendly", "best-seller", "new-arrival", "heavy-duty", "clearance", "bulk-discount", "premium", "basic"];

const generateProducts = (count: number): Product[] => {
  const products: Product[] = [];
  const primaryCats = Object.keys(sampleCategories);

  for (let i = 1; i <= count; i++) {
    const primaryCategory = primaryCats[i % primaryCats.length];
    const secondaryCats = sampleCategories[primaryCategory as keyof typeof sampleCategories];
    const secondaryCategory = secondaryCats[i % secondaryCats.length];
    const vendor = ALL_VENDORS[i % ALL_VENDORS.length];
    const price = 5 + Math.random() * 2000;

    const numTags = Math.floor(Math.random() * 3); // 0, 1, or 2 tags
    const productTags: string[] = [];
    while (productTags.length < numTags) {
      const tag = sampleTags[Math.floor(Math.random() * sampleTags.length)];
      if (!productTags.includes(tag)) {
        productTags.push(tag);
      }
    }
    if (price < 20) productTags.push('basic');
    if (price > 1000) productTags.push('premium');

    products.push({
      id: `prod-${1000 + i}`,
      companyId: 'comp-1', // Default to comp-1 for demo
      name: `${secondaryCategory.slice(0, -1)} - Model #${100 + i}`,
      sku: `${primaryCategory.slice(0, 3).toUpperCase()}-${secondaryCategory.slice(0, 3).toUpperCase()}-${1000 + i}`,
      description: `A high-quality item for all your needs. From ${vendor.name}.`,
      unitPrice: parseFloat(price.toFixed(2)),
      imageUrl: `https://picsum.photos/seed/product${i}/400/300`,
      vendorId: vendor.id,
      primaryCategory: primaryCategory,
      secondaryCategory: secondaryCategory,
      rating: 3 + Math.floor(Math.random() * 3),
      tags: productTags,
    });
  }
  return products;
}

export const PRODUCT_CATALOG_DATA: Product[] = [
  ...generateProducts(200)
];


export const DUMMY_USERS: AdminUser[] = [
  { id: 'user-1', companyId: 'comp-1', name: 'John Doe', email: 'john.doe@test.com', roleId: 'role-1', propertyIds: ['prop-1', 'prop-2'], avatarUrl: 'https://picsum.photos/id/433/200/200', status: 'Active' },
  { id: 'user-2', companyId: 'comp-1', name: 'Alice Johnson', email: 'alice.j@test.com', roleId: 'role-2', propertyIds: ['prop-1'], avatarUrl: 'https://picsum.photos/id/434/200/200', status: 'Active' },
  { id: 'user-3', companyId: 'comp-1', name: 'Bob Williams', email: 'bob.w@test.com', roleId: 'role-3', propertyIds: ['prop-2'], avatarUrl: 'https://picsum.photos/id/435/200/200', status: 'Active' },
  { id: 'user-4', companyId: 'comp-1', name: 'David Green', email: 'david.g@test.com', roleId: 'role-3', propertyIds: ['prop-1', 'prop-2'], avatarUrl: 'https://picsum.photos/id/436/200/200', status: 'Active' },
];

export const DUMMY_ROLES: Role[] = [
  {
    id: 'role-0',
    name: 'Owner',
    description: 'Platform Owner: Full access to all companies and system settings.',
    permissions: [
      'dashboard:view', 'carts:view', 'properties:view', 'communications:view', 'orders:view', 'approvals:view',
      'purchaseOrders:view', 'receiving:view', 'transactions:view', 'reports:view', 'suppliers:view',
      'integrations:view', 'settings:view', 'carts:create', 'carts:edit', 'carts:delete', 'carts:submit',
      'orders:procure', 'purchaseOrders:create', 'purchaseOrders:edit', 'receiving:edit', 'approvals:approve',
      'suppliers:create', 'suppliers:edit', 'users:view', 'users:create', 'users:edit', 'users:delete', 'users:impersonate',
      'roles:view', 'roles:create', 'roles:edit', 'roles:delete', 'workflows:view', 'workflows:edit',
      'notifications:view', 'notifications:edit', 'companyProperties:view', 'companyProperties:edit'
    ]
  },
  {
    id: 'role-1',
    name: 'Master Admin',
    description: 'Do everything: Full access to all features, including order requests, approvals, and viewing all orders across all properties.',
    permissions: [
      'dashboard:view', 'carts:view', 'properties:view', 'communications:view', 'orders:view', 'approvals:view',
      'purchaseOrders:view', 'receiving:view', 'transactions:view', 'reports:view', 'suppliers:view',
      'integrations:view', 'settings:view', 'carts:create', 'carts:edit', 'carts:delete', 'carts:submit',
      'orders:procure', 'purchaseOrders:create', 'purchaseOrders:edit', 'receiving:edit', 'approvals:approve',
      'suppliers:create', 'suppliers:edit', 'users:view', 'users:create', 'users:edit', 'users:delete', 'users:impersonate',
      'roles:view', 'roles:create', 'roles:edit', 'roles:delete', 'workflows:view', 'workflows:edit',
      'notifications:view', 'notifications:edit', 'companyProperties:view', 'companyProperties:edit'
    ]
  },
  {
    id: 'role-2',
    name: 'Basic User',
    description: 'Order/request items: Can request items for various categories and view only their own orders.',
    permissions: [
      'dashboard:view', 'carts:view-own', 'carts:create', 'carts:edit-own', 'carts:delete-own', 'carts:submit',
      'orders:view-own', 'communications:view'
    ]
  },
  {
    id: 'role-3',
    name: 'Reviewer',
    description: 'Review basic user requests: Can review and suggest modifications to item requests but cannot finalize orders.',
    permissions: [
      'dashboard:view', 'carts:view', 'carts:edit', 'approvals:view', 'orders:view', 'communications:view'
    ]
  },
  {
    id: 'role-4',
    name: 'Approver',
    description: 'Final Approve: Can review and approve/reject requests submitted by Basic Users and Reviewers.',
    permissions: [
      'dashboard:view', 'approvals:view', 'approvals:approve', 'orders:view', 'communications:view', 'carts:view'
    ]
  },
  {
    id: 'role-5',
    name: 'Purchaser',
    description: 'Place Orders: Can finalize and place approved orders for all categories.',
    permissions: [
      'dashboard:view', 'orders:view', 'orders:procure', 'purchaseOrders:view', 'purchaseOrders:create',
      'purchaseOrders:edit', 'receiving:view', 'receiving:edit', 'suppliers:view', 'communications:view'
    ]
  }
];

export const DUMMY_THREADS: CommunicationThread[] = [
  { id: 'thread-1', companyId: 'comp-1', subject: 'Re: New Hire Workstations', participantIds: ['user-1', 'user-2'], orderId: 'ord-1701', lastMessageTimestamp: '2024-07-28T10:05:00Z', lastMessageSnippet: 'Sounds good, please proceed with the approval...', isRead: true },
  { id: 'thread-2', companyId: 'comp-1', participantIds: ['user-1', 'user-3'], orderId: 'ord-2213', lastMessageTimestamp: '2024-07-20T14:30:00Z', lastMessageSnippet: 'Okay, I\'ve dispatched the emergency plumber...', isRead: false },
  { id: 'thread-3', companyId: 'comp-1', subject: 'Q4 Budget Planning', participantIds: ['user-1', 'user-8'], lastMessageTimestamp: '2024-07-29T11:00:00Z', lastMessageSnippet: 'Let\'s schedule a meeting for next week to finalize.', isRead: true },
];

export const DUMMY_MESSAGES: Message[] = [
  { id: 'msg-1', threadId: 'thread-1', senderId: 'user-2', content: 'Hi John, the cart for the new hire workstations is ready for your approval. Please review when you have a moment. Order ID is #ord-1701', timestamp: '2024-07-28T10:00:00Z' },
  { id: 'msg-2', threadId: 'thread-1', senderId: 'user-1', content: 'Looks good @Alice Johnson. Total cost is a bit high, but understandable. I have a question about the monitors.', timestamp: '2024-07-28T10:02:00Z' },
  { id: 'msg-3', threadId: 'thread-1', senderId: 'user-1', content: 'Sounds good, please proceed with the approval when ready.', timestamp: '2024-07-28T10:05:00Z' },
  { id: 'msg-4', threadId: 'thread-2', senderId: 'user-3', content: 'We have a major pipe burst at Suburban Plaza. Need to get an emergency plumber out here ASAP. I created an order #ord-2213 for tracking.', timestamp: '2024-07-20T14:25:00Z' },
  { id: 'msg-5', threadId: 'thread-2', senderId: 'user-1', content: 'Okay, I\'ve dispatched the emergency plumber from Grainger. They should be there within the hour.', timestamp: '2024-07-20T14:30:00Z' },
];

export const DEMO_USERS = [
  // Company 1
  { email: 'alexa.reserva.demo_v3@gmail.com', name: 'Alexa Reserva (C1 - Master Admin)', company: 'Company 1' },
  { email: 'miguel.santos.demo_v3@gmail.com', name: 'Miguel Santos (C1 - Basic User)', company: 'Company 1' },
  { email: 'jasmine.torres.demo_v3@gmail.com', name: 'Jasmine Torres (C1 - Basic User)', company: 'Company 1' },
  { email: 'kevin.delacruz.demo_v3@gmail.com', name: 'Kevin Dela Cruz (C1 - Reviewer)', company: 'Company 1' },
  { email: 'ricardo.morales.demo_v3@gmail.com', name: 'Ricardo Morales (C1 - Reviewer)', company: 'Company 1' },
  { email: 'sophia.lim.demo_v3@gmail.com', name: 'Sophia Lim (C1 - Approver)', company: 'Company 1' },
  { email: 'daniel.reyes.demo_v3@gmail.com', name: 'Daniel Reyes (C1 - Approver)', company: 'Company 1' },
  // Company 2
  { email: 'amelia.cruz.demo_v3@gmail.com', name: 'Amelia Cruz (C2 - Master Admin)', company: 'Company 2' },
  { email: 'noah.velasco.demo_v3@gmail.com', name: 'Noah Velasco (C2 - Basic User)', company: 'Company 2' },
  { email: 'patricia.rojas.demo_v3@gmail.com', name: 'Patricia Rojas (C2 - Basic User)', company: 'Company 2' },
  { email: 'carlos.garcia.demo_v3@gmail.com', name: 'Carlos Garcia (C2 - Reviewer)', company: 'Company 2' },
  { email: 'nicole.uy.demo_v3@gmail.com', name: 'Nicole Uy (C2 - Reviewer)', company: 'Company 2' },
  { email: 'andrew.mendoza.demo_v3@gmail.com', name: 'Andrew Mendoza (C2 - Approver)', company: 'Company 2' },
  { email: 'francesca.rivera.demo_v3@gmail.com', name: 'Francesca Rivera (C2 - Approver)', company: 'Company 2' },
];
