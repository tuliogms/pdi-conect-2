import { NextResponse } from 'next/server'
import { BancoNaoConfiguradoError } from '@/lib/db'

/**
 * Resposta única para falhas de banco: mensagem curta para o cliente e detalhe
 * apenas no log do servidor (antes a API devolvia stack trace e SQL na resposta).
 */
export function erroDeBanco(erro: unknown, contexto: string) {
  if (erro instanceof BancoNaoConfiguradoError) {
    return NextResponse.json(
      { error: 'Banco de dados não configurado neste ambiente.' },
      { status: 503 },
    )
  }
  console.error(`[api] falha em ${contexto}:`, erro)
  return NextResponse.json(
    { error: 'Não foi possível acessar o banco de dados. Tente novamente mais tarde.' },
    { status: 503 },
  )
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function uuidValido(valor: string) {
  return UUID.test(valor)
}
