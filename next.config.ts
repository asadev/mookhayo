import type { NextConfig } from 'next';

/**
 * Static export, for GitHub Pages.
 *
 * Nothing on this site needs a server: no API routes, no server actions, no
 * database. The only thing `output: 'export'` costs us is next/image's
 * on-demand optimiser — and every image here was already hand-encoded to webp
 * at the exact sizes it renders at (the 859px portrait is 67KB), so the
 * optimiser had nothing left to do. Turning it off changes no bytes on the wire.
 *
 * trailingSlash keeps GitHub Pages honest: it serves `/path/` from
 * `/path/index.html`, and without this a future route would 404 on refresh.
 */
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
