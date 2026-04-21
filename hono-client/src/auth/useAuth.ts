// auth/useAuth.ts
import { reactive, toRefs } from 'vue'
import { authService, type User } from './authService'

const state = reactive({ // :))))))))))))))))))))
  user : null as User | null
})

export function useAuth() {
  return {
    ...toRefs(state),
    login: async (email : string, password : string) => {
      await authService.login(email, password)
      state.user = authService.user
    },
    logout: () => {
      authService.logout()
      state.user = null
    },
    isAuthenticated: () => authService.isAuthenticated()
  }
}