// Ambient type declarations for Deno runtime in Supabase Edge Functions
declare module "https://*";

declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
    function set(key: string, value: string): void;
    function toObject(): Record<string, string>;
  }
}
