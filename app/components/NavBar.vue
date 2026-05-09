<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'

const props = defineProps<{
  username?: string
  unreadCount?: number
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
        <li><NuxtLink to="/categories" exact-active-class="active">Categories</NuxtLink></li>
        <li><NuxtLink to="/images" exact-active-class="active">Images</NuxtLink></li>
        <li><NuxtLink to="/videos" exact-active-class="active">Videos</NuxtLink></li>
        <li><NuxtLink to="/chat" exact-active-class="active">Chat</NuxtLink></li>
        <li><NuxtLink to="/watch-together" exact-active-class="active">Watch Together</NuxtLink></li>
        <li class="notes-link">
          <NuxtLink to="/notes" exact-active-class="active">
            Notes
            <span v-if="unreadCount && unreadCount > 0" class="nav-badge">{{ unreadCount }}</span>
          </NuxtLink>
        </li>
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

.notes-link a {
  position: relative;
}

.nav-badge {
  position: absolute;
  top: -6px;
  right: -10px;
  background: #e50914;
  color: #fff;
  font-size: 0.6rem;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  animation: badge-pulse 2s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(229, 9, 20, 0.6); }
  50% { box-shadow: 0 0 0 4px rgba(229, 9, 20, 0); }
}

@media screen and (max-width: 800px) {
  .navbar-left {
    gap: 15px;
  }
  .nav-links {
    gap: 12px;
  }
  .nav-links a {
    font-size: 0.8rem;
  }
  .logo {
    font-size: 1.4rem;
  }
  .username {
    display: none;
  }
}

@media screen and (max-width: 500px) {
  .navbar {
    padding: 0 10px;
  }
  .navbar-left {
    gap: 10px;
  }
  .nav-links {
    gap: 8px;
  }
  .nav-links a {
    font-size: 0.7rem;
  }
  .logo {
    font-size: 1.2rem;
  }
  .logout-btn {
    padding: 4px 8px;
    font-size: 0.7rem;
  }
}
</style>
