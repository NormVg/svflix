<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from './stores/auth'
import { useMediaStore } from './stores/media'
import { useRouter } from 'vue-router'

const showIntro = ref(true);
const introVisible = ref(true);

const onIntroDone = () => {
  introVisible.value = false;
  setTimeout(() => {
    showIntro.value = false;
  }, 600);
};

const authStore = useAuthStore();
const mediaStore = useMediaStore();
const router = useRouter();

const { currentUser, authLoading, authMessage, username, password } = storeToRefs(authStore);
const { mediaItems, categories, loading, message, groupedByCategory } = storeToRefs(mediaStore);

const handleLogin = () =>
  authStore.login(async () => {
    await mediaStore.refreshData();
  });

const handleLogout = () =>
  authStore.logout(() => {
    mediaItems.value = [];
    categories.value = [];
    message.value = "";
    router.push('/');
  });

// Bootstrap auth + data on load
await authStore.checkAuth();
if (currentUser.value) {
  await mediaStore.refreshData();
}

onMounted(() => {
  // SSR mismatch safety
})
</script>

<template>
  <div class="app-root">
    <NuxtRouteAnnouncer />

    <!-- Intro overlay -->
    <Transition name="intro-fade">
      <NetflixIntro v-if="showIntro && introVisible" @done="onIntroDone" />
    </Transition>

    <div class="main-content" :class="{ blurred: showIntro }">
      <!-- LOGIN VIEW -->
      <div v-if="!currentUser" class="login-view">
        <div class="login-bg"></div>
        <div class="login-overlay"></div>
        
        <div class="login-header">
          <h1 class="logo">SVFlix</h1>
        </div>

        <div class="login-box">
          <h2>Sign In</h2>
          <form @submit.prevent="handleLogin" class="login-form">
            <div class="input-group">
              <input v-model="username" type="text" placeholder="Username" required />
            </div>
            <div class="input-group">
              <input v-model="password" type="password" placeholder="Shared Password" required />
            </div>
            <button type="submit" class="btn-signin" :disabled="authLoading">
              {{ authLoading ? 'Signing In...' : 'Sign In' }}
            </button>
            <p v-if="authMessage" class="error-msg">{{ authMessage }}</p>
          </form>
          <div class="login-footer">
            <p>Private space for you both.</p>
            <p>Save photos, videos, and notes securely.</p>
          </div>
        </div>
      </div>

      <!-- MAIN APP VIEW -->
      <template v-else>
        <!-- Main Layout with Router View -->
        <NavBar v-if="!$route.path.startsWith('/watch')" :username="currentUser?.username" @logout="handleLogout" />
        <NuxtPage />

        <!-- Floating Add Button -> Now navigates to /upload -->
        <NuxtLink v-if="!$route.path.startsWith('/watch')" to="/upload" class="fab" title="Add Memory">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </NuxtLink>
      </template>
    </div>
  </div>
</template>

<style>
/* Global Resets */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 100%;
  min-height: 100vh;
  background-color: #141414; /* Netflix standard background */
  color: #fff;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  overflow-x: hidden;
}

body::-webkit-scrollbar {
  width: 10px;
}
body::-webkit-scrollbar-track {
  background: #141414;
}
body::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 5px;
}
body::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Page Transitions */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}
</style>

<style scoped>
.app-root {
  min-height: 100vh;
}

.intro-fade-leave-active { transition: opacity 0.6s ease; }
.intro-fade-leave-to     { opacity: 0; }

.main-content {
  transition: filter 0.4s;
  min-height: 100vh;
}
.main-content.blurred { 
  filter: blur(10px) brightness(0.3); 
  pointer-events: none; 
}

/* ── Login View ── */
.login-view {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.login-bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: url('https://assets.nflxext.com/ffe/siteui/vlv3/9d3533b2-0e2b-40b2-95e0-eca797977fa2/f9a888c7-da11-4f11-9a70-8b17b6dc1969/US-en-20240311-popsignuptwoweeks-perspective_alpha_website_large.jpg');
  background-size: cover;
  background-position: center;
  z-index: 1;
}

.login-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  background-image: linear-gradient(to top, rgba(0,0,0,0.8) 0, rgba(0,0,0,0) 60%, rgba(0,0,0,0.8) 100%);
  z-index: 2;
}

.login-header {
  position: relative;
  z-index: 3;
  padding: 20px 4%;
}

.logo {
  color: #e50914;
  font-size: 2.5rem;
  font-weight: bold;
  text-transform: uppercase;
}

.login-box {
  position: relative;
  z-index: 3;
  margin: 0 auto;
  background-color: rgba(0, 0, 0, 0.75);
  padding: 60px 68px 40px;
  width: 100%;
  max-width: 450px;
  border-radius: 4px;
  margin-top: 20px;
}

.login-box h2 {
  color: #fff;
  font-size: 2rem;
  margin-bottom: 28px;
  font-weight: 500;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group input {
  width: 100%;
  padding: 16px 20px;
  background: #333;
  border: 0;
  border-radius: 4px;
  color: #fff;
  font-size: 1rem;
}
.input-group input:focus {
  outline: none;
  background: #454545;
}

.btn-signin {
  margin-top: 24px;
  padding: 16px;
  background: #e50914;
  color: #fff;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-signin:hover {
  background: #c11119;
}
.btn-signin:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-msg {
  color: #e87c03;
  font-size: 0.9rem;
  margin-top: 10px;
}

.login-footer {
  margin-top: 40px;
  color: #737373;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* ── Main Layout ── */
.rails-container {
  padding-bottom: 60px;
  margin-top: -8vw; /* Pull rails up over the hero vignette */
  position: relative;
  z-index: 10;
}

/* ── Floating Action Button (Upload) ── */
.fab {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #e50914;
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  transition: transform 0.2s, background-color 0.2s;
  text-decoration: none;
}
.fab:hover {
  transform: scale(1.1);
  background-color: #f40612;
}
.fab svg {
  width: 30px;
  height: 30px;
}
</style>
