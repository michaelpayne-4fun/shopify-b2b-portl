/* eslint-disable no-irregular-whitespace */

export const CUSTOMER_ME_QUERY = `
  query CustomerMe {
    customer {
      id
      firstName
      lastName
      emailAddress { emailAddress }
      phoneNumber { phoneNumber }
      defaultAddress { id }
    }
  }
`;

export const COMPANY_FOR_CUSTOMER_QUERY = `
  query CompanyForCustomer($customerId: ID!) {
    customer(id: $customerId) {
      id
      companyContactProfiles {
        company {
          id
          name
          locations(first: 50) {
            edges {
              node {
                id
                name
                shippingAddress {
                  firstName lastName company address1 address2
                  city provinceCode zip countryCode phone
                }
              }
            }
          }
        }
        roleAssignments(first: 50) {
          edges {
            node {
              role { name }
              companyLocation { id }
            }
          }
        }
      }
    }
  }
`;

export const PRODUCTS_SEARCH_QUERY = `
  query ProductsSearch($query: String, $first: Int!, $after: String) {
    products(query: $query, first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id title handle description
          images(first: 5) { edges { node { url altText } } }
          options { id name values }
          variants(first: 25) {
            edges {
              node {
                id sku title
                price { amount currencyCode }
                quantityAvailable
                currentlyNotInStock
                selectedOptions { name value }
              }
            }
          }
        }
      }
    }
  }
`;

export const CART_CREATE_MUTATION = `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${'%CART_FIELDS%'}
`;

export const CART_LINES_ADD_MUTATION = `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${'%CART_FIELDS%'}
`;

export const CART_LINES_UPDATE_MUTATION = `
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${'%CART_FIELDS%'}
`;

export const CART_LINES_REMOVE_MUTATION = `
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${'%CART_FIELDS%'}
`;

export const CART_QUERY = `
  query CartFetch($id: ID!) {
    cart(id: $id) { ...CartFields }
  }
  ${'%CART_FIELDS%'}
`;

const CART_FIELDS = `
  fragment CartFields on Cart {
    id
    updatedAt
    checkoutUrl
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount { amount currencyCode }
      totalTaxAmount { amount currencyCode }
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id sku title
              image { url }
              product { title }
            }
          }
          cost {
            totalAmount { amount currencyCode }
            amountPerQuantity { amount currencyCode }
          }
        }
      }
    }
  }
`;

export const renderCartQuery = (template: string): string =>
  template.replace('%CART_FIELDS%', CART_FIELDS);
