<template>
  <div class="auth-shell">
    <div class="auth-card card">
      <div class="auth-header">
        <h1 class="auth-title">Welcome back</h1>
        <p class="auth-sub">Sign in to your account</p>
      </div>

      <form class="auth-form" @submit.prevent="handleLogin">
        <div class="field">
          <label class="field-label" for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="field-input"
            :class="{ error: !!error }"
            placeholder="you@example.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="field">
          <label class="field-label" for="password">Password</label>
          <div class="input-wrap">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="field-input"
              :class="{ error: !!error }"
              placeholder="••••••••"
              autocomplete="current-password"
              required
            />
            <button type="button" class="show-pw" @click="showPassword = !showPassword">
              {{ showPassword ? 'hide' : 'show' }}
            </button>
          </div>
        </div>

        <!-- Error message -->
        <Transition name="fade">
          <div v-if="error" class="error-box">
            <span class="error-icon">!</span>
            <span>{{ error }}</span>
          </div>
        </Transition>

        <button type="submit" class="pill submit-btn" :disabled="loading">
          <span v-if="loading" class="spinner" />
          <span v-else>Sign in</span>
        </button>
      </form>

      <div class="auth-footer">
        <span>Don't have an account?</span>
        <RouterLink to="/register" class="auth-link">Register</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const route  = useRoute()
const { login } = useAuth()

const email        = ref('')
const password     = ref('')
const error        = ref('')
const loading      = ref(false)
const showPassword = ref(false)

async function handleLogin() {
  error.value   = ''
  loading.value = true
  try {
    await login(email.value, password.value)
    const redirect = route.query.redirect as string | undefined
    router.push(redirect ?? '/')
  } catch (err: any) {
    switch (err.code) {
      case 'INVALID_CREDENTIALS':
        error.value = 'Invalid email or password.'
        break
      case 'VALIDATION_ERROR':
        error.value = err.message
        break
      default:
        error.value = 'Something went wrong. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  padding: 24px;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  padding: 40px 36px;
  border: 1.5px solid var(--border);
}

.auth-header { text-align: center; margin-bottom: 32px; }
.auth-title  { font-size: 26px; font-weight: 800; color: var(--text); }
.auth-sub    { font-size: 14px; color: var(--text-muted); margin-top: 4px; }

.auth-form { display: flex; flex-direction: column; gap: 18px; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.input-wrap { position: relative; }

.field-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: var(--font);
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  background: var(--card);
  color: var(--text);
}
.field-input:focus {
  border-color: var(--navy-light);
  box-shadow: 0 0 0 3px rgba(37, 99, 168, 0.1);
}
.field-input.error { border-color: var(--red); }

.input-wrap .field-input { padding-right: 54px; }
.show-pw {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-family: var(--font);
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px 6px;
}
.show-pw:hover { color: var(--navy); }

.error-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--red-pale);
  border: 1.5px solid var(--red);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  font-size: 13px;
  color: var(--red);
  font-weight: 600;
}
.error-icon {
  width: 20px; height: 20px;
  background: var(--red);
  color: #fff;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800;
  flex-shrink: 0;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  font-size: 15px;
  background: var(--navy);
  color: #fff;
  border: none;
  margin-top: 4px;
  transition: background 0.15s, opacity 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.submit-btn:hover:not(:disabled) { background: var(--navy-dark); }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

.auth-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 24px;
  font-size: 14px;
  color: var(--text-muted);
}
.auth-link { color: var(--navy); font-weight: 700; }
.auth-link:hover { text-decoration: underline; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>