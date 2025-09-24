const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // You'll need to add this to .env.local

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local')
  process.exit(1)
}

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local')
  console.log('')
  console.log('To get your service role key:')
  console.log('1. Go to your Supabase project dashboard')
  console.log('2. Navigate to Settings → API')
  console.log('3. Copy the "service_role" key (keep this secret!)')
  console.log('4. Add it to .env.local as:')
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  console.log('🚀 Setting up database tables...')

  try {
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_create_tables.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('📝 Executing SQL migration...')
    console.log('Note: You need to run this SQL in your Supabase SQL Editor')
    console.log('Go to: https://supabase.com/dashboard/project/yhratzeatsvajrpydrok/sql/new')
    console.log('')
    console.log('The SQL file has been created at:')
    console.log(sqlPath)
    console.log('')
    console.log('Copy and paste the contents of that file into the SQL editor and run it.')

    // Create storage bucket for inspection photos
    console.log('')
    console.log('📦 Setting up storage bucket for inspection photos...')

    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets()

    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError)
    } else {
      const existingBucket = buckets.find(b => b.name === 'inspection-photos')

      if (!existingBucket) {
        const { data, error } = await supabase
          .storage
          .createBucket('inspection-photos', {
            public: false,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
          })

        if (error) {
          console.error('Error creating bucket:', error)
        } else {
          console.log('✅ Storage bucket "inspection-photos" created successfully!')
        }
      } else {
        console.log('✅ Storage bucket "inspection-photos" already exists')
      }
    }

    console.log('')
    console.log('🎉 Setup process complete!')
    console.log('')
    console.log('Next steps:')
    console.log('1. Run the SQL migration in your Supabase SQL Editor')
    console.log('2. Restart your development server')
    console.log('3. Test creating an inspection report')

  } catch (error) {
    console.error('❌ Error during setup:', error)
    process.exit(1)
  }
}

setupDatabase()