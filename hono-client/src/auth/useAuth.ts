// auth/useAuth.ts
import { reactive } from 'vue'
import { authService } from './authService'

const state = reactive({ // :))))))))))))))))))))
  user: authService.fetchUser()
})

export function useAuth() {
  return {
    user: state.user,
    login: (email : string, password : string) => {
      authService.login(email, password)
      //state.user = authService.fetchUser()
    },
    logout: () => {
      authService.logout()
      state.user = null
    },
    isAuthenticated: () => authService.isAuthenticated()
  }
}