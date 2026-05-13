import { z } from 'zod';

// z.coerce.boolean() converts string "false" -> true (Boolean("false") === true).
// Use this custom transform instead for env-var booleans.
const booleanFromEnv = (defaultVal: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined || v === '') return defaultVal;
      return !['false', '0', 'no', 'off'].includes(v.toLowerCase());
    });

const schema = z.object({
  PORT: z.coerce.number().default(8787),
  PUBLIC_PORTAL_URL: z.string().url().default('http://localhost:3000'),
  SESSION_SIGNING_KEY: z.string().min(32),
  DATABASE_URL: z.string().min(1),

  SHOPIFY_SHOP_DOMAIN: z.string().min(1),
  SHOPIFY_STORE_ID: z.string().min(1),
  SHOPIFY_CLIENT_ID: z.string().min(1),
  SHOPIFY_CLIENT_SECRET: z.string().min(1),
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: z.string().min(1),
  SHOPIFY_STOREFRONT_API_VERSION: z.string().default('2024-10'),
  SHOPIFY_ADMIN_API_VERSION: z.string().default('2024-10'),
  SHOPIFY_CAA_CLIENT_ID: z.string().min(1),
  SHOPIFY_CAA_CLIENT_SECRET: z.string().optional(),
  SHOPIFY_CAA_REDIRECT_URI: z.string().url(),

  FEATURE_QUOTES: booleanFromEnv(true),
  FEATURE_APPROVALS: booleanFromEnv(false),
  FEATURE_SHOPPING_LISTS: booleanFromEnv(true),
  FEATURE_INVOICES: booleanFromEnv(false),
  FEATURE_MULTI_TIER_HIERARCHY: booleanFromEnv(false),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export const env = (): Env => {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  cached = parsed.data;
  return cached;
};

export const features = () => {
  const e = env();
  return {
    quotes: e.FEATURE_QUOTES,
    approvals: e.FEATURE_APPROVALS,
    shoppingLists: e.FEATURE_SHOPPING_LISTS,
    invoices: e.FEATURE_INVOICES,
    multiTierHierarchy: e.FEATURE_MULTI_TIER_HIERARCHY,
  };
};
