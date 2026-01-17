# Data Recovery Guide for Production

## Problem
The `scraper-data` folder contains 27 novels with thousands of chapters but exceeds GitHub's 100MB file size limit, preventing deployment to production.

## Solution Options

### Option 1: Direct Database Import (Fastest)
Since development and production use the SAME Supabase database (based on .env), data imported locally is ALREADY in production!

**Verify**:
```bash
# Check if DATABASE_URL in .env points to the same database
cat .env | grep DATABASE_URL
```

If both development and production use the same database, **no additional action needed** - the import we did locally already populated production!

### Option 2: Upload to Cloud Storage (Recommended for future)
Store backup files in Cloudflare R2 or Supabase Storage, then fetch from production.

**Steps**:
1. Upload `scraper-data` folder to R2/Supabase Storage
2. Modify `/api/import-backup` to fetch from cloud URL instead of local filesystem
3. Trigger import from production admin panel

### Option 3: Manual SQL Export/Import
```bash
# Export from local database
pg_dump $DATABASE_URL > backup.sql

# Import to production database
psql $PRODUCTION_DATABASE_URL < backup.sql
```

## Current Status

- ✅ **Localhost**: 37 novels, 3,020 chapters imported
- ❓ **Production (novesia.cc)**: Need to verify if using same database

## Next Steps

1. Check `.env` to confirm if dev/prod share same database
2. If shared: Data already in production!
3. If separate: Use Option 2 or 3

## Important Note

The root cause was **shared development/production database** (anti-pattern). After recovery, **separate databases** should be configured to prevent future incidents.
