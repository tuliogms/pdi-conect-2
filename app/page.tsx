import IntroPingo from '@/components/intro-pingo'

// A rota raiz é a abertura animada ("Pingo Saltitante"). Ao fim da cena a
// onda verde sobe e o componente encaminha para /login.
export default function Home() {
  return <IntroPingo />
}
