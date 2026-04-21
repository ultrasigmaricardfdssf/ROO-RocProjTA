import router from "../router/router.js";

export type User = {
  id: number;
  username: string;
  email: string;
  password: string;
  role: string;
  notified: boolean;
  description: string;
  created_at: number;
}

const serverPath = `http://localhost:${Number(3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000 || 3000)}/`;

class AuthService {
    user: User | null = null
  
    async login(email: string, password: string) {
      const res = await fetch(serverPath + "login", {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if(!res.ok)
        {
          if(res.status == 401)
              throw new Error('LOGIN_FAILED');
          throw new Error('CONNECTION_ERROR ');
        }

      this.user = await res.json()
      router.push('/');
    }
  
    async fetchUser() {
      const res = await fetch(serverPath + "me", {
        credentials: 'include'
      })
  
      if (res.ok) {
        this.user = await res.json()
      }
    }
  
    logout() {
      fetch(serverPath + 'logout', { method: 'POST', credentials: 'include' })
      this.user = null
    }
  
    isAuthenticated() {
      return !!this.user
    }
  }
  
  export const authService = new AuthService()