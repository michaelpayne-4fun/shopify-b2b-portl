import type {
  Address,
  Buyer,
  Cart,
  Company,
  Order,
  Product,
  Quote,
  Role,
  ShoppingList,
  Invoice,
  ContractPrice,
} from '@/domain/models';

const ADMIN_ROLE: Role = {
  id: 'role-admin',
  name: 'Company Admin',
  isAdmin: true,
  permissions: [],
};

const BUYER_ROLE: Role = {
  id: 'role-buyer',
  name: 'Buyer',
  isAdmin: false,
  permissions: [
    'account.view',
    'account.update',
    'orders.view',
    'orders.reorder',
    'quotes.view',
    'quotes.create',
    'quotes.update',
    'quotes.submit',
    'cart.view',
    'cart.update',
    'checkout.begin',
    'addresses.view',
    'company.view',
    'shoppingLists.view',
    'shoppingLists.manage',
  ],
};

const SENIOR_BUYER_ROLE: Role = {
  id: 'role-senior-buyer',
  name: 'Senior Buyer',
  isAdmin: false,
  permissions: [
    ...BUYER_ROLE.permissions,
    'orders.viewCompany',
    'addresses.manage',
    'users.view',
  ],
};

export const SEED_ROLES: Role[] = [ADMIN_ROLE, SENIOR_BUYER_ROLE, BUYER_ROLE];

export const SEED_BUYERS: Buyer[] = [
  {
    id: 'buyer-1',
    email: 'admin@acme.test',
    firstName: 'Alex',
    lastName: 'Admin',
    role: ADMIN_ROLE,
    locale: 'en-US',
  },
  {
    id: 'buyer-2',
    email: 'senior@acme.test',
    firstName: 'Sam',
    lastName: 'Senior',
    role: SENIOR_BUYER_ROLE,
    locale: 'en-US',
  },
  {
    id: 'buyer-3',
    email: 'buyer@acme.test',
    firstName: 'Brooke',
    lastName: 'Buyer',
    role: BUYER_ROLE,
    locale: 'en-US',
  },
];

const HQ_ADDRESS: Address = {
  id: 'addr-hq',
  label: 'HQ',
  firstName: 'Acme',
  lastName: 'Receiving',
  company: 'Acme Industrial',
  line1: '500 Commerce Way',
  city: 'Austin',
  region: 'TX',
  postalCode: '78701',
  countryCode: 'US',
  phone: '+1-512-555-0100',
  isDefaultBilling: true,
  isDefaultShipping: true,
};

const WAREHOUSE_ADDRESS: Address = {
  id: 'addr-warehouse',
  label: 'West Warehouse',
  firstName: 'Acme',
  lastName: 'Warehouse',
  company: 'Acme Industrial',
  line1: '12 Industrial Blvd',
  city: 'Reno',
  region: 'NV',
  postalCode: '89501',
  countryCode: 'US',
};

export const SEED_ADDRESSES: Address[] = [HQ_ADDRESS, WAREHOUSE_ADDRESS];

export const SEED_COMPANY: Company = {
  id: 'company-acme',
  name: 'Acme Industrial',
  status: 'approved',
  defaultLocationId: 'loc-hq',
  locations: [
    { id: 'loc-hq', name: 'Headquarters', address: HQ_ADDRESS, isDefault: true },
    { id: 'loc-west', name: 'West Warehouse', address: WAREHOUSE_ADDRESS, isDefault: false },
  ],
};

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'BOLT-001',
    name: 'Industrial Bolt — 1/2 in',
    images: [{ url: 'https://placehold.co/200x200?text=BOLT-001', alt: 'Bolt' }],
    options: [],
    defaultVariantId: 'var-1',
    variants: [
      {
        id: 'var-1',
        sku: 'BOLT-001',
        name: '1/2 in',
        attributes: { size: '1/2 in' },
        price: { amount: 1.25, currency: 'USD' },
        inventory: { available: 5000, backorderable: true },
        minOrderQty: 10,
      },
    ],
  },
  {
    id: 'prod-2',
    sku: 'NUT-002',
    name: 'Hex Nut — 1/2 in',
    images: [{ url: 'https://placehold.co/200x200?text=NUT-002', alt: 'Nut' }],
    options: [],
    defaultVariantId: 'var-2',
    variants: [
      {
        id: 'var-2',
        sku: 'NUT-002',
        name: '1/2 in',
        attributes: { size: '1/2 in' },
        price: { amount: 0.75, currency: 'USD' },
        inventory: { available: 12000, backorderable: false },
      },
    ],
  },
  {
    id: 'prod-3',
    sku: 'GASKET-003',
    name: 'Rubber Gasket — 2 in',
    images: [{ url: 'https://placehold.co/200x200?text=GASKET-003', alt: 'Gasket' }],
    options: [],
    defaultVariantId: 'var-3',
    variants: [
      {
        id: 'var-3',
        sku: 'GASKET-003',
        name: '2 in',
        attributes: { size: '2 in' },
        price: { amount: 3.5, currency: 'USD' },
        inventory: { available: 250, backorderable: true },
      },
    ],
  },
];

export const SEED_CONTRACT_PRICES: ContractPrice[] = [
  {
    variantId: 'var-1',
    unitPrice: { amount: 1.0, currency: 'USD' },
    tiers: [
      { minQuantity: 100, unitPrice: { amount: 0.95, currency: 'USD' } },
      { minQuantity: 1000, unitPrice: { amount: 0.85, currency: 'USD' } },
    ],
  },
];

export const SEED_ORDERS: Order[] = [
  {
    id: 'order-1001',
    number: '1001',
    placedAt: '2026-04-22T15:14:00Z',
    status: 'shipped',
    buyerId: 'buyer-3',
    companyId: 'company-acme',
    locationId: 'loc-hq',
    poNumber: 'PO-44219',
    subtotal: { amount: 145.0, currency: 'USD' },
    total: { amount: 145.0, currency: 'USD' },
    shippingAddress: HQ_ADDRESS,
    billingAddress: HQ_ADDRESS,
    lines: [
      {
        id: 'ol-1',
        sku: 'BOLT-001',
        name: 'Industrial Bolt — 1/2 in',
        quantity: 100,
        unitPrice: { amount: 0.95, currency: 'USD' },
        lineTotal: { amount: 95.0, currency: 'USD' },
      },
      {
        id: 'ol-2',
        sku: 'NUT-002',
        name: 'Hex Nut — 1/2 in',
        quantity: 50,
        unitPrice: { amount: 1.0, currency: 'USD' },
        lineTotal: { amount: 50.0, currency: 'USD' },
      },
    ],
  },
  {
    id: 'order-1002',
    number: '1002',
    placedAt: '2026-05-02T09:30:00Z',
    status: 'awaitingFulfillment',
    buyerId: 'buyer-2',
    companyId: 'company-acme',
    locationId: 'loc-west',
    poNumber: 'PO-44312',
    subtotal: { amount: 320.0, currency: 'USD' },
    total: { amount: 320.0, currency: 'USD' },
    lines: [
      {
        id: 'ol-3',
        sku: 'GASKET-003',
        name: 'Rubber Gasket — 2 in',
        quantity: 100,
        unitPrice: { amount: 3.2, currency: 'USD' },
        lineTotal: { amount: 320.0, currency: 'USD' },
      },
    ],
  },
];

export const SEED_QUOTES: Quote[] = [
  {
    id: 'quote-q1',
    number: 'Q-2026-001',
    status: 'submitted',
    createdAt: '2026-05-05T10:00:00Z',
    updatedAt: '2026-05-05T10:00:00Z',
    buyerId: 'buyer-2',
    companyId: 'company-acme',
    subtotal: { amount: 2400.0, currency: 'USD' },
    total: { amount: 2400.0, currency: 'USD' },
    lines: [
      {
        id: 'ql-1',
        sku: 'BOLT-001',
        variantId: 'var-1',
        name: 'Industrial Bolt — 1/2 in',
        quantity: 3000,
        unitPrice: { amount: 0.8, currency: 'USD' },
        lineTotal: { amount: 2400.0, currency: 'USD' },
      },
    ],
  },
];

export const SEED_SHOPPING_LISTS: ShoppingList[] = [
  {
    id: 'sl-1',
    name: 'Monthly resupply',
    description: 'Standing order for HQ',
    isShared: true,
    ownerId: 'buyer-2',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-04-30T00:00:00Z',
    items: [
      { id: 'sli-1', sku: 'BOLT-001', variantId: 'var-1', name: 'Industrial Bolt — 1/2 in', quantity: 200 },
      { id: 'sli-2', sku: 'NUT-002', variantId: 'var-2', name: 'Hex Nut — 1/2 in', quantity: 200 },
    ],
  },
];

export const SEED_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    number: 'INV-2026-0001',
    status: 'open',
    issuedAt: '2026-04-30T00:00:00Z',
    dueAt: '2026-05-30T00:00:00Z',
    amountDue: { amount: 320.0, currency: 'USD' },
    amountPaid: { amount: 0, currency: 'USD' },
    total: { amount: 320.0, currency: 'USD' },
    orderId: 'order-1002',
  },
];

export const buildEmptyCart = (currency: string): Cart => ({
  id: 'cart-active',
  items: [],
  currency,
  updatedAt: new Date().toISOString(),
  totals: {
    subtotal: { amount: 0, currency },
    total: { amount: 0, currency },
  },
});
