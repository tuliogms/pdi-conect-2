/**
 * Compila os componentes e a camada de dados para os testes em Node.
 * Fica em node_modules/.cache para não sujar o repositório.
 */
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import esbuild from 'esbuild'

export const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const saida = resolve(raiz, 'node_modules/.cache/pdi-tests')
mkdirSync(saida, { recursive: true })

const externos = ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime']

/** Compila uma entrada TS/TSX para CommonJS. */
export async function compilar({ entrada, arquivo, jsx = false }) {
  const destino = resolve(saida, arquivo)
  await esbuild.build({
    entryPoints: [resolve(raiz, entrada)],
    bundle: true,
    outfile: destino,
    platform: 'browser',
    format: 'cjs',
    jsx: jsx ? 'automatic' : undefined,
    tsconfig: resolve(raiz, 'tsconfig.json'),
    external: externos,
    alias: {
      'next/navigation': resolve(raiz, 'tests/mocks/next-navigation.ts'),
      'next/link': resolve(raiz, 'tests/mocks/next-link.tsx'),
    },
    loader: { '.css': 'empty' },
    define: { 'process.env.NODE_ENV': '"development"' },
    logLevel: 'error',
  })
  return destino
}
