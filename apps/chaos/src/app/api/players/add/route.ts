import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import type { TierKey } from "@/shared/types"

export async function POST(request: NextRequest) {
  try {
    const { name, tier } = (await request.json()) as { name: string; tier: TierKey }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // 티어에 따라 status와 tier 값 결정
    let dbTier: string
    let status: string

    if (tier === "banned") {
      dbTier = "7"
      status = "banned"
    } else if (tier === "new") {
      dbTier = "7"
      status = "new"
    } else {
      dbTier = tier
      status = "active"
    }

    const { data, error } = await supabase
      .from("chaos_players")
      .insert({ name: name.trim(), tier: dbTier, status })
      .select()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "이미 존재하는 플레이어입니다." }, { status: 400 })
      }
      console.error("Error adding player:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, player: data[0] })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
