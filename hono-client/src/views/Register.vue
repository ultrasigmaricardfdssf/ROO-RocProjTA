<script setup>
    import { ref } from 'vue'

    const username = ref('');
    const email = ref('');
    const password = ref('');
    const confirm_password = ref('');
    const error = ref('');

    const attemptRegister = async () =>
    {
        console.log("bwaaa");
        if(password.value != confirm_password.value)
        {
            console.log("RAAAAAAH");
            error.value = "Passwords do not match";
            return;
        }

        
        const response = await fetch('http://localhost:3000/register', {
    method: 'post',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      username: username.value,
      email: email.value,
      password: password.value
    }),
  });

  const responseSuccess = await response.ok;
  /*if(!response.ok){
    const responseJson = await response.json();
    let errorStr = "";
    responseJson?.error.forEach(err => {
        errorStr += err.message + "\n";
    });
    error.value = errorStr;
  }*/
 const res = await response.json();
 error.value = res;
    }
</script>

<template>
    Welcome to SigmaSite

    <form action="" @submit.prevent="attemptRegister">
        <div>
        <label for="username">Username: </label>
        <input type="text" name="username" id="username" v-model="username" minlength="4" maxlength="32">
        <label for="email">E-Mail: </label>
        <input type="email" name="email" id="email" v-model="email" required>
        <label for="password">Password: </label>
        <input type="password" name="password" id="password" v-model="password" minlength="4" maxlength="64" required>
        <label for="confirm-password">Confirm password: </label>
        <input type="password" name="confirm-password" id="confirm-password" v-model="confirm_password">

        <p id="error" style="white-space: pre-line;"> {{ error }}</p>
        <input type="submit">Register</input>
    </div>
    </form>
</template>