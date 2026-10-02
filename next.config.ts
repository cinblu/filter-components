import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The "Why" page grew into the case study.
  async redirects() {
    return [{ source: "/why", destination: "/case-study", permanent: true }];
  },
};

export default nextConfig;
