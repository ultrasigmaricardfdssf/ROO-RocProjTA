<script setup>
    import { authService } from '../auth/authService.ts';
    import { useAuth } from '../auth/useAuth.ts';
    const { user, login, logout, isAuthenticated } = useAuth();
</script>

<template>
    <nav>
        <header>
            <div class="headerCell"><RouterLink to="/">
                    <p>ahoj sigma</p>
                    <p v-if="user">ahoj sigma</p>
                </RouterLink></div>
            <div>
                <input type="text" placeholder="Search...">
                <button></button>
            </div>
            <div>
                <a href=""></a>
                <div class="dropdown">
                    <div class="dropdownItem"><RouterLink to="/register">
                        <p>ahoj sigma</p>
                    </RouterLink></div>
                    <div class="dropdownItem"><RouterLink to="/login">
                        <p>ahoj sigma</p>
                    </RouterLink></div>
                    <div class="dropdownItem"><RouterLink to="/">
                        <p>ahoj sigma</p>
                    </RouterLink></div>
                </div>
            </div>
            <p v-if="user">SIGMAMAMAMMAMA</p>
        </header>
    </nav>
</template>