import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', '@auth/prisma-adapter'],
  outputFileTracingIncludes: {
    '/bookcase-configurator': ['./src/lib/catalog-entry/source-designs/dna/*.json'],
    '/sofa-configurator': ['./src/lib/catalog-entry/source-designs/dna/*.json'],
  },
};

export default nextConfig;
