# ہارے کھیت - Smart Agriculture Management System

A production-ready agricultural management system built for Pakistani farmers using React Native, Expo, and Supabase.

## Features

- 🌾 **Farm Dashboard** - Visual crop distribution and farm statistics
- 🌱 **Crop Management** - Track wheat, rice, maize, mustard, and sesame
- 💰 **Expense Tracker** - Monitor all farming costs and calculate profits
- 🤖 **AI Farm Advisor** - Get farming advice powered by OpenAI (with fallback rules)
- 🌤️ **Real Weather Integration** - Live weather data from OpenWeatherMap
- ✅ **Task Management** - Track farming tasks and reminders
- 📱 **PWA Support** - Installable as a native app
- 🔐 **Secure Authentication** - Email/password auth with Supabase

## Prerequisites

- Node.js 18+ and npm
- Supabase account (database already configured)
- OpenAI API key (for farm advisor)
- OpenWeather API key (for weather)

## Environment Setup

1. **Add API Keys** to `.env`:

```bash
EXPO_PUBLIC_OPENWEATHER_API_KEY=your_key_here
EXPO_PUBLIC_OPENAI_API_KEY=your_key_here
```

Get your keys from:
- OpenWeather: https://openweathermap.org/api
- OpenAI: https://platform.openai.com/api-keys

2. **Install Dependencies**:

```bash
npm install
```

## Development

Run the development server:

```bash
npm run dev
```

The app will start on `http://localhost:8081`

## Building for Production

### Web Build (PWA):

```bash
npm run build
```

This creates a web build with PWA support in the `dist` folder.

### Android APK (Using PWABuilder):

1. Build the web version:
   ```bash
   npm run build
   ```

2. Go to [PWABuilder](https://www.pwabuilder.com/)

3. Enter your app URL (after deployment to Vercel/Netlify)

4. Generate Android APK

5. Download and test on Android devices

### Alternative: Android Studio with Trusted Web Activity (TWA)

1. Build web version
2. Deploy to web server (Vercel/Netlify)
3. Use Android Studio to create TWA wrapper

## Deployment

### Deploy to Vercel:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Deploy to Netlify:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

## Database Schema

All tables are automatically created with proper RLS (Row Level Security):

- `farms` - Farm information (6 acres total)
- `crops` - Crop records with growth tracking
- `expenses` - Cost tracking by type
- `tasks` - Farming tasks and reminders
- `field_images` - Photo monitoring
- `weather_alerts` - Auto-generated alerts

## Using the App

### First Time Users:

1. **Sign Up** - Create account with email/password
2. **Add Crops** - Add your crops (wheat, rice, maize, mustard, sesame)
3. **Track Expenses** - Log all farming costs
4. **Get Advice** - Ask questions to the AI advisor
5. **Manage Tasks** - Create tasks for irrigation, fertilizer, harvesting

### For Pakistani Farmers:

- Urdu interface available
- Support for Roman Urdu and Urdu script
- Prices in Pakistani Rupees (PKR)
- Weather data for Pakistan regions

## API Integration Notes

### OpenAI (Farm Advisor):

- Fallback system provides offline advice
- Questions can be in Urdu or English
- Responses in both Urdu script and Roman Urdu

### OpenWeatherMap:

- Automatic location detection (defaults to Pakistan)
- Weather alerts for rain, heat waves, frost, wind
- 5-day forecast support

## Offline Support

The PWA includes:
- Service worker for offline access
- Cached app shell
- Local storage for data sync
- Works like native app when installed

## Security

- All data encrypted in transit (HTTPS)
- Row Level Security (RLS) on database
- User data isolated by authentication
- No passwords stored in local storage
- Secure API key handling via environment variables

## File Structure

```
app/
├── _layout.tsx              # Root layout with auth
├── (tabs)/                  # Tab navigation
│   ├── index.tsx           # Dashboard
│   ├── crops.tsx           # Crop management
│   ├── expenses.tsx        # Expense tracker
│   ├── advisor.tsx         # AI advisor
│   └── tasks.tsx           # Task management
└── auth/                   # Authentication
    ├── login.tsx
    └── signup.tsx

components/
├── DashboardHeader.tsx
├── StatCard.tsx
├── CropDistributionChart.tsx
└── AuthContext.tsx

utils/
├── supabase.ts
├── farmCalculations.ts
├── weatherService.ts
└── farmAdvisor.ts
```

## Troubleshooting

### App won't start?
- Clear cache: `npm cache clean --force`
- Delete node_modules: `rm -rf node_modules && npm install`

### Database not syncing?
- Check Supabase credentials in `.env`
- Verify user is authenticated
- Check RLS policies in Supabase dashboard

### Weather not working?
- Verify OpenWeather API key is correct
- Check API call limits
- Fallback to cached weather will work offline

### AI Advisor offline?
- Rules-based system will provide basic answers
- Works completely offline
- OpenAI used when available

## Support

For issues or questions:
1. Check Supabase dashboard for data
2. Review browser console for errors
3. Test API keys independently
4. Verify environment variables are loaded

## License

Production-ready for commercial use.

## Notes for Deployment

- Ensure all environment variables are set in production
- Use strong database passwords
- Enable HTTPS for all endpoints
- Monitor Supabase usage limits
- Set up monitoring/alerts for errors
- Consider CDN for static assets
- Implement rate limiting on API calls
