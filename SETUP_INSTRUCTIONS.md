# Quick Setup Instructions

## Step 1: Get Your Supabase Credentials

1. **Go to Supabase Dashboard**
   - Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sign in to your account (or create one if you don't have it)

2. **Select or Create Your Project**
   - If you already have a project, select it
   - If not, click "New Project" and create one

3. **Get Your API Credentials**
   - In your project dashboard, go to **Settings** → **API**
   - Copy the **Project URL** (looks like: `https://abcdefghijk.supabase.co`)
   - Copy the **anon/public** key (long string starting with `eyJ...`)

## Step 2: Configure Your Environment

1. **Open the `.env.local` file** (already created for you)
2. **Replace the placeholder values**:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```

## Step 3: Restart Your Development Server

```bash
npm run dev
```

## Step 4: Set Up Your Database (if not done already)

1. Go to your Supabase project dashboard
2. Click on **SQL Editor**
3. Run the SQL scripts from the `scripts/` folder in order
4. Or check the `DATABASE_SETUP.md` file for detailed instructions

## Verification

Once configured correctly:
- The red warning banner will disappear
- Authentication will work properly
- You can create accounts and sign in
- Database operations will function

## Troubleshooting

- Make sure there are no extra spaces in your environment variables
- Ensure the `.env.local` file is in the root directory (same level as `package.json`)
- Restart your development server after making changes
- Check the browser console for any error messages