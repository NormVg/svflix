import { defineStore } from 'pinia'

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type MediaItem = {
  id: string;
  bucketKey: string;
  mediaType: "image" | "video";
  title: string | null;
  description: string | null;
  createdAt: string;
  categories: Category[];
};

export const useMediaStore = defineStore('media', () => {
  const mediaItems = ref<MediaItem[]>([]);
  const categories = ref<Category[]>([]);
  const loading = ref(false);
  const message = ref("");

  const refreshData = async () => {
    loading.value = true;
    message.value = "";
    try {
      const [catData, mediaData] = await Promise.all([
        $fetch<{ categories: Category[] }>("/api/categories"),
        $fetch<{ media: MediaItem[] }>("/api/media"),
      ]);
      categories.value = catData.categories;
      mediaItems.value = mediaData.media;
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      if (err.statusCode === 401) {
        message.value = "Session expired. Please login again.";
        return { expired: true };
      }
      message.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const upload = async (payload: {
    file: File;
    key: string;
    mediaType: "image" | "video";
    title: string;
    description: string;
    categoryIds: string[];
  }) => {
    loading.value = true;
    message.value = "";
    try {
      const form = new FormData();
      form.append("file", payload.file);
      if (payload.key.trim()) form.append("key", payload.key.trim());

      const uploadResult = await $fetch<{ key: string }>("/api/bucket0/upload", {
        method: "POST",
        body: form,
      });

      await $fetch("/api/media", {
        method: "POST",
        body: {
          bucketKey: uploadResult.key,
          mediaType: payload.mediaType,
          title: payload.title,
          description: payload.description,
          categoryIds: payload.categoryIds,
        },
      });

      message.value = `Saved: ${uploadResult.key}`;
      await refreshData();
      return { success: true, key: uploadResult.key };
    } catch (error) {
      const err = error as Error & { statusCode?: number };
      if (err.statusCode === 401) {
        message.value = "Session expired. Please login again.";
        return { expired: true };
      }
      message.value = err.message;
      return { error: true };
    } finally {
      loading.value = false;
    }
  };

  const deleteMedia = async (id: string) => {
    loading.value = true;
    message.value = "";
    try {
      await $fetch(`/api/media/${id}`, { method: "DELETE" });
      message.value = "Memory removed.";
      await refreshData();
    } catch (error) {
      message.value = (error as Error).message;
    } finally {
      loading.value = false;
    }
  };

  const updateMedia = async (id: string, payload: { title?: string; description?: string }) => {
    loading.value = true;
    message.value = "";
    try {
      await $fetch(`/api/media/${id}`, {
        method: "PATCH",
        body: payload,
      });
      message.value = "Memory updated.";
      await refreshData();
      return { success: true };
    } catch (error) {
      message.value = (error as Error).message;
      return { error: true };
    } finally {
      loading.value = false;
    }
  };

  const addNote = async (mediaId: string, body: string) => {
    loading.value = true;
    message.value = "";
    try {
      await $fetch(`/api/media/${mediaId}/notes`, {
        method: "POST",
        body: { body },
      });
      message.value = "Note added.";
    } catch (error) {
      message.value = (error as Error).message;
    } finally {
      loading.value = false;
    }
  };

  const createCategory = async (name: string, description: string = '') => {
    loading.value = true;
    message.value = "";
    try {
      await $fetch('/api/categories', {
        method: 'POST',
        body: { name, description }
      });
      message.value = "Category created.";
      await refreshData();
      return { success: true };
    } catch (error) {
      message.value = (error as Error).message;
      return { error: true };
    } finally {
      loading.value = false;
    }
  };

  const getMediaUrl = (key: string) =>
    `/api/bucket0/get?key=${encodeURIComponent(key)}`;

  const groupedByCategory = computed(() =>
    categories.value.map((category) => ({
      id: category.id,
      title: category.name,
      items: mediaItems.value.filter((item) =>
        item.categories.some((c) => c.id === category.id)
      ),
    })).filter(group => group.items.length > 0)
  );

  const groupedByDate = computed(() => {
    const groups: Record<string, MediaItem[]> = {}
    mediaItems.value.forEach(item => {
      const date = new Date(item.createdAt)
      const key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    })
    
    return Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(key => ({
        id: key,
        title: key,
        items: groups[key]
      }))
  });

  return {
    mediaItems,
    categories,
    loading,
    message,
    refreshData,
    upload,
    deleteMedia,
    updateMedia,
    addNote,
    createCategory,
    getMediaUrl,
    groupedByCategory,
    groupedByDate
  };
})
