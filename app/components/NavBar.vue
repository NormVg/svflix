<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'

const props = defineProps<{
  username?: string
}>()

const emit = defineEmits<{
  logout: []
}>()

const { y } = useWindowScroll()
const isScrolled = computed(() => y.value > 0)
</script>

<template>
  <nav :class="['navbar', { 'navbar-scrolled': isScrolled }]">
    <div class="navbar-left">
      <NuxtLink to="/" class="logo-link"><h1 class="logo">SVFlix</h1></NuxtLink>
      <ul v-if="username" class="nav-links">
        <li><NuxtLink to="/" exact-active-class="active">Home</NuxtLink></li>
        <li><a href="#">Categories</a></li>
        <li><a href="#">Recent</a></li>
      </ul>
    </div>
    
    <div class="navbar-right">
      <template v-if="username">
        <NuxtLink to="/profile" class="user-profile">
          <img src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png" alt="User Avatar" class="avatar" />
          <span class="username">{{ username }}</span>
        </NuxtLink>
        <button class="logout-btn" @click="emit('logout')">Logout</button>
      </template>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 68px;
  padding: 0 4%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 100;
  background: linear-gradient(to bottom, rgba(0,0,0,0.7) 10%, rgba(0,0,0,0));
  transition: background-color 0.4s;
}

.navbar-scrolled {
  background-color: #141414;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 40px;
}

.logo-link {
  text-decoration: none;
}

.logo {
  color: #e50914;
  font-size: 1.8rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
}

.nav-links {
  display: flex;
  list-style: none;
  gap: 20px;
  margin: 0;
  padding: 0;
}

.nav-links a {
  color: #e5e5e5;
  text-decoration: none;
  font-size: 0.85rem;
  transition: color 0.4s;
}

.nav-links a:hover, .nav-links a.active {
  color: #fff;
  font-weight: 500;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  text-decoration: none;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 4px;
}

.username {
  font-size: 0.85rem;
  color: #fff;
}

.logout-btn {
  background: transparent;
  border: 1px solid #fff;
  color: #fff;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #fff;
  color: #141414;
}
</style>
