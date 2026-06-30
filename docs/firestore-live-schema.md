# Canlı Firestore Veri Yapısı

Bu dosya 26 Haziran 2026 tarihinde salt-okunur incelemeyle çıkarılan mevcut `stdserver-94bec` Firestore modelini özetler. İnceleme sırasında Firestore'a yazma yapılmadı.

## Genel Model

Mevcut canlı veritabanı ilk tasarlanan `users/resources/studentProgress/announcements` modelini kullanmıyor. Kaynaklar, her yayın/kitap/kategori için ayrı root collection olarak tutuluyor.

Kaynak koleksiyonlarının ortak doküman alanları:

```js
{
  id: string,
  testId: string,
  uniqueId: string,
  sourceCollection: string,
  name: string,
  type: "yayın",
  questionCount: number,
  link: string,
  grade: number,
  answerKey: string,
  createdAt: timestamp
}
```

Uygulama bu dokümanları şu normalize kaynağa dönüştürür:

```js
{
  id: encode(collectionName + docId),
  legacyId: Firestore doküman ID'si,
  testId: `${collectionName}::${docId}`,
  uniqueId: `${collectionName}::${docId}`,
  sourceCollection: string,
  sourceDocId: string,
  title: name,
  publisher: sourceCollection,
  subject: name'den çıkarılan konu,
  gradeLevel: `${grade}. Sınıf`,
  questionCount: number,
  answerKey: string,
  externalLink: link,
  category: derivedCategory
}
```

## Metadata Koleksiyonları

### `ozelKategoriler`

Alanlar:

```js
{ name: string }
```

Bu koleksiyon kaynak root collection adlarını listeler. Uygulama kaynakları keşfetmek için önce burayı okur.

### `kategoriAdlari`

Alanlar:

```js
{ name: string }
```

Standart kategori/test grubu adlarını listeler. Bazıları root collection olarak mevcut olabilir, bazıları sadece referans kategori olabilir.

### `ogrenciAdlari`

Doküman ID'si Firebase Auth `uid` ile eşleşir.

```js
{ fullname: string }
```

Öğrenci profil fallback'i buradan okunur. Örneğin `fullname` değeri `aa_bb` ise:

- submission koleksiyonu: `aa_bb`
- ödev koleksiyonu: `aa_bb_odevler`

### `students`

Admin/IAM ile okunabiliyor; normal öğrenci hesabıyla permission denied dönüyor.

```js
{
  firstName: string,
  lastName: string,
  email: string,
  createdAt: timestamp
}
```

## Öğrenci İlerleme Koleksiyonları

### `{fullname}`

Öğrenci cevap gönderimleri.

```js
{
  type: "submission",
  user: {
    uid: string,
    email: string,
    name: string
  },
  test: {
    id: string | null,
    category: string,
    name: string,
    link: string,
    grade: number
  },
  answers: string,
  answersMap: map,
  answersArray: array,
  answeredCount: number,
  count: number,
  scoring: {
    status: "ok",
    answerKey: string,
    keyLength: number,
    compared: number,
    correctCount: number,
    wrongCount: number,
    blankCount: number,
    correctQuestions: number[],
    wrongQuestions: number[],
    blankQuestions: number[]
  },
  createdAt: timestamp
}
```

### `{fullname}_odevler`

Öğrenciye atanmış ödevler.

```js
{
  type: "assignment",
  status: "assigned" | "completed",
  assignedAt: timestamp,
  completedAt: timestamp | undefined,
  test: {
    id: string,
    category: string,
    name: string,
    link: string,
    grade: number,
    questionCount: number,
    isSpecial: boolean
  }
}
```

## UI Kategori Türetme

Kaynaklarda doğrudan `category` alanı yok. Uygulama `sourceCollection + name` metnine göre şu eşlemeyi yapar:

- `YAZILI` içerirse: `yazili-ornekleri`
- `HAFTALIK` içerirse: `haftalik-denemeler`
- `DENEME` içerirse: `denemeler`
- `TEST`, `SB`, `SORUBANK`, `YAPRAK`, `KAZANIM`, `BECERİ`, `PROTEST`, `HAFTA SONU` içerirse: `testler`
- Diğerleri: `yayinlar`

## Uygulama Notları

- Firestore yazma fonksiyonları kaynak ve ilerleme servislerinde kapalı tutuldu.
- 27 Haziran 2026 tarihinde 2.290 mevcut test dokümanına `id`, `testId`, `uniqueId`, `sourceCollection` alanları eklendi. `uniqueId/testId` formatı: `${collectionName}::${docId}`.
- `users/{uid}` profili varsa öncelikli kullanılır; yoksa `ogrenciAdlari/{uid}` fallback profili kullanılır.
- Kaynak listeleme root collection listesi için client SDK ile `ozelKategoriler` ve `kategoriAdlari` okur.
- Root collection listeleme Firebase client SDK'da olmadığı için uygulamada IAM `listCollectionIds` kullanılmaz.
