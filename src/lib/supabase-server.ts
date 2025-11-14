import type { AstroCookies } from "astro";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/db/database.types";

/**
 * Creates a Supabase server client for use in API routes and middleware
 *
 * This helper function ensures consistent cookie handling across the application
 * using the getAll/setAll pattern required by @supabase/ssr
 *
 * @param context - Object containing Astro headers and cookies
 * @returns Configured Supabase client instance
 */
export function createSupabaseServerClient(context: { headers: Headers; cookies: AstroCookies }) {
  return createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookies: {
      getAll() {
        const cookieHeader = context.headers.get("Cookie") ?? "";

        if (!cookieHeader) {
          return [];
        }

        // Parse cookie header into array of {name, value} objects
        return cookieHeader.split(";").map((cookie) => {
          const [name, ...rest] = cookie.trim().split("=");
          return {
            name: name.trim(),
            value: rest.join("=").trim(),
          };
        });
      },

      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          context.cookies.set(name, value, options);
        });
      },
    },
  });
}
