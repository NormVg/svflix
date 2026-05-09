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
      const { key: agentKey } = await $fetch<{ key: string }>("/api/bucket0/agent-key");
      
      const safeName = payload.file.name.replace(/[^a-zA-Z0-9._/-]/g, "_");
      const now = new Date().toISOString().slice(0, 10);
      let finalKey = payload.key.trim();
      if (!finalKey) {
        finalKey = `uploads/${now}/${safeName}`;
      } else if (finalKey.endsWith("/")) {
        finalKey = `${finalKey}${safeName}`;
      }

      const form = new FormData();
      form.append("file", payload.file);
      form.append("filename", finalKey);

      const uploadRes = await fetch("https://bucket0.com/api/agent-bucket/files/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${agentKey}` },
        body: form
      });

      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.statusText}`);

      const data = await uploadRes.json();
      const actualKey = data.key || finalKey;

      await $fetch("/api/media", {
        method: "POST",
        body: {
          bucketKey: actualKey,
          mediaType: payload.mediaType,
          title: payload.title,
          description: payload.description,
          categoryIds: payload.categoryIds,
        },
      });

      message.value = `Saved: ${actualKey}`;
      await refreshData();
      return { success: true, key: actualKey };
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

  const bulkUpload = async (files: File[], opts: {
    mediaType?: "image" | "video";
    categoryIds?: string[];
  } = {}) => {
    loading.value = true;
    message.value = `Uploading ${files.length} files...`;
    try {
      const { key: agentKey } = await $fetch<{ key: string }>("/api/bucket0/agent-key");
      const now = new Date().toISOString().slice(0, 10);

      const results = await Promise.all(
        files.map(async (file) => {
          const mediaType = opts.mediaType ?? (file.type.startsWith("video/") ? "video" : "image");
          const safeName = file.name.replace(/[^a-zA-Z0-9._/-]/g, "_");
          const finalKey = `uploads/${now}/${safeName}`;

          const form = new FormData();
          form.append("file", file);
          form.append("filename", finalKey);

          const uploadRes = await fetch("https://bucket0.com/api/agent-bucket/files/upload", {
            method: "POST",
            headers: { "Authorization": `Bearer ${agentKey}` },
            body: form
          });

          if (!uploadRes.ok) throw new Error(`AgentBucket upload failed for ${file.name}`);
          
          const uploadData = await uploadRes.json();
          const actualKey = uploadData.key || finalKey;

          await $fetch("/api/media", {
            method: "POST",
            body: {
              bucketKey: actualKey,
              mediaType,
              title: "",
              description: "",
              categoryIds: opts.categoryIds ?? [],
            },
          });

          return { success: true, key: actualKey };
        })
      );

      message.value = `Uploaded ${results.length} files.`;
      await refreshData();
      return results;
    } catch (error) {
      message.value = (error as Error).message;
      return [];
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

  const updateMedia = async (id: string, payload: { title?: string; description?: string; categoryIds?: string[] }) => {
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
    objectUrls.value[key] || `/api/media/proxy?key=${encodeURIComponent(key)}`;

  const objectUrls = ref<Record<string, string>>({});
  
  const loadMediaBlob = async (key: string) => {
    if (objectUrls.value[key]) return objectUrls.value[key];
    
    const { key: agentKey } = await $fetch<{ key: string }>("/api/bucket0/agent-key");
    const response = await fetch(
      `https://bucket0.com/api/agent-bucket/files/download?key=${encodeURIComponent(key)}`,
      { headers: { Authorization: `Bearer ${agentKey}` } }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to load media blob: ${response.status}`);
    }
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    objectUrls.value[key] = url;
    return url;
  };

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
        items: groups[key] || []
      }))
  });

  return {
    mediaItems,
    categories,
    loading,
    message,
    refreshData,
    upload,
    bulkUpload,
    deleteMedia,
    updateMedia,
    addNote,
    createCategory,
    getMediaUrl,
    loadMediaBlob,
    groupedByCategory,
    groupedByDate
  };
})
