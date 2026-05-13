import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { roleAssignments } from '@b2b/db';
import type { Buyer, Permission, Role } from '@b2b/domain';
import { NotFoundError, isPermission } from '@b2b/domain';
import { adminQuery } from '../shopify/adminClient';
import { mapShopifyRoleToPermissions } from '../shopify/mappers/permissionMapper';
import type { AppVariables } from '../middleware/types';

export const userRoutes = new Hono<{ Variables: AppVariables }>();

interface CompanyContactsData {
  company: {
    contacts: {
      edges: Array<{
        node: {
          id: string;
          customer: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            email: string | null;
          };
          roleAssignments: {
            edges: Array<{
              node: { role: { name: string; id: string }; companyLocation: { id: string } };
            }>;
          };
        };
      }>;
    };
  } | null;
}

const COMPANY_CONTACTS_QUERY = `
  query CompanyContacts($id: ID!, $first: Int!) {
    company(id: $id) {
      contacts(first: $first) {
        edges {
          node {
            id
            customer { id firstName lastName email }
            roleAssignments(first: 10) {
              edges {
                node {
                  role { id name }
                  companyLocation { id }
                }
              }
            }
          }
        }
      }
    }
  }
`;

userRoutes.get('/users', async (c) => {
  const auth = c.var.auth!;

  // This query requires the read_customers Admin API scope. If the app lacks it,
  // Shopify returns ACCESS_DENIED — degrade to an empty list so the rest of the
  // admin UI (role grants, settings, etc.) keeps working.
  type ContactEdge = NonNullable<CompanyContactsData['company']>['contacts']['edges'][number];
  let contactEdges: ContactEdge[] = [];
  let scopeWarning = false;
  try {
    const data = await adminQuery<CompanyContactsData>(COMPANY_CONTACTS_QUERY, {
      id: auth.company.shopifyCompanyGid,
      first: 100,
    });
    contactEdges = data.company?.contacts.edges ?? [];
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/ACCESS_DENIED|FORBIDDEN|unauthorized|read_customers/i.test(msg)) {
      scopeWarning = true;
    } else {
      throw err;
    }
  }

  const buyerIds = contactEdges.map((e) => e.node.customer.id);
  const grants = new Map<string, Permission[]>();
  if (buyerIds.length > 0) {
    const rows = await c.var.db.select().from(roleAssignments);
    for (const r of rows) {
      if (!buyerIds.includes(r.buyerId)) continue;
      if (!isPermission(r.permission)) continue;
      const list = grants.get(r.buyerId) ?? [];
      list.push(r.permission);
      grants.set(r.buyerId, list);
    }
  }

  const items: Buyer[] = contactEdges.map((e) => {
    const node = e.node;
    const shopifyRole = node.roleAssignments.edges[0]?.node.role.name ?? 'Buyer';
    const shopifyPerms = mapShopifyRoleToPermissions(shopifyRole);
    const portalPerms = grants.get(node.customer.id) ?? [];
    const merged = [...new Set<Permission>([...shopifyPerms, ...portalPerms])];
    const role: Role = {
      id: node.roleAssignments.edges[0]?.node.role.id ?? 'buyer',
      name: shopifyRole,
      isAdmin: shopifyRole === 'Location admin' && portalPerms.includes('portal.admin'),
      permissions: merged,
    };
    return {
      id: node.customer.id,
      contactId: node.id,
      email: node.customer.email ?? '',
      firstName: node.customer.firstName ?? '',
      lastName: node.customer.lastName ?? '',
      role,
    };
  });

  return c.json({
    items,
    page: 1,
    pageSize: items.length,
    totalItems: items.length,
    totalPages: 1,
    // When the read_customers scope is missing, items is empty and the
    // portal renders a "scope missing" Alert based on this hint instead
    // of the generic empty-state copy.
    ...(scopeWarning ? { warning: 'scope-missing' as const } : {}),
  });
});

const COMPANY_ROLES_QUERY = `
  query CompanyRoles($id: ID!) {
    company(id: $id) {
      contactRoles(first: 50) { edges { node { id name } } }
    }
  }
`;

userRoutes.get('/roles', async (c) => {
  const auth = c.var.auth!;
  const data = await adminQuery<{
    company: { contactRoles: { edges: Array<{ node: { id: string; name: string } }> } } | null;
  }>(COMPANY_ROLES_QUERY, { id: auth.company.shopifyCompanyGid });
  const roles: Role[] = (data.company?.contactRoles.edges ?? []).map((e) => ({
    id: e.node.id,
    name: e.node.name,
    isAdmin: e.node.name === 'Location admin',
    permissions: mapShopifyRoleToPermissions(e.node.name),
  }));
  return c.json(roles);
});

const inviteSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  roleId: z.string().min(1),
});

userRoutes.post('/users', zValidator('json', inviteSchema), async (c) => {
  const auth = c.var.auth!;
  const input = c.req.valid('json');
  const data = await adminQuery<{
    companyContactCreate: { companyContact: { id: string; customer: { id: string } } | null; userErrors: { message: string }[] };
  }>(
    `mutation Invite($companyId: ID!, $input: CompanyContactInput!) {
       companyContactCreate(companyId: $companyId, input: $input) {
         companyContact { id customer { id } }
         userErrors { message }
       }
     }`,
    {
      companyId: auth.company.shopifyCompanyGid,
      input: { firstName: input.firstName, lastName: input.lastName, email: input.email },
    },
  );
  if (data.companyContactCreate.userErrors.length || !data.companyContactCreate.companyContact) {
    throw new NotFoundError('users.invite', data.companyContactCreate.userErrors.map((e) => e.message).join('; '));
  }
  return c.json({
    id: data.companyContactCreate.companyContact.customer.id,
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    role: { id: input.roleId, name: 'Buyer', isAdmin: false, permissions: mapShopifyRoleToPermissions('Buyer') },
  } satisfies Buyer);
});

const assignSchema = z.object({ roleId: z.string().min(1) });
// The `:id` segment is the Shopify CompanyContact GID (Buyer.contactId
// on the wire), not the underlying customer GID. B2B contact mutations
// operate on the contact, not the customer.
userRoutes.patch('/users/:id', zValidator('json', assignSchema), async (c) => {
  const auth = c.var.auth!;
  const contactId = c.req.param('id');
  const { roleId } = c.req.valid('json');
  const locationId = auth.location?.shopifyLocationGid ?? auth.company.locations[0]?.shopifyLocationGid;
  if (!locationId) throw new NotFoundError('users.assignRole', 'no-company-location');
  const result = await adminQuery<{
    companyContactAssignRole: { userErrors: { message: string }[] };
  }>(
    `mutation Assign($contactId: ID!, $roleId: ID!, $locationId: ID!) {
       companyContactAssignRole(
         companyContactId: $contactId,
         companyContactRoleId: $roleId,
         companyLocationId: $locationId
       ) { userErrors { message } }
     }`,
    { contactId, roleId, locationId },
  );
  if (result.companyContactAssignRole.userErrors.length) {
    throw new NotFoundError(
      'users.assignRole',
      result.companyContactAssignRole.userErrors.map((e) => e.message).join('; '),
    );
  }
  return c.body(null, 204);
});

userRoutes.delete('/users/:id', async (c) => {
  const contactId = c.req.param('id');
  const result = await adminQuery<{
    companyContactDelete: { deletedCompanyContactId?: string | null; userErrors: { message: string }[] };
  }>(
    `mutation Remove($contactId: ID!) {
       companyContactDelete(companyContactId: $contactId) {
         deletedCompanyContactId
         userErrors { message }
       }
     }`,
    { contactId },
  );
  if (result.companyContactDelete.userErrors.length) {
    throw new NotFoundError(
      'users.remove',
      result.companyContactDelete.userErrors.map((e) => e.message).join('; '),
    );
  }
  // Portal grants (role_assignments) are keyed by the customer GID,
  // which we don't have here. Stale rows are harmless — GET /users
  // intersects them with current company contacts before display —
  // and they intentionally re-apply if the same customer is later
  // re-added to the company.
  return c.body(null, 204);
});
