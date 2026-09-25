import { fileURLToPath } from "node:url";
import path from "node:path";

import type { NextConfig } from "next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : "";

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  images: supabaseHost
    ? {
        remotePatterns: [
          { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
        ],
      }
    : undefined,
};

export default nextConfig;
