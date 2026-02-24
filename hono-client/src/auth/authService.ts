class AuthService {
    user: any = null
  
    async login(email: string, password: string) {
      const res = await fetch('/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
  
      this.user = await res.json()
    }
  
    async fetchUser() {
      const res = await fetch('/api/me', {
        credentials: 'include'
      })
  
      if (res.ok) {
        this.user = await res.json()
      }
    }
  
    logout() {
      fetch('/api/logout', { method: 'POST', credentials: 'include' })
      this.user = null
    }
  
    isAuthenticated() {
      return !!this.user
    }
  }
  
  export const authService = new AuthService()