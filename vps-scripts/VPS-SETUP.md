# VPS Novesia Scraper Setup

## 1. Upload Files ke VPS

Upload `scraper.js` dan `translator.js` ke `/var/www/novesia-scraper/`

## 2. Install PM2

```bash
npm install -g pm2
```

## 3. Setup .env

```bash
nano /var/www/novesia-scraper/.env
```

Isi:
```
DATABASE_URL=your_supabase_direct_url
GROQ_API_KEY=your_groq_api_key
```

## 4. Jalankan dengan PM2

```bash
cd /var/www/novesia-scraper
pm2 start scraper.js --name "scraper"
pm2 start translator.js --name "translator"
```

## 5. PM2 Commands

```bash
pm2 status           # Lihat status
pm2 logs scraper     # Lihat log
pm2 stop scraper     # Stop
pm2 restart scraper  # Restart
pm2 delete scraper   # Hapus
```

## 6. Setup Cron

```bash
crontab -e
```

Tambahkan:
```
# Scraper tiap 3 jam
0 */3 * * * cd /var/www/novesia-scraper && /usr/bin/node scraper.js >> scraper.log 2>&1

# Translator tiap 1 jam
0 * * * * cd /var/www/novesia-scraper && /usr/bin/node translator.js >> translator.log 2>&1
```
