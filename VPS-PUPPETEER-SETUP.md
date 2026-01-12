# Setup Puppeteer Stealth di VPS

## Langkah 1: SSH ke VPS
```bash
ssh root@YOUR_VPS_IP
```

## Langkah 2: Install Dependencies (Chromium untuk Puppeteer)
```bash
# Update system
apt update && apt upgrade -y

# Install dependencies untuk Chromium
apt install -y wget unzip fontconfig locales gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget libgbm1
```

## Langkah 3: Buat Folder Project
```bash
mkdir -p /root/novesia-scraper
cd /root/novesia-scraper
```

## Langkah 4: Install Node.js (jika belum ada)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

## Langkah 5: Install NPM Packages
```bash
npm init -y
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth pg dotenv
```

## Langkah 6: Buat File .env
```bash
nano .env
```

Isi dengan:
```
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```
(Ganti dengan DATABASE_URL dari project Novesia Anda)

## Langkah 7: Upload Script
Copy isi file `puppeteer-scraper.js` ke VPS:
```bash
nano puppeteer-scraper.js
# Paste isi script, lalu Ctrl+X, Y, Enter untuk save
```

## Langkah 8: Jalankan Scraper
```bash
node puppeteer-scraper.js
```

## Langkah 9: Jalankan di Background (Optional)
```bash
# Install PM2
npm install -g pm2

# Jalankan dengan PM2
pm2 start puppeteer-scraper.js --name "novesia-scraper"

# Lihat logs
pm2 logs novesia-scraper

# Stop
pm2 stop novesia-scraper
```

---

## Troubleshooting

### Error: "Cannot launch browser"
```bash
apt install -y chromium-browser
```

### Error: "No usable sandbox"
Sudah ditangani di script dengan `--no-sandbox` flag.

### Error: "Out of memory"
VPS butuh minimal 1GB RAM. Jika kurang:
```bash
# Buat swap file
fallocate -l 1G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```
