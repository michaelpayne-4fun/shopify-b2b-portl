import { eq } from 'drizzle-orm';
import type { Database } from '@b2b/db';
import { companySettings } from '@b2b/db';
import type { CompanySettings } from '@b2b/domain';

const rowToDomain = (r: typeof companySettings.$inferSelect): CompanySettings => ({
  companyId: r.companyId,
  quoteDefaultExpiryDays: r.quoteDefaultExpiryDays,
  quoteMirrorToDraftOrder: r.quoteMirrorToDraftOrder,
  quoteAllowCustomExpiry: r.quoteAllowCustomExpiry,
  shoppingListDefaultIsShared: r.shoppingListDefaultIsShared,
  shoppingListMaxItems: r.shoppingListMaxItems,
  shoppingListMaxListsPerUser: r.shoppingListMaxListsPerUser,
  displayNameOverride: r.displayNameOverride ?? undefined,
  supportEmail: r.supportEmail ?? undefined,
  logoUrl: r.logoUrl ?? undefined,
  defaultLocationId: r.defaultLocationId ?? undefined,
  updatedAt: r.updatedAt.toISOString(),
  updatedBy: r.updatedBy ?? undefined,
});

export const ensureCompanySettings = async (db: Database, companyId: string): Promise<void> => {
  const existing = await db.select().from(companySettings).where(eq(companySettings.companyId, companyId)).limit(1);
  if (existing[0]) return;
  await db.insert(companySettings).values({ companyId });
};

export const getCompanySettings = async (db: Database, companyId: string): Promise<CompanySettings> => {
  await ensureCompanySettings(db, companyId);
  const rows = await db.select().from(companySettings).where(eq(companySettings.companyId, companyId)).limit(1);
  return rowToDomain(rows[0]);
};

export const updateCompanySettings = async (
  db: Database,
  args: { companyId: string; patch: Partial<CompanySettings>; updatedBy: string },
): Promise<CompanySettings> => {
  await db.update(companySettings)
    .set({
      quoteDefaultExpiryDays: args.patch.quoteDefaultExpiryDays,
      quoteMirrorToDraftOrder: args.patch.quoteMirrorToDraftOrder,
      quoteAllowCustomExpiry: args.patch.quoteAllowCustomExpiry,
      shoppingListDefaultIsShared: args.patch.shoppingListDefaultIsShared,
      shoppingListMaxItems: args.patch.shoppingListMaxItems,
      shoppingListMaxListsPerUser: args.patch.shoppingListMaxListsPerUser,
      displayNameOverride: args.patch.displayNameOverride,
      supportEmail: args.patch.supportEmail,
      logoUrl: args.patch.logoUrl,
      defaultLocationId: args.patch.defaultLocationId,
      updatedAt: new Date(),
      updatedBy: args.updatedBy,
    })
    .where(eq(companySettings.companyId, args.companyId));
  return getCompanySettings(db, args.companyId);
};
