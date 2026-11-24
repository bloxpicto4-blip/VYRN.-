import {
  ContentItem,
  SectionConfig,
  UserProfile,
  CommentItem,
  NotificationItem,
  PlatformSettings,
  PlatformAnalytics,
  GameCategory,
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('vyrn_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Settings
  async getSettings(): Promise<PlatformSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(settings: Partial<PlatformSettings>): Promise<PlatformSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update settings');
    }
    return res.json();
  },

  // Auth
  async login(identifier: string, password: string): Promise<{ token: string; user: UserProfile }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to login');
    }
    return res.json();
  },

  async register(data: { username: string; email: string; password: string; displayName?: string }): Promise<{ token: string; user: UserProfile }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to register');
    }
    return res.json();
  },

  async getMe(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Session invalid');
    return res.json();
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string; user: UserProfile }> {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update password');
    }
    return res.json();
  },

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update profile');
    }
    return res.json();
  },

  async getUsers(): Promise<UserProfile[]> {
    const res = await fetch(`${API_BASE}/users`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async updateUserRole(id: string, role: string, isApproved?: boolean): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/users/${id}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ role, isApproved }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update user role');
    }
    return res.json();
  },

  // Content
  async getContent(params?: {
    type?: string;
    category?: string;
    search?: string;
    status?: string;
    sort?: string;
  }): Promise<ContentItem[]> {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.sort) query.set('sort', params.sort);

    const res = await fetch(`${API_BASE}/content?${query.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch content');
    return res.json();
  },

  async getContentById(id: string): Promise<ContentItem> {
    const res = await fetch(`${API_BASE}/content/${id}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch content item');
    }
    return res.json();
  },

  async createContent(data: Partial<ContentItem>): Promise<ContentItem> {
    const res = await fetch(`${API_BASE}/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create content item');
    }
    return res.json();
  },

  async updateContent(id: string, data: Partial<ContentItem>): Promise<ContentItem> {
    const res = await fetch(`${API_BASE}/content/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update content item');
    }
    return res.json();
  },

  async deleteContent(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/content/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to delete content');
  },

  async trackLaunch(id: string): Promise<number> {
    const res = await fetch(`${API_BASE}/content/${id}/launch`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.count || 0;
  },

  // Dynamic Sections
  async getSections(): Promise<SectionConfig[]> {
    const res = await fetch(`${API_BASE}/sections`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch sections');
    return res.json();
  },

  async createSection(data: Partial<SectionConfig>): Promise<SectionConfig> {
    const res = await fetch(`${API_BASE}/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create section');
    }
    return res.json();
  },

  async updateSection(id: string, data: Partial<SectionConfig>): Promise<SectionConfig> {
    const res = await fetch(`${API_BASE}/sections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update section');
    }
    return res.json();
  },

  async deleteSection(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/sections/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to delete section');
  },

  async reorderSections(order: { id: string; sortOrder: number }[]): Promise<SectionConfig[]> {
    const res = await fetch(`${API_BASE}/sections/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ order }),
    });
    if (!res.ok) throw new Error('Failed to reorder sections');
    return res.json();
  },

  // Interactions (Comments, Likes, Reports)
  async getComments(contentId: string): Promise<CommentItem[]> {
    const res = await fetch(`${API_BASE}/interactions/comments?contentId=${encodeURIComponent(contentId)}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch comments');
    return res.json();
  },

  async postComment(data: { contentId: string; content: string; parentId?: string }): Promise<CommentItem> {
    const res = await fetch(`${API_BASE}/interactions/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to post comment');
    }
    return res.json();
  },

  async deleteComment(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/interactions/comments/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to delete comment');
  },

  async reportComment(id: string, reason: string): Promise<void> {
    const res = await fetch(`${API_BASE}/interactions/comments/${id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to submit report');
  },

  async toggleLike(contentId: string): Promise<{ liked: boolean; count: number }> {
    const res = await fetch(`${API_BASE}/interactions/likes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ contentId }),
    });
    if (!res.ok) throw new Error('Failed to toggle like');
    return res.json();
  },

  // Favorites
  async getFavorites(): Promise<ContentItem[]> {
    const res = await fetch(`${API_BASE}/favorites`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) return [];
    return res.json();
  },

  async toggleFavorite(contentId: string): Promise<{ isFavorite: boolean }> {
    const res = await fetch(`${API_BASE}/favorites/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ contentId }),
    });
    if (!res.ok) throw new Error('Sign in to save favorites');
    return res.json();
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) return [];
    return res.json();
  },

  async markNotificationRead(id: string): Promise<void> {
    await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: { ...getAuthHeader() },
    });
  },

  async markAllNotificationsRead(): Promise<void> {
    await fetch(`${API_BASE}/notifications/mark-all-read`, {
      method: 'PUT',
      headers: { ...getAuthHeader() },
    });
  },

  // Moderation & Analytics
  async getModerationQueue(): Promise<CommentItem[]> {
    const res = await fetch(`${API_BASE}/moderation/comments`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch moderation queue');
    return res.json();
  },

  async approveComment(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/moderation/comments/${id}/approve`, {
      method: 'PUT',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to approve comment');
  },

  async getAnalytics(): Promise<PlatformAnalytics> {
    const res = await fetch(`${API_BASE}/analytics`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  // Categories
  async getCategories(type?: string): Promise<GameCategory[]> {
    const q = type ? `?type=${type}` : '';
    const res = await fetch(`${API_BASE}/categories${q}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) return [];
    return res.json();
  },

  async createCategory(data: { name: string; type?: string; description?: string }): Promise<GameCategory> {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل إنشاء التصنيف');
    }
    return res.json();
  },

  async updateCategory(id: string, data: { name?: string; description?: string }): Promise<GameCategory> {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل تعديل التصنيف');
    }
    return res.json();
  },

  async deleteCategory(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل حذف التصنيف');
    }
  },

  async uploadFile(dataUrl: string, filename?: string): Promise<{ url: string }> {
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ dataUrl, filename }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل رفع الملف');
    }
    return res.json();
  },
};
