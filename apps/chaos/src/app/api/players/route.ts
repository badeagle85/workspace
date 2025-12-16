import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import type { TierKey } from "@/shared/types"

export interface PlayerFromDB {
  id: string
  name: string
  tier: string
  status: string
  ban_reason: string | null
  created_at: string
  updated_at: string
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from("chaos_players")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching players:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // DB 티어를 앱 티어로 변환
    const players = (data as PlayerFromDB[]).map((player) => {
      let tier: TierKey
      if (player.status === "banned") {
        tier = "banned"
      } else if (player.status === "new") {
        tier = "new"
      } else {
        // DB에는 1, 2, 2.5, 3, 3.5, 4, 5, 6, 7로 저장됨
        tier = player.tier as TierKey
      }
      return {
        name: player.name,
        tier,
        status: player.status,
        ban_reason: player.ban_reason,
        updated_at: player.updated_at,
      }
    })

    return NextResponse.json(players)
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
