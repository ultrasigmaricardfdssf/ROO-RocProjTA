<script setup>
    import { ref } from 'vue'
    import { useRouter } from 'vue-router'
    import { useAuth } from '../auth/useAuth.js'

    const { user, login, logout, isAuthenticated } = useAuth();

    const email = ref('');
    const password = ref('');
    const error = ref('');

    const attemptLogin = async () =>
    {
      if(password.value.length < 4 || password.value.length > 64)
      {
        error.value = "Neplatne zadane heslo.";
      }
      try{
        await login(email.value, password.value);
      }
      catch (err)
      {
        console.log("sigma");
        error.value = "Chyba pri authentifikacii\n" + err;
      }
    }
</script>

<template>
    Welcome to SigmaSite

    <form action="" @submit.prevent="attemptLogin">
        <div>
        <label for="email">E-Mail: </label>
        <input type="email" name="email" id="email" v-model="email" required>
        <label for="password">Password: </label>
        <input type="password" name="password" id="password" v-model="password" minlength="4" maxlength="64" required>

        <p id="error" style="white-space: pre-line;"> {{ error }}</p>
        <input type="submit">Login</input>
    </div>
    </form>
</template>