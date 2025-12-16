import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"
import * as dotenv from "dotenv"

// .env.local 로드
dotenv.config({ path: path.join(__dirname, "../.env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface BannedPlayer {
  name: string
  reason: string
}

type PlayerData = {
  [key: string]: string[] | BannedPlayer[]
}

// 티어 매핑 (JSON 키 -> DB chaos_tier_level enum)
const tierMapping: Record<string, string> = {
  "1": "1",
  "2": "2",
  "2.5": "2.5",
  "3": "3",
  "3.5": "3.5",
  "4": "4",
  "5": "5",
  "6": "6",
  "new": "7", // new는 7티어로 매핑
}

async function migrate() {
  console.log("Starting migration...")

  // JSON 파일 읽기
  const jsonPath = path.join(__dirname, "../src/data/players.json")
  const rawData = fs.readFileSync(jsonPath, "utf-8")
  const playerData: PlayerData = JSON.parse(rawData)

  const playersToInsert: {
    name: string
    tier: string
    status: string
    ban_reason?: string
  }[] = []

  // 일반 티어 플레이어 처리
  for (const [tier, players] of Object.entries(playerData)) {
    if (tier === "banned") {
      // banned 플레이어
      const bannedPlayers = players as BannedPlayer[]
      for (const player of bannedPlayers) {
        playersToInsert.push({
          name: player.name,
          tier: "7", // banned는 티어 7로 설정
          status: "banned",
          ban_reason: player.reason || undefined,
        })
      }
    } else if (tier === "new") {
      // new 플레이어
      const newPlayers = players as string[]
      for (const name of newPlayers) {
        playersToInsert.push({
          name,
          tier: "7",
          status: "new",
        })
      }
    } else {
      // 일반 티어 플레이어
      const tierPlayers = players as string[]
      const dbTier = tierMapping[tier]
      if (!dbTier) {
        console.warn(`Unknown tier: ${tier}, skipping...`)
        continue
      }
      for (const name of tierPlayers) {
        playersToInsert.push({
          name,
          tier: dbTier,
          status: "active",
        })
      }
    }
  }

  console.log(`Total players to insert: ${playersToInsert.length}`)

  // 기존 데이터 삭제 (선택적)
  const { error: deleteError } = await supabase
    .from("chaos_players")
    .delete()
    .neq("id", 0) // 모든 레코드 삭제

  if (deleteError) {
    console.error("Error deleting existing data:", deleteError)
  } else {
    console.log("Existing data cleared")
  }

  // 배치로 삽입 (50개씩)
  const batchSize = 50
  let insertedCount = 0

  for (let i = 0; i < playersToInsert.length; i += batchSize) {
    const batch = playersToInsert.slice(i, i + batchSize)
    const { error } = await supabase.from("chaos_players").insert(batch)

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error)
    } else {
      insertedCount += batch.length
      console.log(`Inserted ${insertedCount}/${playersToInsert.length} players`)
    }
  }

  console.log("Migration completed!")
}

migrate().catch(console.error)
