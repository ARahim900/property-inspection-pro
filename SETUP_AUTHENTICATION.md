# Authentication Setup Guide

This application uses Supabase for authentication. Follow these steps to set up authentication properly.

## Quick Setup

1. **Create a Supabase Account**
   - Go to [https://supabase.com](https://supabase.com) and sign up for a free account

2. **Create a New Project**
   - Click "New Project" in your Supabase dashboard
   - Choose a name, database password, and region
   - Wait for the project to be created (this may take a few minutes)

3. **Get Your API Credentials**
   - Go to Settings → API in your Supabase dashboard
   - Copy your:
     - **Project URL**: Found under "Project URL"
     - **Anon Key**: Found under "Project API keys" → "anon public"

4. **Configure Your Local Environment**
   - Copy `.env.local.example` to `.env.local`:
     ```bash
     cp .env.local.example .env.local
     ```
   - Open `.env.local` and add your credentials:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
     ```

5. **Set Up Authentication in Supabase**
   - Go to Authentication → Providers in your Supabase dashboard
   - Enable "Email" provider (should be enabled by default)
   - Configure email templates if needed (optional)

6. **Restart Your Development Server**
   ```bash
   npm run dev
   ```

## Troubleshooting

### "Failed to fetch" Error
This error typically means:
- Supabase credentials are not configured (check `.env.local`)
- The credentials are incorrect
- Network connectivity issues

### "Authentication service is not configured"
This message appears when:
- `.env.local` file is missing
- Environment variables are not set correctly
- The development server needs to be restarted after adding `.env.local`

### Email Confirmation
By default, Supabase requires email confirmation for new accounts:
- Check the email inbox for confirmation links
- You can disable this in Supabase Dashboard → Authentication → Providers → Email → Confirm email (not recommended for production)

## Testing Authentication

1. **Sign Up**: Create a new account at `/auth/sign-up`
2. **Confirm Email**: Check your email and click the confirmation link
3. **Login**: Sign in at `/auth/login`

## Production Deployment

For production deployment:
1. Set environment variables in your hosting platform (Vercel, Netlify, etc.)
2. Add your production domain to Supabase → Authentication → URL Configuration
3. Update redirect URLs in your authentication settings