# 🚀 Quick Setup Guide - Property Inspector Pro

## ✅ What's Already Done
- ✓ Supabase credentials configured in `.env.local`
- ✓ Authentication system connected
- ✓ Database migration files created
- ✓ Error handling improved

## 📋 What You Need to Do Now

### 1️⃣ Run Database Migrations (5 minutes)

1. **Open Supabase SQL Editor:**
   https://supabase.com/dashboard/project/yhratzeatsvajrpydrok/sql/new

2. **Run First Migration:**
   - Copy ALL contents from: `supabase/migrations/001_create_tables.sql`
   - Paste into SQL Editor
   - Click "Run"
   - You should see "Success. No rows returned"

3. **Run Second Migration:**
   - Clear the SQL Editor (Ctrl+A, Delete)
   - Copy ALL contents from: `supabase/migrations/002_additional_tables.sql`
   - Paste into SQL Editor
   - Click "Run"
   - You should see "Success. No rows returned"

4. **Run Status Fix Migration (IMPORTANT):**
   - Clear the SQL Editor (Ctrl+A, Delete)
   - Copy ALL contents from: `supabase/migrations/003_fix_status_constraint.sql`
   - Paste into SQL Editor
   - Click "Run"
   - You should see "Success. No rows returned"

### 2️⃣ Create Storage Bucket (2 minutes)

1. **Open Storage Settings:**
   https://supabase.com/dashboard/project/yhratzeatsvajrpydrok/storage/buckets

2. **Create New Bucket:**
   - Click "New bucket"
   - Name: `inspection-photos`
   - Public: **OFF** (keep private)
   - Click "Create"

### 3️⃣ Test Everything (2 minutes)

1. **Restart your app** (if needed):
   ```bash
   # Stop the server (Ctrl+C) then:
   npm run dev -- -p 3002
   ```

2. **Open the app:**
   http://localhost:3002

3. **Create a test account:**
   - Go to Sign Up
   - Enter your email and password
   - Check your email for confirmation link
   - Click the link to confirm

4. **Try creating an inspection:**
   - Login with your account
   - Click "New Inspection"
   - Fill in the details
   - Click "Save Inspection"

## ❌ Troubleshooting

### "Database tables not found" Error
→ You haven't run the SQL migrations yet. Go back to step 1.

### "Failed to save inspection" Error
→ Make sure you:
1. Ran BOTH migration files
2. Are logged in
3. Didn't get any errors in SQL Editor

### Can't login
→ Check:
1. Email confirmation (check spam folder)
2. Correct password (minimum 6 characters)

### Photos not uploading
→ Make sure the `inspection-photos` bucket exists in Storage

## ✨ Success Checklist
- [ ] Both SQL migrations run successfully
- [ ] Storage bucket created
- [ ] Can create an account and login
- [ ] Can create and save an inspection report
- [ ] Can view saved inspections in the list

## 🎉 Once Everything Works

Your app is fully connected to the database! You can now:
- Create and save inspection reports
- Upload photos with inspections
- Manage clients
- Create invoices
- All data is securely stored in your Supabase database

## Need Help?

Check the detailed guides:
- `DATABASE_SETUP.md` - Full database setup instructions
- `SETUP_AUTHENTICATION.md` - Authentication troubleshooting

Or check the browser console (F12) for specific error messages.