import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// .env 파일 수동 로드
const envContent = readFileSync('.env', 'utf-8');
const envVars: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const [key, ...valueParts] = trimmed.split('=');
  envVars[key] = valueParts.join('=');
}

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAllData() {
  console.log('데이터베이스 전체 삭제 시작...\n');

  // 1. ocr_scans 삭제 (supplier_id, store_id 참조)
  const r1 = await supabase
    .from('ocr_scans')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('ocr_scans:', r1.error ? '오류 - ' + r1.error.message : '삭제 완료');

  // 2. product_mappings 삭제 (supplier_id, standard_product_id 참조)
  const r2 = await supabase
    .from('product_mappings')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('product_mappings:', r2.error ? '오류 - ' + r2.error.message : '삭제 완료');

  // 3. standard_products 삭제
  const r3 = await supabase
    .from('standard_products')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('standard_products:', r3.error ? '오류 - ' + r3.error.message : '삭제 완료');

  // 4. suppliers 삭제
  const r4 = await supabase
    .from('suppliers')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('suppliers:', r4.error ? '오류 - ' + r4.error.message : '삭제 완료');

  // 5. stores 삭제
  const r5 = await supabase
    .from('stores')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('stores:', r5.error ? '오류 - ' + r5.error.message : '삭제 완료');

  console.log('\n전체 삭제 완료!');
}

clearAllData().catch(console.error);
