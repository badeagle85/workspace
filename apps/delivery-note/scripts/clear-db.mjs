import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// .env.local 파일 수동 파싱
function loadEnv() {
  try {
    const envFile = readFileSync(".env", "utf8");
    const envVars = {};
    for (const line of envFile.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key) {
          envVars[key.trim()] = valueParts.join("=").trim();
        }
      }
    }
    return envVars;
  } catch {
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL 또는 Key가 없습니다.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearDatabase() {
  console.log("데이터베이스 초기화 시작...\n");

  // 외래 키 제약 조건을 고려한 삭제 순서
  const tables = [
    "product_mappings",
    "ocr_scans",
    "suppliers",
    "standard_products",
    "delivery_note_api_usage",
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) {
        console.error(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: 삭제 완료`);
      }
    } catch (err) {
      console.error(`❌ ${table}: ${err.message}`);
    }
  }

  console.log("\n데이터베이스 초기화 완료!");
}

clearDatabase();
