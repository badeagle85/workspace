"use client"

import { useState, useMemo, useCallback } from "react"
import type { TierKey } from "@/shared/types"
import { tierOrder as defaultTierOrder } from "@/shared/config"

interface PlayerWithTier {
  name: string
  tier: TierKey
}

interface UseTierFilterOptions {
  tierOrder?: TierKey[]
  players?: PlayerWithTier[]
}

export function useTierFilter(options?: UseTierFilterOptions) {
  const tierOrder = options?.tierOrder ?? defaultTierOrder
  const players = options?.players ?? []

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTiers, setSelectedTiers] = useState<Set<TierKey>>(new Set(tierOrder))

  const toggleTier = useCallback((tier: TierKey) => {
    setSelectedTiers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(tier)) {
        newSet.delete(tier)
      } else {
        newSet.add(tier)
      }
      return newSet
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedTiers(new Set(tierOrder))
  }, [tierOrder])

  const selectNone = useCallback(() => {
    setSelectedTiers(new Set())
  }, [])

  // 티어별 플레이어 목록 생성
  const playersByTier = useMemo(() => {
    const map = new Map<TierKey, string[]>()
    for (const tier of tierOrder) {
      map.set(tier, [])
    }
    for (const player of players) {
      const list = map.get(player.tier)
      if (list) {
        list.push(player.name)
      }
    }
    return map
  }, [players, tierOrder])

  const filteredData = useMemo(() => {
    const result: { tier: TierKey; players: string[]; matchedPlayers: Set<string> }[] = []

    for (const tier of tierOrder) {
      if (!selectedTiers.has(tier)) continue

      const tierPlayers = playersByTier.get(tier) ?? []
      const matchedPlayers = new Set<string>()

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        for (const player of tierPlayers) {
          if (player.toLowerCase().includes(query)) {
            matchedPlayers.add(player)
          }
        }
        if (matchedPlayers.size > 0) {
          result.push({ tier, players: tierPlayers, matchedPlayers })
        }
      } else {
        result.push({ tier, players: tierPlayers, matchedPlayers })
      }
    }

    return result
  }, [searchQuery, selectedTiers, tierOrder, playersByTier])

  const totalPlayers = useMemo(() => {
    return players.length
  }, [players])

  const matchedCount = useMemo(() => {
    return searchQuery.trim()
      ? filteredData.reduce((sum, d) => sum + d.matchedPlayers.size, 0)
      : filteredData.reduce((sum, d) => sum + d.players.length, 0)
  }, [searchQuery, filteredData])

  return {
    tierOrder,
    searchQuery,
    setSearchQuery,
    selectedTiers,
    toggleTier,
    selectAll,
    selectNone,
    filteredData,
    totalPlayers,
    matchedCount,
  }
}
