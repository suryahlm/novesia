# Asianovel Scraper - Curl Method

## 📖 Deskripsi
Scraper untuk mengambil novel dari asianovel.net menggunakan metode **curl.exe** yang berhasil bypass Cloudflare TLS fingerprinting.

## 🚀 Cara Pakai

### 1. Update Cookies
Buka browser, login ke asianovel.net, buka DevTools (F12) → Network → ambil Cookie header.
Edit file `cookies.cjs`:
```javascript
module.exports = {
    cookieString: 'cf_clearance=...; wordpress_logged_in_...=...'
};
```

### 2. Pilih Target Novel
Edit `target-novels.json` atau jalankan:
```bash
node select-novels.cjs
```

### 3. Jalankan Scraper

**Simpan ke R2 (Raw Storage) - RECOMMENDED:**
```bash
node scrape-to-r2.cjs
```
Hasil: `raw-novels/{slug}/metadata.json` + `chapters/*.html` di R2 bucket

**Simpan langsung ke Database:**
```bash
node scrape.cjs
```

## 📁 File-file

| File | Fungsi |
|------|--------|
| `scrape-to-r2.cjs` | Scraper ke R2 bucket (raw storage) |
| `scrape.cjs` | Scraper langsung ke database |
| `cookies.cjs` | Cookies dari browser |
| `target-novels.json` | Daftar novel yang akan di-scrape |
| `select-novels.cjs` | Script untuk memilih novel dari trending |
| `parse-html.cjs` | Parser untuk file HTML yang disave manual |

## 📦 R2 Structure
```
raw-novels/
├── {novel-slug}/
│   ├── metadata.json      # Novel info + chapter list
│   ├── cover.jpg          # Cover image
│   └── chapters/
│       ├── 1.html
│       ├── 2.html
│       └── ...
```

## ⚠️ Catatan Penting

1. **Cookie Expired**: cf_clearance biasanya expired dalam 24 jam
2. **Rate Limiting**: Delay 1.5-2.5s per chapter sudah built-in
3. **Resume**: Chapters yang sudah ada akan di-skip
4. **Cloudflare Block**: Jika masih 403, ambil ulang cookies fresh dari browser

## 🔧 Troubleshooting

### Error: 403 Forbidden
→ Cookie expired. Ambil ulang dari browser.

### Error: R2 credentials not found
→ Pastikan .env berisi R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT

### Error: ETIMEDOUT
→ Koneksi lambat. Coba lagi nanti.


### Error: null value in column "id"
→ Schema database berubah. Cek dan sesuaikan kolom.

### Error: ETIMEDOUT
→ Koneksi lambat. Coba lagi nanti.
