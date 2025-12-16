"use client"

import { createContext, useContext, useCallback, type ReactNode } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { TierKey } from "@/shared/types"
import { tierScores } from "@/shared/config"

export interface PlayerData {
  name: string
  tier: TierKey
  status: string
  ban_reason: string | null
  updated_at: string
}

export interface BanInfo {
  reason: string | null
  date: string | null
}

interface PlayerContextValue {
  players: PlayerData[]
  isLoading: boolean
  error: string | null
  refetch: () => void
  updatePlayerTier: (playerName: string, newTier: TierKey, banReason?: string) => Promise<boolean>
  addPlayer: (name: string, tier: TierKey) => Promise<{ success: boolean; error?: string }>
  // 헬퍼 함수들
  getPlayerTier: (name: string) => TierKey | null
  getPlayerScore: (name: string) => number
  isBannedPlayer: (name: string) => boolean
  getPlayerBanReason: (name: string) => string | null
  getBanInfo: (name: string) => BanInfo | null
  getPlayerList: (tier: TierKey) => string[]
  allPlayers: { name: string; tier: TierKey }[]
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

// API 함수들
async function fetchPlayers(): Promise<PlayerData[]> {
  const res = await fetch("/api/players")
  if (!res.ok) {
    throw new Error("Failed to fetch players")
  }
  return res.json()
}

async function updatePlayerTierApi(playerName: string, newTier: TierKey, banReason?: string) {
  const res = await fetch(`/api/players/${encodeURIComponent(playerName)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier: newTier, ban_reason: banReason }),
  })
  if (!res.ok) {
    throw new Error("Failed to update player tier")
  }
  return res.json()
}

async function addPlayerApi(name: string, tier: TierKey) {
  const res = await fetch("/api/players/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, tier }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || "추가 실패")
  }
  return data
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  // 플레이어 목록 조회
  const {
    data: players = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["players"],
    queryFn: fetchPlayers,
  })

  // 티어 업데이트 mutation
  const updateMutation = useMutation({
    mutationFn: ({
      playerName,
      newTier,
      banReason,
    }: {
      playerName: string
      newTier: TierKey
      banReason?: string
    }) => updatePlayerTierApi(playerName, newTier, banReason),
    onSuccess: (_, { playerName, newTier, banReason }) => {
      // 캐시 직접 업데이트 (낙관적 업데이트)
      queryClient.setQueryData<PlayerData[]>(["players"], (old) =>
        old?.map((p) =>
          p.name === playerName
            ? {
                ...p,
                tier: newTier,
                status: newTier === "banned" ? "banned" : newTier === "new" ? "new" : "active",
                ban_reason: newTier === "banned" ? banReason || null : null,
              }
            : p
        )
      )
    },
  })

  // 플레이어 추가 mutation
  const addMutation = useMutation({
    mutationFn: ({ name, tier }: { name: string; tier: TierKey }) => addPlayerApi(name, tier),
    onSuccess: (_, { name, tier }) => {
      // 캐시에 새 플레이어 추가
      queryClient.setQueryData<PlayerData[]>(["players"], (old) => [
        ...(old || []),
        {
          name,
          tier,
          status: tier === "banned" ? "banned" : tier === "new" ? "new" : "active",
          ban_reason: null,
          updated_at: new Date().toISOString(),
        },
      ])
    },
  })

  const updatePlayerTier = useCallback(
    async (playerName: string, newTier: TierKey, banReason?: string): Promise<boolean> => {
      try {
        await updateMutation.mutateAsync({ playerName, newTier, banReason })
        return true
      } catch {
        return false
      }
    },
    [updateMutation]
  )

  const addPlayer = useCallback(
    async (name: string, tier: TierKey): Promise<{ success: boolean; error?: string }> => {
      try {
        await addMutation.mutateAsync({ name, tier })
        return { success: true }
      } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : "서버 오류" }
      }
    },
    [addMutation]
  )

  // 헬퍼 함수들
  const getPlayerTier = useCallback(
    (name: string): TierKey | null => {
      const player = players.find((p) => p.name.toLowerCase() === name.toLowerCase())
      return player?.tier ?? null
    },
    [players]
  )

  const getPlayerScore = useCallback(
    (name: string): number => {
      const tier = getPlayerTier(name)
      return tier ? tierScores[tier] : 5
    },
    [getPlayerTier]
  )

  const isBannedPlayer = useCallback(
    (name: string): boolean => {
      const player = players.find((p) => p.name.toLowerCase() === name.toLowerCase())
      return player?.status === "banned"
    },
    [players]
  )

  const getPlayerBanReason = useCallback(
    (name: string): string | null => {
      const player = players.find((p) => p.name.toLowerCase() === name.toLowerCase())
      return player?.ban_reason ?? null
    },
    [players]
  )

  const getBanInfo = useCallback(
    (name: string): BanInfo | null => {
      const player = players.find((p) => p.name.toLowerCase() === name.toLowerCase())
      if (!player || player.status !== "banned") return null
      return {
        reason: player.ban_reason,
        date: player.updated_at,
      }
    },
    [players]
  )

  const getPlayerList = useCallback(
    (tier: TierKey): string[] => {
      return players.filter((p) => p.tier === tier).map((p) => p.name)
    },
    [players]
  )

  const allPlayers = players.map((p) => ({ name: p.name, tier: p.tier }))

  return (
    <PlayerContext.Provider
      value={{
        players,
        isLoading,
        error: error ? (error as Error).message : null,
        refetch,
        updatePlayerTier,
        addPlayer,
        getPlayerTier,
        getPlayerScore,
        isBannedPlayer,
        getPlayerBanReason,
        getBanInfo,
        getPlayerList,
        allPlayers,
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayerContext() {
  const context = useContext(PlayerContext)
  if (!context) {
    throw new Error("usePlayerContext must be used within a PlayerProvider")
  }
  return context
}
