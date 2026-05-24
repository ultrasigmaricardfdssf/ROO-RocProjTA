import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.js";

export function useAuth() {
  const store = useAuthStore();
  const router = useRouter();

  async function login(email: string, password: string) {
    const res = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok)
      throw Object.assign(new Error(data.error.message), {
        code: data.error.code,
      });
    store.setUser(data.user);
    return data.user;
  }

  async function register(username: string, email: string, password: string) {
    const res = await fetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok)
      throw Object.assign(new Error(data.error.message), {
        code: data.error.code,
      });
    store.setUser(data.user);
    return data.user;
  }

  async function logout() {
    await fetch("/auth/logout", { method: "POST", credentials: "include" });
    store.setUser(null);
    router.push("/login");
  }

  return { login, register, logout };
}
