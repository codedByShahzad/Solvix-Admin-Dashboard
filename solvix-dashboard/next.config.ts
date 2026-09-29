import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Media comes from Cloudinary / arbitrary website domains, so plain <img> is used
  // instead of next/image. No remote image config is needed.
};

export default nextConfig;
