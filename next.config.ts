import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // There are two package-lock.json files (repo root and paper-ai/), which made
  // the bundler infer the wrong workspace root. Pin it to this project directory.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
