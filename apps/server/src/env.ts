import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Shopify store
  SHOPIFY_SHOP_DOMAIN: z.string().min(1),

  // Admin API — client credentials grant (replaces static access token)
  SHOPIFY_CLIENT_ID: z.string().min(1),
  SHOPIFY_CLIENT_SECRET: z.string().min(1),

  // Storefront API — static token, unaffected by admin auth change
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: z.string().min(1),

  // Customer Account API OAuth — separate flow, unaffected
  SHOPIFY_CAA_CLIENT_ID: z.string().min(1),
  SHOPIFY_CAA_CLIENT_SECRET: z.string().min(1),
});

export type Env = z.infer<typeof EnvSchema>;

export const env = EnvSchema.parse(process.env);
