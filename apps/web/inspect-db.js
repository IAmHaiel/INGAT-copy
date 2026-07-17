/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  try {
    const envLocalPath = path.join(__dirname, '../../.env.local');
    const content = fs.readFileSync(envLocalPath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1].trim();
      }
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
        supabaseAnonKey = line.split('=')[1].trim();
      }
    }
  } catch (e) {
    console.error('Failed to parse .env.local file:', e);
  }
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  const columns = ['bucket_id', 'goal_label', 'note', 'label'];
  for (const col of columns) {
    const { data, error } = await supabase.from('transactions').select(col).limit(1);
    if (error) {
      console.log(`Column '${col}' does NOT exist. Error:`, error.message);
    } else {
      console.log(`Column '${col}' EXISTS.`);
    }
  }
}

inspect();
