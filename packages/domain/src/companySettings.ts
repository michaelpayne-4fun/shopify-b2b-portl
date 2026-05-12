export interface CompanySettings {
  companyId: string;
  quoteDefaultExpiryDays: number;
  quoteMirrorToDraftOrder: boolean;
  quoteAllowCustomExpiry: boolean;
  shoppingListDefaultIsShared: boolean;
  shoppingListMaxItems: number;
  shoppingListMaxListsPerUser: number;
  displayNameOverride?: string;
  supportEmail?: string;
  logoUrl?: string;
  defaultLocationId?: string;
  updatedAt: string;
  updatedBy?: string;
}
