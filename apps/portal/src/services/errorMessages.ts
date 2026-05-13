import { BffError } from './bffClient';

/**
 * Where in the UI the error happened. Different contexts produce
 * different friendly messages for the same underlying error.
 */
export type ErrorContext =
  | 'sku-lookup'    // GET /catalog/sku/:sku for a single row
  | 'bulk-add'      // POST /cart/items/bulk
  | 'clipboard'     // navigator.clipboard.readText()
  | 'csv-upload';   // FileReader / File.text()

export interface FriendlyMessage {
  /** Short headline; suitable for an Alert title. */
  text: string;
  /** Optional secondary line with a next step. */
  hint?: string;
  /** 1-2 word label suitable for a status chip. */
  chipLabel: string;
}

const containsAny = (haystack: string, needles: string[]): boolean => {
  const lower = haystack.toLowerCase();
  return needles.some((n) => lower.includes(n));
};

const isBffError = (e: unknown): e is BffError =>
  e instanceof BffError ||
  (!!e && typeof e === 'object' && 'status' in (e as { status?: unknown }));

/**
 * Map any Quick Order error into a customer-friendly message. Never
 * surfaces raw Shopify userError text, stack traces, or HTTP details;
 * instead it gives the buyer a sentence they can act on.
 *
 * The original error remains in console.error / BFF logs for support.
 */
export const friendlyError = (err: unknown, context: ErrorContext): FriendlyMessage => {
  // ----- Browser-side errors that never went over the wire -----
  if (context === 'clipboard') {
    return {
      chipLabel: 'Clipboard',
      text: "We couldn't read your clipboard.",
      hint: 'Try Upload CSV instead, or allow clipboard access in your browser.',
    };
  }
  if (context === 'csv-upload') {
    return {
      chipLabel: 'File',
      text: "We couldn't read that file.",
      hint: 'Make sure it\'s a plain text CSV with one "SKU,qty" per line.',
    };
  }

  // ----- API errors (status + optional Shopify message) -----
  if (isBffError(err)) {
    const { status, message } = err;

    if (status === 401 || status === 403) {
      return {
        chipLabel: 'Sign in',
        text: 'Your session has expired.',
        hint: 'Please sign in again to continue.',
      };
    }
    if (status === 429) {
      return {
        chipLabel: 'Busy',
        text: "We're processing too many requests right now.",
        hint: 'Wait a moment and try again.',
      };
    }

    // Context-specific 404 handling runs BEFORE the generic 5xx
    // branch. A confused upstream (e.g., Fly proxy briefly returning
    // 502 while a backend rolls) shouldn't overwrite a genuinely
    // catalog-miss message — the buyer's action is the same either
    // way ("not in your catalog, ask your rep"), and treating an
    // intermittent 5xx as the 404 they actually asked for is
    // strictly better UX than a misleading "temporarily unavailable".
    if (context === 'sku-lookup' && status === 404) {
      return {
        chipLabel: 'Not in catalog',
        text: 'Not in your catalog.',
        hint: 'Double-check the SKU, or ask your account manager if it should be available to you.',
      };
    }

    if (status >= 500) {
      return {
        chipLabel: 'Unavailable',
        text: 'Our catalog is temporarily unavailable.',
        hint: 'Please try again in a moment.',
      };
    }

    if (context === 'bulk-add') {
      const m = message ?? '';
      if (containsAny(m, ['not in stock', 'out of stock', 'unavailable for sale', 'sold out'])) {
        return {
          chipLabel: 'Out of stock',
          text: 'One or more items went out of stock since you added them.',
          hint: 'Lower the quantity or remove the row and try again.',
        };
      }
      if (containsAny(m, ['minimum', 'at least'])) {
        return {
          chipLabel: 'Below min',
          text: "An item doesn't meet the minimum order quantity.",
          hint: 'Increase the quantity on the flagged row and try again.',
        };
      }
      if (containsAny(m, ['maximum', 'at most', 'exceeds'])) {
        return {
          chipLabel: 'Above max',
          text: 'An item exceeds the maximum quantity allowed on your account.',
          hint: 'Reduce the quantity and try again.',
        };
      }
      if (containsAny(m, ['cannot purchase', 'cannot be purchased', 'not available for purchase'])) {
        return {
          chipLabel: 'Restricted',
          text: "An item can't be purchased on your account.",
          hint: 'Contact your account manager about availability.',
        };
      }
      // Generic fallback for bulk-add validation errors.
      return {
        chipLabel: 'Cart issue',
        text: "We couldn't add some items to your cart.",
        hint: 'Adjust the rows shown as blocked and try again.',
      };
    }

    // Generic catch-all for any other API error.
    return {
      chipLabel: 'Issue',
      text: 'Something went wrong on our side.',
      hint: 'Please try again in a moment.',
    };
  }

  // ----- Non-BffError thrown things (TypeError from fetch, etc.) -----
  return {
    chipLabel: 'Offline',
    text: 'Connection issue.',
    hint: 'Check your network and try again.',
  };
};

/** Convenience for inline single-line uses (chip tooltip, etc.). */
export const friendlyErrorLine = (err: unknown, context: ErrorContext): string => {
  const m = friendlyError(err, context);
  return m.hint ? `${m.text} ${m.hint}` : m.text;
};
