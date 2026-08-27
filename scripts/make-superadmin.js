const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("❌ Missing Supabase URL or Service Role Key in .env.local.");
  console.error("This script requires the service role key to securely bypass RLS and assign superadmin privileges.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function makeSuperadmin() {
  const email = process.argv[2];

  if (!email) {
    console.error("❌ Please provide an email address.");
    console.error("Usage: node scripts/make-superadmin.js <email>");
    process.exit(1);
  }

  console.log(`🔍 Looking up user with email: ${email}...`);

  // We have to list users and filter since there's no direct get-by-email in the admin API
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

  if (listError) {
    console.error("❌ Failed to fetch users:", listError.message);
    process.exit(1);
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    console.error(`❌ No user found with email: ${email}`);
    console.error("Make sure they have signed up or applied first.");
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.id}. Updating app_metadata...`);

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      role: 'superadmin'
    }
  });

  if (updateError) {
    console.error("❌ Failed to update user:", updateError.message);
    process.exit(1);
  }

  console.log(`🎉 Success! ${email} is now a superadmin.`);
  console.log(`You can now sign in at /superadmin with this account.`);
}

makeSuperadmin();
