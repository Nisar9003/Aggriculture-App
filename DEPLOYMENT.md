# Deployment Guide - ہارے کھیت Smart Agriculture App

## Overview

This is a production-ready React Native + Expo app with PWA support. It's built to run as:
- 📱 Progressive Web App (PWA)
- 🔗 Web application
- 📲 Android APK (via PWABuilder)
- 🍎 iOS app (via Expo)

## Build Status

✅ **Build Successful** - The app has been compiled and is ready for deployment.

### Build Output
- Size: ~3.5 MB (production optimized)
- Format: Server-based Expo export
- Static routes: 9 main app routes
- PWA-enabled with service worker

## Quick Deployment (Recommended)

### Option 1: Vercel (Easiest)

1. **Push to GitHub**:
```bash
git add .
git commit -m "Smart agriculture app ready for deployment"
git push origin main
```

2. **Deploy to Vercel**:
   - Go to [Vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select "Expo" as framework
   - Deploy

3. **Environment Variables**:
   - Set in Vercel dashboard:
     - `EXPO_PUBLIC_SUPABASE_URL`
     - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
     - `EXPO_PUBLIC_OPENWEATHER_API_KEY`
     - `EXPO_PUBLIC_OPENAI_API_KEY`

### Option 2: Netlify

1. **Deploy via CLI**:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

2. **Or connect GitHub**:
   - Go to [Netlify.com](https://netlify.com)
   - New site from Git → Connect GitHub
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Set environment variables** in Netlify dashboard

### Option 3: Docker (Self-hosted)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000
CMD ["npm", "run", "serve"]
```

Build and run:
```bash
docker build -t haray-khet .
docker run -p 3000:3000 \
  -e EXPO_PUBLIC_SUPABASE_URL=... \
  -e EXPO_PUBLIC_OPENWEATHER_API_KEY=... \
  -e EXPO_PUBLIC_OPENAI_API_KEY=... \
  haray-khet
```

## PWA Installation

After deployment to web:

### On Mobile (Android/iOS):
1. Visit your deployed URL
2. Tap menu (three dots)
3. Select "Install app" or "Add to home screen"
4. App installs like native app

### On Desktop:
1. Visit deployed URL
2. URL bar shows install icon
3. Click to install as desktop app
4. Appears in applications menu

## Android APK Generation

### Using PWABuilder (Recommended):

1. **Build and deploy web version** (see above)

2. **Go to [PWABuilder](https://www.pwabuilder.com/)**

3. **Enter your app URL** (e.g., https://yourapp.vercel.app)

4. **Generate Android APK**:
   - Select "Google Play" option
   - Configure signing credentials
   - Download APK

5. **Test locally**:
   ```bash
   adb install app-name.apk
   ```

6. **Publish to Google Play Store**:
   - Create Google Play Developer account ($25 one-time)
   - Upload APK
   - Fill store listing details
   - Submit for review

### Using Android Studio (TWA):

1. **Install Android Studio**

2. **Create TWA project**:
   - File → New → New Project
   - Select "Trusted Web Activity"
   - Enter your app URL

3. **Build and sign APK**:
   - Build → Generate Signed APK
   - Use your keystore

4. **Upload to Play Store**

## Production Checklist

### Before Deploying:

- [ ] All environment variables configured
- [ ] Database RLS policies verified
- [ ] API keys have appropriate rate limits
- [ ] Supabase database backups enabled
- [ ] Monitoring/error logging set up
- [ ] HTTPS enforced
- [ ] Service worker tested offline
- [ ] PWA manifest verified
- [ ] Mobile responsiveness tested
- [ ] Performance optimized (< 3MB)

### Security Checklist:

- [ ] Environment variables NOT in code
- [ ] API keys rotated
- [ ] Database passwords strong
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all forms
- [ ] XSS protection enabled
- [ ] SQLi protection (Supabase handles)

### Monitoring Setup:

1. **Supabase Dashboard**:
   - Monitor database usage
   - Check auth logs
   - Review RLS policies

2. **Error Tracking** (Optional):
   - Add Sentry: `npm install @sentry/react`
   - Configure in root layout

3. **Analytics** (Optional):
   - Add Plausible/Vercel Analytics
   - Track user engagement

## Performance Optimization

The app is already optimized, but you can further improve:

### Image Optimization:
- Use WebP format for images
- Serve via CDN
- Implement lazy loading

### Code Splitting:
Already implemented via Expo Router

### Caching Strategy:
- Service worker caches static assets
- Browser caches for 1 year: `*.js`, `*.css`
- API responses cached by Supabase

### Database Optimization:
- Indexes already created on foreign keys
- RLS policies optimized
- Connection pooling via Supabase

## Updating the App

### Deploy Updates:

1. **Make changes** to code

2. **Build**: `npm run build`

3. **Deploy**:
   - Vercel: Auto-deploys on git push
   - Netlify: Same, auto-deploy
   - Manual: Use CLI tools

4. **Service Worker Update**:
   - Auto-updates on next visit
   - Refreshes cache

### User Experience:
- Users see "Update available" prompt
- Can manually refresh
- New version loads immediately

## Rollback Strategy

If something breaks:

### Vercel:
- Deployments tab → Select previous deployment → Revert

### Netlify:
- Deploys tab → Select previous build → Publish

### Manual Rollback:
```bash
git revert <commit-hash>
npm run build
# Deploy again
```

## Database Backup

### Supabase Automatic Backups:
- Enabled by default
- Daily backups (7-day retention)
- Set via dashboard → Database → Backups

### Manual Backup:
```bash
# Export database (via Supabase CLI)
supabase db pull
```

## Support & Troubleshooting

### White Screen on Load:
- Check browser console for errors
- Verify API keys in `.env`
- Check network tab for failed requests

### PWA Not Installing:
- Ensure HTTPS
- Check manifest.json is valid
- Service worker must be available
- HTTPS required for standalone mode

### Database Connection Issues:
- Verify Supabase credentials
- Check RLS policies
- Check user authentication status
- Verify table exists

### Weather API Not Working:
- Check API key validity
- Verify rate limits not exceeded
- Check geolocation permissions

### AI Advisor Not Responding:
- Fallback system will provide basic answers
- Check OpenAI API key
- Verify account has credits
- Check rate limits

## Performance Metrics

Target metrics:
- First Contentful Paint: < 2s
- Largest Contentful Paint: < 3s
- Cumulative Layout Shift: < 0.1
- Time to Interactive: < 3.5s

Current optimizations:
- Server-side rendering
- Code splitting per route
- Image optimization
- CSS/JS minification
- Cache-first strategy

## Cost Estimates

### Monthly Costs:
- **Vercel**: ~$0-20 (Pro: $20)
- **Netlify**: ~$0-20 (Pro: $20)
- **Supabase**: ~$5-25 (depends on usage)
- **OpenWeather**: ~$0-10 (free tier: 1000 calls/day)
- **OpenAI**: ~$5-20 (depends on API usage)

**Total**: $10-75/month (can be less with free tiers)

## Contact & Support

For deployment issues:
1. Check error logs in provider dashboard
2. Review Supabase database logs
3. Check browser console
4. Review this guide thoroughly

---

**App is ready for production deployment! 🚀**
