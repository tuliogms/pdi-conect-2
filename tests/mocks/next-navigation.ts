export function useRouter() {
  return { push: () => {}, replace: () => {}, back: () => {}, refresh: () => {} }
}
export function useSearchParams() { return new URLSearchParams() }
export function usePathname() { return '/dashboard' }
