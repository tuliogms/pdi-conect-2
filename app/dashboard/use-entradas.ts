'use client'

import { useCallback, useEffect, useState } from 'react'
import { carregarEntradas } from '@/lib/dados'
import type { EntradaPdi, ModoPersistencia } from '@/lib/pdi-tipos'

/** Carrega as respostas do PDI de um estudante (banco ou armazenamento local). */
export function useEntradas(estudanteId: string | null) {
  const [entradas, setEntradas] = useState<EntradaPdi[]>([])
  const [modo, setModo] = useState<ModoPersistencia>('local')
  const [carregando, setCarregando] = useState(false)

  const recarregar = useCallback(async () => {
    if (!estudanteId) {
      setEntradas([])
      return
    }
    setCarregando(true)
    const resultado = await carregarEntradas(estudanteId)
    setEntradas(resultado.entradas)
    setModo(resultado.modo)
    setCarregando(false)
  }, [estudanteId])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  return { entradas, modo, carregando, recarregar, setEntradas }
}
