/** @type {import('next').NextConfig} */
const nextConfig = {
  // `typescript.ignoreBuildErrors` foi removido: ele escondia erros de tipo
  // no build. O projeto passa em `tsc --noEmit`, então o build valida os tipos.
  images: {
    unoptimized: true,
  },
  // O dev server bloqueia assets de /_next/* quando a requisição vem de um host
  // diferente do usado para iniciar o servidor. Isso quebra o preview do Arena
  // (https://<porta>-<sandbox>.e2b.app), então liberamos esses domínios em dev.
  allowedDevOrigins: ['*.e2b.app'],
}

export default nextConfig
