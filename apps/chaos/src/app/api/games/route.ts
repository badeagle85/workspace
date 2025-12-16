import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

// 게임 기록 저장 (밸런싱 완료 시 호출)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { players } = body as { players: string[] }

    if (!players || players.length === 0) {
      return NextResponse.json({ error: "players required" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // 같은 게임의 참가자들을 묶는 game_id 생성
    const gameId = crypto.randomUUID()

    // 참가자별 기록 생성
    const records = players.map((playerName) => ({
      player_name: playerName.trim(),
      game_id: gameId,
    }))

    const { error } = await supabase.from("chaos_game_history").insert(records)

    if (error) {
      console.error("Error saving game history:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, gameId })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// 참가 횟수 조회 (최근 N일)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "30", 10)

    const supabase = await createServerSupabaseClient()

    // 최근 N일 기준 날짜
    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - days)

    const { data, error } = await supabase
      .from("chaos_game_history")
      .select("player_name")
      .gte("played_at", sinceDate.toISOString())

    if (error) {
      console.error("Error fetching game history:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 플레이어별 참가 횟수 집계
    const counts: Record<string, number> = {}
    for (const record of data || []) {
      const name = record.player_name
      counts[name] = (counts[name] || 0) + 1
    }

    return NextResponse.json(counts)
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
