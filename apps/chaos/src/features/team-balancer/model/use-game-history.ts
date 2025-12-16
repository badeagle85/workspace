"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// 참가 횟수 조회 API
async function fetchPlayCounts(days: number = 30): Promise<Record<string, number>> {
  const res = await fetch(`/api/games?days=${days}`)
  if (!res.ok) {
    throw new Error("Failed to fetch play counts")
  }
  return res.json()
}

// 게임 기록 저장 API
async function saveGameHistory(players: string[]): Promise<{ success: boolean; gameId: string }> {
  const res = await fetch("/api/games", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ players }),
  })
  if (!res.ok) {
    throw new Error("Failed to save game history")
  }
  return res.json()
}

export type ActivityLevel = "frequent" | "occasional" | "rare" | "new"

export interface UseGameHistoryOptions {
  days?: number // 기준 일수 (기본 30일)
  frequentThreshold?: number // 자주하는 유저 기준 (기본 5회 이상)
  occasionalThreshold?: number // 가끔하는 유저 기준 (기본 2회 이상)
}

export function useGameHistory(options: UseGameHistoryOptions = {}) {
  const { days = 30, frequentThreshold = 5, occasionalThreshold = 2 } = options
  const queryClient = useQueryClient()

  // 참가 횟수 조회
  const {
    data: playCounts = {},
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["playCounts", days],
    queryFn: () => fetchPlayCounts(days),
    staleTime: 5 * 60 * 1000, // 5분 캐시
  })

  // 게임 기록 저장 mutation
  const saveMutation = useMutation({
    mutationFn: saveGameHistory,
    onSuccess: () => {
      // 저장 후 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["playCounts"] })
    },
  })

  // 플레이어의 참가 횟수 조회
  const getPlayCount = (playerName: string): number => {
    // 대소문자 무시하고 찾기
    const lowerName = playerName.toLowerCase()
    for (const [name, count] of Object.entries(playCounts)) {
      if (name.toLowerCase() === lowerName) {
        return count
      }
    }
    return 0
  }

  // 플레이어의 활동 레벨 판단
  const getActivityLevel = (playerName: string): ActivityLevel => {
    const count = getPlayCount(playerName)
    if (count >= frequentThreshold) return "frequent"
    if (count >= occasionalThreshold) return "occasional"
    if (count > 0) return "rare"
    return "new"
  }

  // 게임 기록 저장
  const saveGame = async (players: string[]): Promise<boolean> => {
    try {
      await saveMutation.mutateAsync(players)
      return true
    } catch {
      return false
    }
  }

  return {
    playCounts,
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
    getPlayCount,
    getActivityLevel,
    saveGame,
    isSaving: saveMutation.isPending,
  }
}
