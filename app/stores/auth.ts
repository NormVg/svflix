import { defineStore } from 'pinia'

type AuthUser = {
  username: string;
  expiresAt: number;
};

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<AuthUser | null>(null);
  const authLoading = ref(false);
  const authMessage = ref("");
  const username = ref("");
  const password = ref("");

  const checkAuth = async () => {
    try {
      const user = await $fetch<AuthUser>("/api/auth/me");
      currentUser.value = user;
    } catch {
      currentUser.value = null;
    }
  };

  const login = async (onSuccess?: () => Promise<void>) => {
    authLoading.value = true;
    authMessage.value = "";
    try {
      const user = await $fetch<{ username: string }>("/api/auth/login", {
        method: "POST",
        body: {
          username: username.value.trim(),
          password: password.value,
        },
      });
      currentUser.value = { username: user.username, expiresAt: 0 };
      password.value = "";
      authMessage.value = `Logged in as ${user.username}.`;
      if (onSuccess) await onSuccess();
    } catch (error) {
      authMessage.value = (error as Error).message;
    } finally {
      authLoading.value = false;
    }
  };

  const logout = async (onSuccess?: () => void) => {
    authLoading.value = true;
    authMessage.value = "";
    try {
      await $fetch("/api/auth/logout", { method: "POST" });
      currentUser.value = null;
      authMessage.value = "Logged out.";
      if (onSuccess) onSuccess();
    } catch (error) {
      authMessage.value = (error as Error).message;
    } finally {
      authLoading.value = false;
    }
  };

  return {
    currentUser,
    authLoading,
    authMessage,
    username,
    password,
    checkAuth,
    login,
    logout,
  };
})
