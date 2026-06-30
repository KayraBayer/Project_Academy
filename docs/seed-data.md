# Manuel Örnek Veri

Bu dosya yalnızca örnek doküman formatlarını gösterir. Otomatik çalıştırılacak seed scripti değildir.

## Admin Profili

`users/{adminAuthUid}`

```js
{
  uid: "adminAuthUid",
  name: "Deniz Yılmaz",
  email: "admin@erdincbayer.com",
  role: "admin",
  status: "active",
  createdAt: serverTimestamp(),
  lastLoginAt: null,
  gradeLevel: "",
  profilePhotoURL: null
}
```

## Öğrenci Profili

`users/{studentAuthUid}`

```js
{
  uid: "studentAuthUid",
  name: "Ali Yılmaz",
  email: "ali.yilmaz@erdincbayer.com",
  role: "student",
  status: "active",
  createdAt: serverTimestamp(),
  lastLoginAt: null,
  gradeLevel: "8. Sınıf",
  profilePhotoURL: null
}
```

## Örnek Kaynaklar

Her kategori için `resources` koleksiyonuna bir doküman eklenebilir.

```js
{
  title: "LGS Genel Deneme 1",
  description: "LGS hazırlığı için tüm dersleri kapsayan genel deneme.",
  category: "denemeler",
  publisher: "Erdinç Bayer Akademi",
  subject: "Genel",
  gradeLevel: "8. Sınıf",
  coverImageURL: "",
  fileURL: "",
  externalLink: "https://example.com/deneme",
  status: "active",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  createdBy: "adminAuthUid",
  viewCount: 0
}
```

```js
{
  title: "Haftalık Matematik Denemesi",
  description: "Haftalık düzenli çalışma için matematik denemesi.",
  category: "haftalik-denemeler",
  publisher: "Erdinç Bayer Akademi",
  subject: "Matematik",
  gradeLevel: "8. Sınıf",
  coverImageURL: "",
  fileURL: "",
  externalLink: "",
  status: "active",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  createdBy: "adminAuthUid",
  viewCount: 0
}
```

`category` alanı şu değerlerden biri olmalıdır:

- `denemeler`
- `haftalik-denemeler`
- `yayinlar`
- `testler`
- `yazili-ornekleri`
