import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"
import * as dotenv from "dotenv"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// .env.local 로드
dotenv.config({ path: path.join(__dirname, "../.env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// CSV 컬럼 인덱스 -> 티어 매핑
const tierMapping: Record<number, string> = {
  0: "1",
  1: "2",
  2: "2.5",
  3: "3",
  4: "3.5",
  5: "4",
  6: "5",
  7: "6",
  8: "banned",
  9: "new",
}

// 접두사 제거 패턴
const prefixPattern = /^(1_|2_|25_|3_|35_|4_|55_|6_)/

// banned 플레이어의 사유 추출
function extractBanReason(name: string): { name: string; reason: string | null } {
  // 괄호 안의 사유 추출: "이름(사유)" 형태
  const match = name.match(/^(.+?)[\(（](.+?)[\)）]$/)
  if (match) {
    return { name: match[1].trim(), reason: match[2].trim() }
  }
  return { name: name.trim(), reason: null }
}

async function migrate() {
  console.log("Starting CSV migration...")

  // CSV 파일 읽기
  const csvPath = "/Users/hue/Downloads/워크래프트3 카오스 티어표 - 티어표.csv"
  const csvData = fs.readFileSync(csvPath, "utf-8")
  const lines = csvData.split("\n")

  // 헤더 3줄 스킵 (리포지드화이팅, 등록아이디 개수, 컬럼 헤더)
  const dataLines = lines.slice(3)

  const playersToInsert: {
    name: string
    tier: string
    status: string
    ban_reason?: string | null
  }[] = []

  const seenNames = new Set<string>() // 중복 방지

  for (const line of dataLines) {
    if (!line.trim()) continue

    const cols = line.split(",")

    for (let colIdx = 0; colIdx <= 9; colIdx++) {
      const rawValue = cols[colIdx]?.trim()
      if (!rawValue) continue

      const tier = tierMapping[colIdx]
      if (!tier) continue

      // 접두사 제거
      let cleanName = rawValue.replace(prefixPattern, "")

      // banned 플레이어 처리
      if (tier === "banned") {
        const { name, reason } = extractBanReason(cleanName)
        cleanName = name

        // 중복 체크
        const lowerName = cleanName.toLowerCase()
        if (seenNames.has(lowerName)) {
          console.log(`Duplicate skipped: ${cleanName}`)
          continue
        }
        seenNames.add(lowerName)

        playersToInsert.push({
          name: cleanName,
          tier: "7", // DB enum은 숫자만 허용, banned는 7티어로 저장
          status: "banned",
          ban_reason: reason,
        })
      } else if (tier === "new") {
        // 중복 체크
        const lowerName = cleanName.toLowerCase()
        if (seenNames.has(lowerName)) {
          console.log(`Duplicate skipped: ${cleanName}`)
          continue
        }
        seenNames.add(lowerName)

        playersToInsert.push({
          name: cleanName,
          tier: "7", // DB enum은 숫자만 허용, new는 7티어로 저장
          status: "new",
        })
      } else {
        // 일반 티어
        const lowerName = cleanName.toLowerCase()
        if (seenNames.has(lowerName)) {
          console.log(`Duplicate skipped: ${cleanName}`)
          continue
        }
        seenNames.add(lowerName)

        playersToInsert.push({
          name: cleanName,
          tier: tier,
          status: "active",
        })
      }
    }
  }

  console.log(`Total players to insert: ${playersToInsert.length}`)

  // 티어별 집계 출력
  const tierCount: Record<string, number> = {}
  playersToInsert.forEach((p) => {
    tierCount[p.tier] = (tierCount[p.tier] || 0) + 1
  })
  console.log("티어별 분포:", tierCount)

  // 기존 데이터 삭제
  console.log("Deleting existing data...")
  const { error: deleteError } = await supabase
    .from("chaos_players")
    .delete()
    .gte("created_at", "1900-01-01") // 모든 레코드 삭제

  if (deleteError) {
    console.error("Error deleting existing data:", deleteError)
    return
  }
  console.log("Existing data cleared")

  // 배치로 삽입 (50개씩)
  const batchSize = 50
  let insertedCount = 0
  let errorCount = 0

  for (let i = 0; i < playersToInsert.length; i += batchSize) {
    const batch = playersToInsert.slice(i, i + batchSize)
    const { error } = await supabase.from("chaos_players").insert(batch)

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error)
      errorCount += batch.length
    } else {
      insertedCount += batch.length
      console.log(`Inserted ${insertedCount}/${playersToInsert.length} players`)
    }
  }

  console.log(`\nMigration completed!`)
  console.log(`Successfully inserted: ${insertedCount}`)
  console.log(`Errors: ${errorCount}`)
}

migrate().catch(console.error)
