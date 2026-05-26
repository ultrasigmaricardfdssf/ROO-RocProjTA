<template>
  <div class="auth-shell">
    <div class="auth-card card">
      <div class="auth-header">
        <h1 class="auth-title">Create account</h1>
        <p class="auth-sub">Join the community</p>
      </div>

      <form class="auth-form" @submit.prevent="handleRegister">
        <div class="field">
          <label class="field-label" for="username">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            class="field-input"
            :class="{ error: fieldErrors.username }"
            placeholder="sigma_boy"
            autocomplete="username"
            required
          />
          <span v-if="fieldErrors.username" class="field-error">{{ fieldErrors.username }}</span>
        </div>

        <div class="field">
          <label class="field-label" for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="field-input"
            :class="{ error: fieldErrors.email }"
            placeholder="you@example.com"
            autocomplete="email"
            required
          />
          <span v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</span>
        </div>

        <div class="field">
          <label class="field-label" for="password">Password</label>
          <div class="input-wrap">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="field-input"
              :class="{ error: fieldErrors.password }"
              placeholder="at least 8 characters"
              autocomplete="new-password"
              required
            />
            <button type="button" class="show-pw" @click="showPassword = !showPassword">
              {{ showPassword ? 'hide' : 'show' }}
            </button>
          </div>

          <!-- Password strength bar -->
          <div class="strength-wrap" v-if="password.length > 0">
            <div class="strength-bar">
              <div class="strength-fill" :class="strength.cls" :style="{ width: strength.pct + '%' }" />
            </div>
            <span class="strength-label" :class="strength.cls">{{ strength.label }}</span>
          </div>

          <span v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</span>
        </div>

        <div class="field">
          <label class="field-label" for="confirm">Confirm password</label>
          <div class="input-wrap">
            <input
              id="confirm"
              v-model="confirm"
              :type="showPassword ? 'text' : 'password'"
              class="field-input"
              :class="{ error: fieldErrors.confirm }"
              placeholder="••••••••"
              autocomplete="new-password"
              required
            />
          </div>
          <span v-if="fieldErrors.confirm" class="field-error">{{ fieldErrors.confirm }}</span>
        </div>

        <!-- Global error -->
        <Transition name="fade">
          <div v-if="globalError" class="error-box">
            <span class="error-icon">!</span>
            <span>{{ globalError }}</span>
          </div>
        </Transition>

        <!-- Success -->
        <Transition name="fade">
          <div v-if="success" class="success-box">
            <span>✓</span>
            <span>Account created! Redirecting…</span>
          </div>
        </Transition>

        <button type="submit" class="pill submit-btn" :disabled="loading || success">
          <span v-if="loading" class="spinner" />
          <span v-else>Create account</span>
        </button>
      </form>

      <div class="auth-footer">
        <span>Already have an account?</span>
        <RouterLink to="/login" class="auth-link">Sign in</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { register } = useAuth()

const username     = ref('')
const email        = ref('')
const password     = ref('')
const confirm      = ref('')
const showPassword = ref(false)
const loading      = ref(false)
const globalError  = ref('')
const success      = ref(false)

const fieldErrors = ref<Record<string, string>>({})

// Password strength
const strength = computed(() => {
  const pw = password.value
  let score = 0
  if (pw.length >= 8)                    score++
  if (pw.length >= 12)                   score++
  if (/[A-Z]/.test(pw))                  score++
  if (/[0-9]/.test(pw))                  score++
  if (/[^A-Za-z0-9]/.test(pw))          score++
  if (score <= 1) return { label: 'Weak',   cls: 'weak',   pct: 25  }
  if (score <= 2) return { label: 'Fair',   cls: 'fair',   pct: 50  }
  if (score <= 3) return { label: 'Good',   cls: 'good',   pct: 75  }
  return             { label: 'Strong', cls: 'strong', pct: 100 }
})

function validate(): boolean {
  const errs: Record<string, string> = {}
  if (username.value.length < 3)  errs.username = 'Username must be at least 3 characters.'
  if (username.value.length > 32) errs.username = 'Username must be under 32 characters.'
  if (!email.value.includes('@')) errs.email    = 'Enter a valid email address.'
  if (password.value.length < 8)  errs.password = 'Password must be at least 8 characters.'
  if (password.value !== confirm.value) errs.confirm = 'Passwords do not match.'
  fieldErrors.value = errs
  return Object.keys(errs).length === 0
}

async function handleRegister() {
  globalError.value = ''
  if (!validate()) return

  loading.value = true
  try {
    await register(username.value, email.value, password.value)
    success.value = true
    setTimeout(() => router.push('/'), 1200)
  } catch (err: any) {
    switch (err.code) {
      case 'VALIDATION_ERROR':
        // Server says which field
        if (err.message.toLowerCase().includes('email')) {
          fieldErrors.value.email = err.message
        } else if (err.message.toLowerCase().includes('username')) {
          fieldErrors.value.username = err.message
        } else {
          globalError.value = err.message
        }
        break
      default:
        globalError.value = 'Something went wrong. Please try again.'
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
  max-width: 440px;
  padding: 40px 36px;
  border: 1.5px solid var(--border);
}

.auth-header { text-align: center; margin-bottom: 32px; }
.auth-title  { font-size: 26px; font-weight: 800; }
.auth-sub    { font-size: 14px; color: var(--text-muted); margin-top: 4px; }

.auth-form { display: flex; flex-direction: column; gap: 16px; }

.field { display: flex; flex-direction: column; gap: 5px; }
.field-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.field-error { font-size: 12px; color: var(--red); font-weight: 600; }

.input-wrap { position: relative; }

.field-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: var(--font);
  font-size: 14px;
  outline: none;
  background: var(--card);
  color: var(--text);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.field-input:focus {
  border-color: var(--navy-light);
  box-shadow: 0 0 0 3px rgba(37,99,168,0.1);
}
.field-input.error { border-color: var(--red); }
.input-wrap .field-input { padding-right: 54px; }

.show-pw {
  position: absolute; right: 10px; top: 50%;
  transform: translateY(-50%);
  background: none; border: none;
  font-family: var(--font); font-size: 12px; font-weight: 700;
  color: var(--text-muted); cursor: pointer; padding: 4px 6px;
}
.show-pw:hover { color: var(--navy); }

/* Strength bar */
.strength-wrap { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.strength-bar  { flex: 1; height: 4px; background: var(--border); border-radius: 99px; overflow: hidden; }
.strength-fill { height: 100%; border-radius: 99px; transition: width 0.3s, background 0.3s; }
.strength-label { font-size: 11px; font-weight: 700; min-width: 44px; }

.weak   .strength-fill, .strength-fill.weak   { background: var(--red); }
.fair   .strength-fill, .strength-fill.fair   { background: var(--orange); }
.good   .strength-fill, .strength-fill.good   { background: #3b82f6; }
.strong .strength-fill, .strength-fill.strong { background: var(--green); }
.weak   { color: var(--red); }
.fair   { color: var(--orange); }
.good   { color: #3b82f6; }
.strong { color: var(--green); }

.error-box {
  display: flex; align-items: center; gap: 8px;
  background: var(--red-pale); border: 1.5px solid var(--red);
  border-radius: var(--radius-sm); padding: 10px 14px;
  font-size: 13px; color: var(--red); font-weight: 600;
}
.error-icon {
  width: 20px; height: 20px; background: var(--red); color: #fff;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800; flex-shrink: 0;
}

.success-box {
  display: flex; align-items: center; gap: 8px;
  background: #f0fdf4; border: 1.5px solid var(--green);
  border-radius: var(--radius-sm); padding: 10px 14px;
  font-size: 13px; color: var(--green); font-weight: 600;
}

.submit-btn {
  width: 100%; padding: 12px; font-size: 15px;
  background: var(--navy); color: #fff; border: none; margin-top: 4px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: background 0.15s, opacity 0.15s;
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
  display: flex; align-items: center; justify-content: center;
  gap: 6px; margin-top: 24px; font-size: 14px; color: var(--text-muted);
}
.auth-link { color: var(--navy); font-weight: 700; }
.auth-link:hover { text-decoration: underline; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>