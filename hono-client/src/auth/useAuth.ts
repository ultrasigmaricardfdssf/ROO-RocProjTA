// auth/useAuth.ts
import { reactive } from 'vue'
import { authService } from './authService'

const state = reactive({
  user: authService.getUser()
})

export function useAuth() {
  return {
    user: state.user,
    login: (userData: any) => {
      authService.login(userData)
      state.user = authService.getUser()
    },
    logout: () => {
      authService.logout()
      state.user = null
    },
    isAuthenticated: () => authService.isAuthenticated()
  }
}