import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Persistence directory and file
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'vyrn_store.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Password hashing helper
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_vyrn_salt_2026').digest('hex');
}

// Seed data builder: Clean, Arabic-First, completely empty content collections
function getInitialDatabase() {
  const adminId = 'usr_admin_001';
  return {
    settings: {
      brandName: 'VYRN',
      brandTagline: 'عالم تصنعه بنفسك.',
      primaryAccent: '#FF5A1F',
      secondaryAccent: '#D7FF38',
      showIntroAnimation: true,
      allowGuestInteractions: true,
      commentModerationRequired: false,
      maintenanceMode: false,
    },
    users: [
      {
        id: adminId,
        username: 'boda',
        displayName: 'مدير المنصة (boda)',
        email: 'boda@vyrn.studio',
        passwordHash: hashPassword('abdo'),
        role: 'admin',
        avatarUrl: '',
        bio: 'المؤسس ومدير المحتوى لمنصة وعالم VYRN الإبداعي.',
        isApproved: true,
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
        privacySettings: {
          showFavorites: true,
          showActivity: true,
        },
      },
    ],
    // Clean empty catalog as required: No sample games, apps, projects, books, or podcasts!
    items: [],
    // 5 Initial core sections ready for the administrator to populate
    sections: [
      {
        id: 'sec_games_01',
        slug: 'games',
        name: 'الألعاب',
        description: 'مساحة ألعابك وتجارب المحاكاة التفاعلية.',
        accentColor: '#FF5A1F',
        layoutType: 'bento',
        filterType: 'category',
        categoryTarget: 'game',
        sortOrder: 1,
        isEnabled: true,
        isDraft: false,
        audience: 'public',
      },
      {
        id: 'sec_apps_02',
        slug: 'apps',
        name: 'التطبيقات',
        description: 'الأدوات البرمجية والتطبيقات الرقمية المبتكرة.',
        accentColor: '#D7FF38',
        layoutType: 'carousel',
        filterType: 'category',
        categoryTarget: 'app',
        sortOrder: 2,
        isEnabled: true,
        isDraft: false,
        audience: 'public',
      },
      {
        id: 'sec_projects_03',
        slug: 'projects',
        name: 'المشاريع',
        description: 'المشاريع الهندسية والبرمجية مفتوحة المصدر.',
        accentColor: '#FF5A1F',
        layoutType: 'grid',
        filterType: 'category',
        categoryTarget: 'project',
        sortOrder: 3,
        isEnabled: true,
        isDraft: false,
        audience: 'public',
      },
      {
        id: 'sec_books_04',
        slug: 'books',
        name: 'الكتب والمنشورات',
        description: 'المنشورات المعمارية والأبحاث والمقالات التصميمية.',
        accentColor: '#F2EBDD',
        layoutType: 'grid',
        filterType: 'category',
        categoryTarget: 'book',
        sortOrder: 4,
        isEnabled: true,
        isDraft: false,
        audience: 'public',
      },
      {
        id: 'sec_podcasts_05',
        slug: 'podcasts',
        name: 'البودكاست',
        description: 'الحلقات الصوتية والتسجيلات الإبداعية الاستكشافية.',
        accentColor: '#D7FF38',
        layoutType: 'media_showcase',
        filterType: 'category',
        categoryTarget: 'podcast',
        sortOrder: 5,
        isEnabled: true,
        isDraft: false,
        audience: 'public',
      },
    ],
    comments: [],
    likes: [],
    favorites: [],
    notifications: [],
    categories: [
      { id: 'cat_g1', type: 'game', name: 'ألعاب الأكشن والسرعة', slug: 'action-games', description: 'ألعاب قتالية وسريعة' },
      { id: 'cat_g2', type: 'game', name: 'المحاكاة والتجارب التفاعلية', slug: 'simulation-games', description: 'محاكيات واقعية وتجارب فيزيائية' },
      { id: 'cat_g3', type: 'game', name: 'الخيال العلمي والمستقبل', slug: 'scifi-games', description: 'عوالم مستقبلية وفضاء سيبراني' },
      { id: 'cat_g4', type: 'game', name: 'الألغاز والتحدي الذهني', slug: 'puzzle-games', description: 'تحديات ذكاء واستراتيجية' },
      { id: 'cat_g5', type: 'game', name: 'ألعاب متصفح خفيفة', slug: 'web-arcade', description: 'تشغيل مباشر وخفيف' },
    ],
  };
}

// Database helper functions
function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = getInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.categories) {
      parsed.categories = [
        { id: 'cat_g1', type: 'game', name: 'ألعاب الأكشن والسرعة', slug: 'action-games', description: 'ألعاب قتالية وسريعة' },
        { id: 'cat_g2', type: 'game', name: 'المحاكاة والتجارب التفاعلية', slug: 'simulation-games', description: 'محاكيات واقعية وتجارب فيزيائية' },
        { id: 'cat_g3', type: 'game', name: 'الخيال العلمي والمستقبل', slug: 'scifi-games', description: 'عوالم مستقبلية وفضاء سيبراني' },
        { id: 'cat_g4', type: 'game', name: 'الألغاز والتحدي الذهني', slug: 'puzzle-games', description: 'تحديات ذكاء واستراتيجية' },
        { id: 'cat_g5', type: 'game', name: 'ألعاب متصفح خفيفة', slug: 'web-arcade', description: 'تشغيل مباشر وخفيف' },
      ];
      writeDb(parsed);
    }
    return parsed;
  } catch (e) {
    console.error('Error reading DB file, recreating seed:', e);
    const initial = getInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

// ======================= FIRESTORE CLOUD DATABASE =======================
let firestoreDb: any = null;
const firebaseConfigPath = path.join(__dirname, 'firebase-applet-config.json');
if (fs.existsSync(firebaseConfigPath)) {
  try {
    const rawConfig = fs.readFileSync(firebaseConfigPath, 'utf-8');
    const firebaseConfig = JSON.parse(rawConfig);
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    const { getFirestore } = await import('firebase/firestore');
    const fbApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
    firestoreDb = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);
    console.log('[Firestore] Connected to Cloud Database:', firebaseConfig.firestoreDatabaseId);
  } catch (err: any) {
    console.warn('[Firestore] Initialization note:', err?.message || err);
  }
}

async function syncToFirestore(collectionName: string, docId: string, data: any) {
  if (!firestoreDb) return;
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    await setDoc(doc(firestoreDb, collectionName, docId), data, { merge: true });
  } catch (e: any) {
    console.warn(`[Firestore] Sync error for ${collectionName}/${docId}:`, e?.message);
  }
}

async function deleteFromFirestore(collectionName: string, docId: string) {
  if (!firestoreDb) return;
  try {
    const { doc, deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(firestoreDb, collectionName, docId));
  } catch (e: any) {
    console.warn(`[Firestore] Delete error for ${collectionName}/${docId}:`, e?.message);
  }
}

// Initial mirror to Firestore
if (firestoreDb) {
  setTimeout(async () => {
    try {
      const db = readDb();
      await syncToFirestore('settings', 'global', db.settings);
      for (const sec of db.sections || []) {
        await syncToFirestore('sections', sec.id, sec);
      }
      for (const cat of db.categories || []) {
        await syncToFirestore('categories', cat.id, cat);
      }
      for (const item of db.items || []) {
        await syncToFirestore('content', item.id, item);
      }
      console.log('[Firestore] Initial data sync to cloud database completed');
    } catch (e: any) {
      console.warn('[Firestore] Initial sync error:', e?.message);
    }
  }, 1000);
}

function writeDb(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  if (firestoreDb && data.settings) {
    syncToFirestore('settings', 'global', data.settings).catch(() => {});
  }
}

// Helper to sanitize user object
function sanitizeUser(u: any) {
  if (!u) return null;
  const { passwordHash, ...rest } = u;
  return rest;
}

// Helper auth middleware
function getAuthUser(req: Request) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const db = readDb();
  const user = db.users.find((u: any) => u.id === token);
  return user || null;
}

// ======================= REST API ROUTES =======================

// --- Settings ---
app.get('/api/settings', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.settings);
});

app.put('/api/settings', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== 'admin') {
    return res.status(403).json({ error: 'صلاحيات الإدارة مطلوبة لتعديل إعدادات المنصة.' });
  }
  const db = readDb();
  db.settings = { ...db.settings, ...req.body };
  writeDb(db);
  res.json(db.settings);
});

// --- Auth Routes ---
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'اسم المستخدم أو البريد الإلكتروني وكلمة المرور مطلوبة.' });
  }

  const db = readDb();
  const inputHash = hashPassword(password);
  const user = db.users.find(
    (u: any) =>
      (u.username.toLowerCase() === identifier.toLowerCase() ||
        u.email.toLowerCase() === identifier.toLowerCase()) &&
      u.passwordHash === inputHash
  );

  if (!user) {
    return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
  }

  res.json({
    token: user.id,
    user: sanitizeUser(user),
  });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, email, password, displayName } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'اسم المستخدم، البريد الإلكتروني، وكلمة المرور كلها حقول مطلوبة.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'يجب ألا تقل كلمة المرور عن 6 أحرف.' });
  }

  const db = readDb();
  if (db.users.some((u: any) => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ error: 'اسم المستخدم هذا مسجل مسبقاً.' });
  }
  if (db.users.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'البريد الإلكتروني هذا مسجل مسبقاً.' });
  }

  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    username: username.trim(),
    displayName: displayName?.trim() || username.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
    role: 'member',
    avatarUrl: '',
    bio: '',
    isApproved: true,
    mustChangePassword: false,
    createdAt: new Date().toISOString(),
    privacySettings: {
      showFavorites: true,
      showActivity: true,
    },
  };

  db.users.push(newUser);
  writeDb(db);

  res.status(201).json({
    token: newUser.id,
    user: sanitizeUser(newUser),
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ error: 'الجلسة غير صالحة أو غير مسجل الدخول.' });
  }
  res.json(sanitizeUser(authUser));
});

app.post('/api/auth/change-password', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً.' });
  }
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'يجب أن تتكون كلمة المرور الجديدة من 6 أحرف على الأقل.' });
  }

  const db = readDb();
  const user = db.users.find((u: any) => u.id === authUser.id);
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود.' });
  }

  if (currentPassword && user.passwordHash !== hashPassword(currentPassword)) {
    return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة.' });
  }

  user.passwordHash = hashPassword(newPassword);
  user.mustChangePassword = false;
  writeDb(db);

  res.json({ message: 'تم تحديث كلمة المرور بنجاح.', user: sanitizeUser(user) });
});

app.put('/api/auth/profile', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً.' });
  }
  const db = readDb();
  const user = db.users.find((u: any) => u.id === authUser.id);
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود.' });
  }

  const { displayName, bio, avatarUrl, privacySettings } = req.body;
  if (displayName) user.displayName = displayName.trim();
  if (bio !== undefined) user.bio = bio.trim();
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl.trim();
  if (privacySettings) {
    user.privacySettings = { ...user.privacySettings, ...privacySettings };
  }

  writeDb(db);
  res.json(sanitizeUser(user));
});

app.get('/api/users', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== 'admin') {
    return res.status(403).json({ error: 'صلاحيات الإدارة مطلوبة.' });
  }
  const db = readDb();
  res.json(db.users.map(sanitizeUser));
});

app.put('/api/users/:id/role', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== 'admin') {
    return res.status(403).json({ error: 'صلاحيات الإدارة مطلوبة.' });
  }
  const { id } = req.params;
  const { role, isApproved } = req.body;

  const db = readDb();
  const target = db.users.find((u: any) => u.id === id);
  if (!target) return res.status(404).json({ error: 'المستخدم غير موجود.' });

  if (target.id === authUser.id && role && role !== 'admin') {
    return res.status(400).json({ error: 'لا يمكنك سحب صلاحيات الإدارة من حسابك الحالي.' });
  }

  if (role) target.role = role;
  if (isApproved !== undefined) target.isApproved = isApproved;

  writeDb(db);
  res.json(sanitizeUser(target));
});

// --- Content Items ---
app.get('/api/content', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const db = readDb();
  const { type, category, status, search, audience, sort } = req.query;

  let items = [...db.items];

  // Access rules: public visitors see public only. Members see public + members. Approved / Admins see approved.
  items = items.filter((item: any) => {
    if (authUser?.role === 'admin') return true;
    if (item.status !== 'published') return false;

    if (item.audience === 'public') return true;
    if (item.audience === 'members' && authUser) return true;
    if (item.audience === 'approved' && authUser && (authUser.role === 'approved' || authUser.isApproved)) return true;

    return false;
  });

  if (type && type !== 'all') {
    items = items.filter((i: any) => i.type === type);
  }
  if (category) {
    items = items.filter((i: any) => i.category.toLowerCase().includes(String(category).toLowerCase()));
  }
  if (status && authUser?.role === 'admin') {
    items = items.filter((i: any) => i.status === status);
  }
  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(
      (i: any) =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.summary.toLowerCase().includes(q) ||
        i.tags.some((t: string) => t.toLowerCase().includes(q))
    );
  }

  // Sort
  if (sort === 'newest') {
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sort === 'popular') {
    items.sort((a, b) => (b.likesCount || 0) + (b.viewsCount || 0) - ((a.likesCount || 0) + (a.viewsCount || 0)));
  } else if (sort === 'downloads') {
    items.sort((a, b) => (b.downloadsCount || 0) - (a.downloadsCount || 0));
  }

  res.json(items);
});

app.get('/api/content/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const authUser = getAuthUser(req);
  const db = readDb();

  const item = db.items.find((i: any) => i.id === id || i.slug === id);
  if (!item) {
    return res.status(404).json({ error: 'المحتوى المطلوب غير موجود.' });
  }

  // Access checks
  if (item.status !== 'published' && authUser?.role !== 'admin') {
    return res.status(403).json({ error: 'هذا العنصر غير منشور بعد.' });
  }
  if (item.audience === 'members' && !authUser) {
    return res.status(403).json({ error: 'يتطلب تسجيل الدخول للوصول إلى هذا المحتوى.' });
  }
  if (item.audience === 'approved' && (!authUser || (authUser.role !== 'admin' && !authUser.isApproved))) {
    return res.status(403).json({ error: 'يتطلب حساباً معتمداً للوصول إلى هذا المحتوى.' });
  }

  item.viewsCount = (item.viewsCount || 0) + 1;
  writeDb(db);

  res.json(item);
});

app.post('/api/content', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== 'admin') {
    return res.status(403).json({ error: 'صلاحيات الإدارة مطلوبة لإضافة المحتوى.' });
  }

  const { title, type, category, description, summary } = req.body;
  if (!title || !type || !category) {
    return res.status(400).json({ error: 'العنوان، النوع، والتصنيف حقول مطلوبة.' });
  }

  const db = readDb();
  const slug = req.body.slug || title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/(^-|-$)+/g, '');
  const now = new Date().toISOString();

  const newItem = {
    id: `item_${type}_${Date.now()}`,
    slug,
    description: description || '',
    summary: summary || description?.slice(0, 100) || '',
    coverImage: req.body.coverImage || '',
    galleryImages: req.body.galleryImages || [],
    bannerImage: req.body.bannerImage || '',
    status: req.body.status || 'published',
    createdAt: now,
    updatedAt: now,
    creator: req.body.creator || authUser.displayName,
    isFeatured: !!req.body.isFeatured,
    isEditorsPick: !!req.body.isEditorsPick,
    audience: req.body.audience || 'public',
    tags: Array.isArray(req.body.tags) ? req.body.tags : [],
    likesCount: 0,
    viewsCount: 0,
    downloadsCount: 0,
    commentsEnabled: req.body.commentsEnabled !== false,
    newBadge: req.body.newBadge || { enabled: false, label: 'جديد' },
    customFields: req.body.customFields || {},
    gameConfig: req.body.gameConfig,
    appConfig: req.body.appConfig,
    projectConfig: req.body.projectConfig,
    bookConfig: req.body.bookConfig,
    podcastConfig: req.body.podcastConfig,
    ...req.body,
  };

  db.items.unshift(newItem);

  // If published, trigger in-app notification
  if (newItem.status === 'published') {
    const notif = {
      id: `notif_${Date.now()}`,
      userId: 'all',
      title: `إصدار جديد: ${newItem.title}`,
      message: `تمت إضافة "${newItem.title}" في قسم ${newItem.category}.`,
      linkUrl: `#item/${newItem.id}`,
      type: 'release',
      isRead: false,
      createdAt: now,
    };
    db.notifications.unshift(notif);
  }

  writeDb(db);
  syncToFirestore('content', newItem.id, newItem).catch(() => {});
  res.status(201).json(newItem);
});

app.put('/api/content/:id', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== 'admin') {
    return res.status(403).json({ error: 'صلاحيات الإدارة مطلوبة.' });
  }

  const { id } = req.params;
  const db = readDb();
  const index = db.items.findIndex((i: any) => i.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'عنصر المحتوى غير موجود.' });
  }

  db.items[index] = {
    ...db.items[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  writeDb(db);
  syncToFirestore('content', id, db.items[index]).catch(() => {});
  res.json(db.items[index]);
});

app.delete('/api/content/:id', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== 'admin') {
    return res.status(403).json({ error: 'صلاحيات الإدارة مطلوبة.' });
  }

  const { id } = req.params;
  const db = readDb();
  db.items = db.items.filter((i: any) => i.id !== id);
  db.comments = db.comments.filter((c: any) => c.contentId !== id);
  db.favorites = db.favorites.filter((f: any) => f.contentId !== id);
  db.likes = db.likes.filter((l: any) => l.contentId !== id);

  writeDb(db);
  deleteFromFirestore('content', id).catch(() => {});
  res.json({ message: 'تم حذف المحتوى بنجاح.' });
});

// Download / Launch tracking
app.post('/api/content/:id/launch', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const item = db.items.find((i: any) => i.id === id);
  if (item) {
    item.downloadsCount = (item.downloadsCount || 0) + 1;
    writeDb(db);
  }
  res.json({ success: true, count: item?.downloadsCount || 0 });
});

// --- Categories Management ---
app.get('/api/categories', (req: Request, res: Response) => {
  const db = readDb();
  const { type } = req.query;
  let categories = [...(db.categories || [])];
  if (type) {
    categories = categories.filter((c: any) => c.type === type);
  }
  const authUser = getAuthUser(req);
  const items = db.items || [];
  const results = categories.map((cat: any) => {
    const count = items.filter((i: any) => {
      if (authUser?.role !== 'admin' && i.status !== 'published') return false;
      return i.category === cat.name || i.category === cat.slug;
    }).length;
    return { ...cat, itemCount: count };
  });
  res.json(results);
});

app.post('/api/categories', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== 'admin') {
    return res.status(403).json({ error: 'صلاحيات الإدارة مطلوبة لإضافة التصنيفات.' });
  }
  const { name, type = 'game', description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'اسم التصنيف مطلوب.' });
  }
  const db = readDb();
  if (!db.categories) db.categories = [];
  const trimmedName = name.trim();
  if (db.categories.some((c: any) => c.name.toLowerCase() === trimmedName.toLowerCase() && c.type === type)) {
    return res.status(400).json({ error: 'هذا التصنيف موجود بالفعل.' });
  }
  const newCat = {
    id: `cat_${Date.now()}`,
    name: trimmedName,
    slug: trimmedName.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/(^-|-$)+/g, ''),
    type,
    description: description?.trim() || '',
  };
  db.categories.push(newCat);
  writeDb(db);
  syncToFirestore('categories', newCat.id, newCat).catch(() => {});
  res.status(201).json(newCat);
});

app.put('/api/categories/:id', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== 'admin') {
    return res.status(403).json({ error: 'صلاحيات الإدارة مطلوبة لتعديل التصنيفات.' });
  }
  const { id } = req.params;
  const { name, description } = req.body;
  const db = readDb();
  if (!db.categories) db.categories = [];
  const cat = db.categories.find((c: any) => c.id === id);
  if (!cat) {
    return res.status(404).json({ error: 'التصنيف غير موجود.' });
  }
  if (name && name.trim()) {
    cat.name = name.trim();
    cat.slug = cat.name.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/(^-|-$)+/g, '');
  }
  if (description !== undefined) {
    cat.description = description.trim();
  }
  writeDb(db);
  syncToFirestore('categories', id, cat).catch(() => {});
  res.json(cat);
});

app.delete('/api/categories/:id', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== 'admin') {
    return res.status(403).json({ error: 'صلاحيات الإدارة مطلوبة لحذف التصنيفات.' });
  }
  const { id } = req.params;
  const db = readDb();
  if (!db.categories) db.categories = [];
  db.categories = db.categories.filter((c: any) => c.id !== id && c.name !== id);
  writeDb(db);
  deleteFromFirestore('categories', id).catch(() => {});
  res.json({ message: 'تم حذف التصنيف بنجاح.' });
});

// Image / File Upload endpoint
app.post('/api/upload', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== 'admin') {
    return res.status(403).json({ error: 'صلاحيات الإدارة مطلوبة لرفع الملفات.' });
  }
  const { dataUrl, filename } = req.body;
  if (!dataUrl) {
    return res.status(400).json({ error: 'لم يتم توفير بيانات الملف.' });
  }
  try {
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.json({ url: dataUrl });
    }
    const ext = matches[1].split('/')[1]?.replace('jpeg', 'jpg') || 'png';
    const buffer = Buffer.from(matches[2], 'base64');
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const safeFilename = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(uploadsDir, safeFilename);
    fs.writeFileSync(filePath, buffer);
    const fileUrl = `/uploads/${safeFilename}`;
    res.json({ url: fileUrl });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'فشل في حفظ الملف المرفوع: ' + err.message });
  }
});

// --- Dynamic Sections ---
app.get('/api/sections', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const db = readDb();

  let sections = [...db.sections];
  if (authUser?.role !== 'admin') {
    sections = sections.filter((s: any) => s.isEnabled && !s.isDraft);
  }

  sections.sort((a: any, b: any) => a.sortOrder - b.sortOrder);
  res.json(sections);
});

app.post('/api/sections', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== 'admin') {
    return res.status(403).json({ error: 'صلاحيات الإدارة مطلوبة.' });
  }

  const { name, layoutType, filterType } = req.body;
  if (!name) return res.status(400).json({ error: 'اسم القسم مطلوب.' });

  const db = readDb();
  const newSection = {
    id: `sec_${Date.now()}`,
    slug: req.body.slug || name.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-'),
    name: name.trim(),
    description: req.body.description || '',
    accentColor: req.body.accentColor || '#FF5A1F',
    layoutType: layoutType || 'editorial',
    filterType: filterType || 'all',
    categoryTarget: req.body.categoryTarget || '',
    customItemIds: req.body.customItemIds || [],
    sortOrder: db.sections.length + 1,
    isEnabled: req.body.isEnabled !== false,
    isDraft: !!req.body.isDraft,
    audience: req.body.audience || 'public',
    coverImage: req.body.coverImage || '',
    bannerImage: req.body.bannerImage || '',
  };

  db.sections.push(newSection);
  writeDb(db);
  syncToFirestore('sections', newSection.id, newSection).catch(() => {});
  res.status(201).json(newSection);
});

app.put('/api/sections/:id', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== 'admin') {
    return res.status(403).json({ error: 'صلاحيات الإدارة مطلوبة.' });
  }

  const { id } = req.params;
  const db = readDb();
  const index = db.sections.findIndex((s: any) => s.id === id);
  if (index === -1) return res.status(404).json({ error: 'القسم غير موجود.' });

  db.sections[index] = { ...db.sections[index], ...req.body };
  writeDb(db);
  syncToFirestore('sections', id, db.sections[index]).catch(() => {});
  res.json(db.sections[index]);
});

app.delete('/api/sections/:id', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== 'admin') {
    return res.status(403).json({ error: 'صلاحيات الإدارة مطلوبة.' });
  }

  const { id } = req.params;
  const db = readDb();
  db.sections = db.sections.filter((s: any) => s.id !== id);
  writeDb(db);
  deleteFromFirestore('sections', id).catch(() => {});
  res.json({ message: 'تم حذف القسم بنجاح.' });
});

app.post('/api/sections/reorder', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== 'admin') {
    return res.status(403).json({ error: 'صلاحيات الإدارة مطلوبة.' });
  }

  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'مصفوفة الترتيب مطلوبة.' });

  const db = readDb();
  order.forEach(({ id, sortOrder }) => {
    const sec = db.sections.find((s: any) => s.id === id);
    if (sec) sec.sortOrder = sortOrder;
  });

  writeDb(db);
  res.json(db.sections);
});

// --- Comments & Interactions ---
app.get('/api/interactions/comments', (req: Request, res: Response) => {
  const { contentId } = req.query;
  const authUser = getAuthUser(req);
  const db = readDb();

  let comments = [...db.comments];
  if (contentId) {
    comments = comments.filter((c: any) => c.contentId === contentId);
  }

  comments = comments.filter((c: any) => {
    if (authUser?.role === 'admin') return true;
    if (c.userId === authUser?.id) return true;
    return c.isApproved;
  });

  comments.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  res.json(comments);
});

app.post('/api/interactions/comments', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const db = readDb();

  if (!authUser && !db.settings.allowGuestInteractions) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول لنشر التعليقات.' });
  }

  const { contentId, content, parentId } = req.body;
  if (!contentId || !content?.trim()) {
    return res.status(400).json({ error: 'معرف المحتوى ونص التعليق مطلوبان.' });
  }

  const item = db.items.find((i: any) => i.id === contentId);
  if (!item || !item.commentsEnabled) {
    return res.status(403).json({ error: 'التعليقات معطلة لهذا المحتوى.' });
  }

  const isApproved = authUser?.role === 'admin' || !db.settings.commentModerationRequired;

  const newComment = {
    id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    contentId,
    userId: authUser?.id || 'guest_user',
    username: authUser?.username || 'زائر مستكشف',
    userDisplayName: authUser?.displayName || 'زائر',
    userAvatar: authUser?.avatarUrl || '',
    content: content.trim().slice(0, 1500),
    createdAt: new Date().toISOString(),
    parentId: parentId || null,
    isApproved,
    isReported: false,
    likesCount: 0,
  };

  db.comments.push(newComment);

  if (parentId) {
    const parent = db.comments.find((c: any) => c.id === parentId);
    if (parent && parent.userId !== authUser?.id && parent.userId !== 'guest_user') {
      db.notifications.unshift({
        id: `notif_${Date.now()}`,
        userId: parent.userId,
        title: 'رد جديد على تعليقك',
        message: `قام ${newComment.userDisplayName} بالرد على تعليقك في "${item.title}".`,
        linkUrl: `#item/${contentId}`,
        type: 'reply',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  writeDb(db);
  res.status(201).json(newComment);
});

app.delete('/api/interactions/comments/:id', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'يجب تسجيل الدخول.' });

  const { id } = req.params;
  const db = readDb();
  const comment = db.comments.find((c: any) => c.id === id);
  if (!comment) return res.status(404).json({ error: 'التعليق غير موجود.' });

  if (authUser.role !== 'admin' && comment.userId !== authUser.id) {
    return res.status(403).json({ error: 'يمكنك فقط حذف تعليقاتك الخاصة.' });
  }

  db.comments = db.comments.filter((c: any) => c.id !== id && c.parentId !== id);
  writeDb(db);
  res.json({ message: 'تم حذف التعليق.' });
});

app.post('/api/interactions/comments/:id/report', (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const db = readDb();
  const comment = db.comments.find((c: any) => c.id === id);
  if (!comment) return res.status(404).json({ error: 'التعليق غير موجود.' });

  comment.isReported = true;
  comment.reportReason = reason || 'تم الإبلاغ بواسطة أحد المستخدمين للمراجعة.';
  writeDb(db);

  res.json({ message: 'تم إرسال البلاغ إلى قائمة مراجعة الإدارة.' });
});

// --- Likes & Favorites ---
app.post('/api/interactions/likes', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const { contentId } = req.body;
  if (!contentId) return res.status(400).json({ error: 'معرف المحتوى مطلوب.' });

  const db = readDb();
  const item = db.items.find((i: any) => i.id === contentId);
  if (!item) return res.status(404).json({ error: 'عنصر المحتوى غير موجود.' });

  const userId = authUser?.id || req.ip || 'anon';
  const existingIdx = db.likes.findIndex((l: any) => l.userId === userId && l.contentId === contentId);

  let liked = false;
  if (existingIdx !== -1) {
    db.likes.splice(existingIdx, 1);
    item.likesCount = Math.max(0, (item.likesCount || 0) - 1);
    liked = false;
  } else {
    db.likes.push({ userId, contentId });
    item.likesCount = (item.likesCount || 0) + 1;
    liked = true;
  }

  writeDb(db);
  res.json({ liked, count: item.likesCount });
});

app.get('/api/favorites', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.json([]);

  const db = readDb();
  const favContentIds = db.favorites.filter((f: any) => f.userId === authUser.id).map((f: any) => f.contentId);
  const favoriteItems = db.items.filter((i: any) => favContentIds.includes(i.id));

  res.json(favoriteItems);
});

app.post('/api/favorites/toggle', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'يرجى تسجيل الدخول لحفظ المفضلة.' });

  const { contentId } = req.body;
  if (!contentId) return res.status(400).json({ error: 'معرف المحتوى مطلوب.' });

  const db = readDb();
  const existingIdx = db.favorites.findIndex((f: any) => f.userId === authUser.id && f.contentId === contentId);

  let isFavorite = false;
  if (existingIdx !== -1) {
    db.favorites.splice(existingIdx, 1);
    isFavorite = false;
  } else {
    db.favorites.push({ userId: authUser.id, contentId });
    isFavorite = true;
  }

  writeDb(db);
  res.json({ isFavorite });
});

// --- Notifications ---
app.get('/api/notifications', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const db = readDb();

  const userNotifs = db.notifications.filter((n: any) => n.userId === authUser?.id || n.userId === 'all');
  res.json(userNotifs);
});

app.put('/api/notifications/:id/read', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'يجب تسجيل الدخول.' });

  const { id } = req.params;
  const db = readDb();
  const notif = db.notifications.find((n: any) => n.id === id);
  if (notif) {
    notif.isRead = true;
    writeDb(db);
  }
  res.json({ success: true });
});

app.put('/api/notifications/mark-all-read', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'يجب تسجيل الدخول.' });

  const db = readDb();
  db.notifications.forEach((n: any) => {
    if (n.userId === authUser.id || n.userId === 'all') {
      n.isRead = true;
    }
  });
  writeDb(db);
  res.json({ success: true });
});

// --- Admin Moderation & Honest Analytics ---
app.get('/api/moderation/comments', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== 'admin') {
    return res.status(403).json({ error: 'صلاحيات الإدارة مطلوبة.' });
  }

  const db = readDb();
  const queue = db.comments.filter((c: any) => c.isReported || !c.isApproved);
  res.json(queue);
});

app.put('/api/moderation/comments/:id/approve', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== 'admin') {
    return res.status(403).json({ error: 'صلاحيات الإدارة مطلوبة.' });
  }

  const { id } = req.params;
  const db = readDb();
  const c = db.comments.find((item: any) => item.id === id);
  if (c) {
    c.isApproved = true;
    c.isReported = false;
    writeDb(db);
  }
  res.json({ success: true });
});

app.get('/api/analytics', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== 'admin') {
    return res.status(403).json({ error: 'صلاحيات الإدارة مطلوبة.' });
  }

  const db = readDb();
  const itemsByType: Record<string, number> = {
    game: 0,
    app: 0,
    project: 0,
    book: 0,
    podcast: 0,
  };

  let totalLikes = 0;
  let totalViews = 0;
  let totalDownloads = 0;

  db.items.forEach((item: any) => {
    if (itemsByType[item.type] !== undefined) {
      itemsByType[item.type]++;
    }
    totalLikes += item.likesCount || 0;
    totalViews += item.viewsCount || 0;
    totalDownloads += item.downloadsCount || 0;
  });

  const analytics = {
    totalItems: db.items.length,
    itemsByType,
    totalUsers: db.users.length,
    totalComments: db.comments.length,
    totalLikes,
    totalViews,
    totalDownloads,
    pendingModerationCount: db.comments.filter((c: any) => !c.isApproved).length,
    reportedCommentsCount: db.comments.filter((c: any) => c.isReported).length,
  };

  res.json(analytics);
});

// Vite Middleware Mounting (Development vs Production)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VYRN] Platform engine online at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[VYRN] Fatal server startup error:', err);
  process.exit(1);
});
