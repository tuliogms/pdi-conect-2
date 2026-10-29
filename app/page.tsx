import { redirect } from 'next/navigation'

// A aplicação tem uma única página de login (/login).
// A rota raiz apenas encaminha para ela, evitando duas telas de login divergentes.
export default function Home() {
  redirect('/login')
}
