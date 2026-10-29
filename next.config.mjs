/** @type {import('next').NextConfig} */
const nextConfig = {
  // `typescript.ignoreBuildErrors` foi removido: ele escondia erros de tipo
  // no build. O projeto passa em `tsc --noEmit`, então o build valida os tipos.
  images: {
    unoptimized: true,
  },
}

export default nextConfig
