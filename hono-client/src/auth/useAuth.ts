// auth/useAuth.ts
import { reactive } from 'vue'
import { authService, User } from './authService'

const state = reactive({ // :))))))))))))))))))))
  user : null as User | null
})

export function useAuth() {
  return {
    user: state.user,
    login: (email : string, password : string) => {
      authService.login(email, password)
      authService.fetchUser().then(u => {state.user = authService.user})
    },
    logout: () => {
      authService.logout()
      state.user = null
    },
    isAuthenticated: () => authService.isAuthenticated()
  }
}