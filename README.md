# Erdinç Bayer Akademi Öğrenci Platformu

React + Vite + Tailwind CSS + Firebase ile hazırlanmış Türkçe özel ders ve öğrenci kaynak platformu.

## Özellikler

- Firebase Authentication ile e-posta/şifre girişi
- Firestore tabanlı rol ve hesap durumu kontrolü
- Öğrenci paneli, kategori sayfaları, kaynak detay ve profil ekranı
- Admin paneli, kaynak CRUD, öğrenci istatistikleri, hesap yönetimi, duyuru yönetimi ve ayarlar
- Firebase Storage kapak görseli ve dosya yükleme
- React Router korumalı öğrenci/admin rotaları
- Kalıcı açık/koyu tema desteği
- Firebase Hosting uyumlu `dist` çıktısı

## Kurulum

```bash
npm install
cp .env.example .env
npm run dev
```

`.env` dosyasını kendi Firebase projenizle doldurun:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Üretim build:

```bash
npm run build
```

Firebase Hosting deploy için:

```bash
firebase deploy --only hosting
```

## Production Yayın

Canlı domain: `erdincbayer.net`

Repo, `main` branch'e push geldiğinde GitHub Actions üzerinden Firebase Hosting production deploy çalıştıracak şekilde ayarlanmıştır.

GitHub > Settings > Environments > `production` içinde şu değerleri ekleyin:

Environment variables:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_FUNCTIONS_REGION
VITE_ADMIN_EMAILS
```

Environment secrets:

```text
FIREBASE_SERVICE_ACCOUNT
```

`FIREBASE_SERVICE_ACCOUNT`, Firebase Console > Project settings > Service accounts > Firebase Admin SDK > Generate new private key ile indirilen JSON içeriğinin tamamıdır.

Domain bağlama Firebase Console üzerinden yapılır:

1. Firebase Console > Hosting > Add custom domain.
2. `erdincbayer.net` alan adını ekleyin.
3. Firebase'in verdiği TXT doğrulama kaydını domain DNS paneline girin.
4. Doğrulama tamamlanınca Firebase'in verdiği A/AAAA veya CNAME kayıtlarını DNS paneline ekleyin.
5. SSL sertifikası Firebase tarafından otomatik hazırlanır.

## Firestore Koleksiyonları

Canlı projedeki mevcut veri yapısı için ayrıca [docs/firestore-live-schema.md](docs/firestore-live-schema.md) dosyasına bakın. Mevcut canlı DB, kaynakları yayın/kitap adıyla açılmış root collection'larda tutuyor.

### `users/{uid}`

```js
{
  uid: string,
  name: string,
  email: string,
  role: "student" | "admin",
  status: "active" | "passive" | "suspended",
  createdAt: timestamp,
  lastLoginAt: timestamp,
  gradeLevel: string,
  profilePhotoURL: string | null
}
```

### `resources/{resourceId}`

```js
{
  title: string,
  description: string,
  category: "denemeler" | "haftalik-denemeler" | "yayinlar" | "testler" | "yazili-ornekleri",
  publisher: string,
  subject: string,
  gradeLevel: string,
  coverImageURL: string,
  fileURL: string,
  externalLink: string,
  status: "active" | "draft" | "archived",
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: string,
  viewCount: number
}
```

### `studentProgress/{progressId}`

```js
{
  studentId: string,
  resourceId: string,
  category: string,
  status: "not_started" | "in_progress" | "completed",
  score: number | null,
  completedAt: timestamp | null,
  updatedAt: timestamp
}
```

### `announcements/{announcementId}`

```js
{
  title: string,
  content: string,
  isActive: boolean,
  createdAt: timestamp
}
```

Duyurular öğrencilere gösterilir; ayrı bir hedef rol seçimi kullanılmaz.

## İlk Admin Kullanıcısı

1. Firebase Console > Authentication üzerinden bir kullanıcı oluşturun.
2. Oluşan kullanıcının `uid` değerini kopyalayın.
3. Firestore `users/{uid}` dokümanını manuel oluşturun:

```js
{
  uid: "AUTH_UID",
  name: "Admin Kullanıcı",
  email: "admin@erdincbayer.com",
  role: "admin",
  status: "active",
  createdAt: serverTimestamp(),
  lastLoginAt: null,
  gradeLevel: "",
  profilePhotoURL: null
}
```

Öğrenci kullanıcıları için de Authentication kullanıcısı ve aynı `uid` ile `users/{uid}` profili gerekir.

## Admin Auth Kullanıcı Yönetimi Notu

Client tarafında güvenli Firebase Auth kullanıcı oluşturma/silme işlemi yapılmamalıdır. Admin panelindeki hesap oluşturma ekranı Firestore profil kaydını hazırlar. Gerçek Auth kullanıcı oluşturma, silme ve özel yetki süreçleri Firebase Cloud Functions + Admin SDK ile tamamlanmalıdır.

## Manuel Seed Verisi

Örnek veri şeması için [docs/seed-data.md](docs/seed-data.md) dosyasına bakın. Bu projede otomatik seed scripti yoktur; mevcut Firestore verisine dokunmamak için örnekler manuel ekleme yönergesi olarak bırakılmıştır.
