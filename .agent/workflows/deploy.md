---
description: Deploy changes directly to production for Novesia project
---

# Novesia Deployment Workflow

// turbo-all

## IMPORTANT: Direct to Production

**DO NOT use preview branches!** User preference is to deploy directly to production.

## Steps

1. Make code changes

2. Stage all changes:
```bash
git add .
```

3. Commit with descriptive message:
```bash
git commit -m "feat/fix/docs: your message here"
```

4. Push directly to main (production):
```bash
git push
```

5. Vercel auto-deploys to https://novesia.cc (2-3 min)

## Key Points

- **Branch**: Always work on `main` branch
- **No preview branches**: Skip `test` or feature branches
- **Direct deployment**: Push = Live on novesia.cc
- **Database**: Dev and Prod share SAME Supabase database
- **Localhost optional**: User prefers to skip localhost testing

## Quick Command

```bash
git add . && git commit -m "message" && git push
```
