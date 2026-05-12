export interface CheckoutHandoff {
  /**
   * URL the buyer should be sent to in order to complete checkout. For
   * adapters that complete checkout in-app, this may be empty and the
   * payload will be present instead.
   */
  url?: string;
  payload?: Record<string, unknown>;
}
