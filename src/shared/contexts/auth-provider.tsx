import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

const AuthContext = createContext<any>({
  user: null,
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({
  user: initialUser,
  children,
}: {
  user: any
  children: ReactNode
}) {
  const [user, setUser] = useState<any>(initialUser)

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

