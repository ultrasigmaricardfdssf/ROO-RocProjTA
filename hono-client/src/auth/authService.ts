import { useRouter } from "vue-router";

type user = {
  id: number;
  username: string;
  email: string;
  password: string;
  role: string;
  notified: boolean;
  description: string;
  created_at: number;
}

const router = useRouter();

class AuthService {
    user : user = null
  
    async login(email: string, password: string) {
      const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if(!res.ok)
        {
          if(res.status == 401)
              throw new Error('CONNECTION_ERROR');
          throw new Error('LOGIN_FAILED');
        }

      this.user = await res.json()
      router.push('/');
    }
  
    async fetchUser() {
      const res = await fetch('http://localhost:3000/me', {
        credentials: 'include'
      })
  
      if (res.ok) {
        this.user = await res.json()
      }
    }
  
    logout() {
      fetch('http://localhost:3000/logout', { method: 'POST', credentials: 'include' })
      this.user = null
    }
  
    isAuthenticated() {
      return !!this.user
    }
  }
  
  export const authService = new AuthService()