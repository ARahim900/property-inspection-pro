# Deployment Guide for Property Inspection Pro

## Netlify Deployment

This application is ready to be deployed on Netlify.

### Prerequisites
- A GitHub account
- A Netlify account (sign up at netlify.com)
- This repository pushed to your GitHub account

### Deployment Steps

1. **Push to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

2. **Deploy on Netlify**
   - Log in to [Netlify](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect to your GitHub account
   - Select your repository
   - Netlify will automatically detect the build settings from `netlify.toml`
   - Click "Deploy site"

3. **Configure Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add the following variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```
   - Redeploy the site after adding environment variables

### Build Settings (Already Configured)
- **Build Command**: `npm run build`
- **Publish Directory**: `.next`
- **Node Version**: 18

### Features Configured
- ✅ Security headers (CSP, XSS protection, etc.)
- ✅ Static asset caching
- ✅ Next.js plugin for optimal performance
- ✅ Supabase integration support
- ✅ TypeScript support
- ✅ Production optimizations

### Post-Deployment Checklist
- [ ] Verify environment variables are set correctly
- [ ] Test authentication flow
- [ ] Test inspection creation and PDF generation
- [ ] Check all pages load correctly
- [ ] Test responsive design on mobile devices

### Custom Domain (Optional)
1. Go to Domain Settings in Netlify
2. Add your custom domain
3. Follow DNS configuration instructions
4. Enable HTTPS (automatic with Netlify)

### Monitoring
- Check build logs in Netlify dashboard
- Monitor function logs if using serverless functions
- Use Netlify Analytics for traffic insights

## Troubleshooting

### Build Failures
- Check build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Verify Node version matches (18.x)

### Environment Variables
- Double-check variable names match exactly
- Ensure no trailing spaces in values
- Redeploy after changing variables

### 404 Errors
- The `netlify.toml` is configured for SPA routing
- Clear browser cache if issues persist

## Support
For deployment issues, check:
- [Netlify Documentation](https://docs.netlify.com)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)