/**
 * Type definitions for whois-json
 * Since the package doesn't have types, we declare them here
 */

declare module 'whois-json' {
  function whoisJson(domain: string, options?: {
    follow?: number;
    timeout?: number;
    verbose?: boolean;
  }): Promise<Record<string, unknown>>;

  export = whoisJson;
}
