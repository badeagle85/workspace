"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { toast } from "sonner"
import type { BalancedTeams, TierKey } from "@/shared/types"
import { usePlayerContext } from "@/entities/player"
import { findBestBalance } from "./balance-algorithm"
import { useGameHistory } from "./use-game-history"

export function useBalancer() {
  const {
    allPlayers,
    getPlayerTier,
    getPlayerScore,
    isBannedPlayer,
    isLoading: playersLoading,
  } = usePlayerContext()
  const { saveGame } = useGameHistory()
  const [players, setPlayers] = useState<string[]>(Array(10).fill(""))
  const [teams, setTeams] = useState<BalancedTeams | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // 자동완성 상태
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null)
  const [suggestions, setSuggestions] = useState<{ name: string; tier: TierKey }[]>([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(0)

  const filledCount = players.filter((p) => p.trim()).length

  // 자동완성 검색
  const updateSuggestions = useCallback((value: string, index: number) => {
    if (!value.trim()) {
      setSuggestions([])
      setActiveInputIndex(null)
      return
    }

    const query = value.toLowerCase()
    const filtered = allPlayers
      .filter((p) => p.name.toLowerCase().includes(query))
      .filter((p) => !players.some((added, i) => i !== index && added.trim().toLowerCase() === p.name.toLowerCase()))
      .slice(0, 8)

    setSuggestions(filtered)
    setActiveInputIndex(index)
    setSelectedSuggestionIndex(0)
  }, [players])

  const handleInputChange = useCallback((index: number, value: string) => {
    const newPlayers = [...players]
    newPlayers[index] = value
    setPlayers(newPlayers)
    setTeams(null)
    updateSuggestions(value, index)
  }, [players, updateSuggestions])

  const handleInputFocus = useCallback((index: number) => {
    const value = players[index]
    if (value.trim()) {
      updateSuggestions(value, index)
    }
  }, [players, updateSuggestions])

  const handleInputBlur = useCallback(() => {
    setTimeout(() => {
      setSuggestions([])
      setActiveInputIndex(null)
    }, 150)
  }, [])

  const selectSuggestion = useCallback((name: string, index: number) => {
    const newPlayers = [...players]
    newPlayers[index] = name
    setPlayers(newPlayers)
    setTeams(null)
    setSuggestions([])
    setActiveInputIndex(null)

    // 다음 빈 칸으로 이동
    for (let i = index + 1; i < 10; i++) {
      if (!players[i].trim() && i !== index) {
        setTimeout(() => inputRefs.current[i]?.focus(), 0)
        return
      }
    }
  }, [players])

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (suggestions.length > 0) {
        setSelectedSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (suggestions.length > 0) {
        setSelectedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
      }
    } else if (e.key === "Enter") {
      e.preventDefault()

      if (suggestions.length > 0 && activeInputIndex === index) {
        selectSuggestion(suggestions[selectedSuggestionIndex].name, index)
        return
      }

      for (let i = index + 1; i < 10; i++) {
        if (!players[i].trim()) {
          inputRefs.current[i]?.focus()
          return
        }
      }
      for (let i = 0; i < index; i++) {
        if (!players[i].trim()) {
          inputRefs.current[i]?.focus()
          return
        }
      }
    } else if (e.key === "Escape") {
      setSuggestions([])
      setActiveInputIndex(null)
      setSelectedSuggestionIndex(0)
    }
  }, [suggestions, activeInputIndex, players, selectSuggestion, selectedSuggestionIndex])

  const clearInput = useCallback((index: number) => {
    const newPlayers = [...players]
    newPlayers[index] = ""
    setPlayers(newPlayers)
    setTeams(null)
    setSuggestions([])
    inputRefs.current[index]?.focus()
  }, [players])

  const resetAll = useCallback(() => {
    setPlayers(Array(10).fill(""))
    setTeams(null)
    setSuggestions([])
    setActiveInputIndex(null)
  }, [])

  const addPlayerFromTier = useCallback((name: string) => {
    if (isBannedPlayer(name)) {
      toast.error(`${name}은(는) 밴유저입니다.`)
      return
    }

    const existingIndex = players.findIndex((p) => p.trim().toLowerCase() === name.toLowerCase())
    if (existingIndex !== -1) {
      toast.warning(`${name}은(는) 이미 추가되어 있습니다.`)
      return
    }

    const emptyIndex = players.findIndex((p) => !p.trim())
    if (emptyIndex === -1) {
      toast.warning("참가자가 가득 찼습니다. (10명)")
      return
    }

    const newPlayers = [...players]
    newPlayers[emptyIndex] = name
    setPlayers(newPlayers)
    setTeams(null)
  }, [players])

  const balanceTeams = useCallback(() => {
    const filledPlayers = players.map((p) => p.trim()).filter((p) => p)

    if (filledPlayers.length !== 10) {
      toast.error("10명의 플레이어를 모두 입력해주세요.")
      return
    }

    for (const name of filledPlayers) {
      if (isBannedPlayer(name)) {
        toast.error(`${name}은(는) 밴유저입니다.`)
        return
      }
    }

    const uniqueNames = new Set(filledPlayers.map((n) => n.toLowerCase()))
    if (uniqueNames.size !== filledPlayers.length) {
      toast.error("중복된 플레이어가 있습니다.")
      return
    }

    const playersWithScores = filledPlayers.map((name) => ({
      name,
      score: getPlayerScore(name),
      tier: getPlayerTier(name),
    }))

    const result = findBestBalance(playersWithScores)

    // 원래 입력 순서대로 정렬
    const getOriginalIndex = (name: string) => {
      return players.findIndex((p) => p.trim().toLowerCase() === name.toLowerCase())
    }

    const team1Sorted = result.team1.map((p) => p.name).sort((a, b) => getOriginalIndex(a) - getOriginalIndex(b))
    const team2Sorted = result.team2.map((p) => p.name).sort((a, b) => getOriginalIndex(a) - getOriginalIndex(b))

    setTeams({
      team1: team1Sorted,
      team2: team2Sorted,
    })

    // 클립보드 복사
    const team1Score = team1Sorted.reduce((sum, name) => sum + getPlayerScore(name), 0)
    const team2Score = team2Sorted.reduce((sum, name) => sum + getPlayerScore(name), 0)
    const clipboardText = `나엘(${team1Score}): ${team1Sorted.join(", ")}\n언데(${team2Score}): ${team2Sorted.join(", ")}`

    navigator.clipboard.writeText(clipboardText).then(() => {
      toast.success("밸런싱 완료! 클립보드에 복사됨")
    }).catch(() => {
      toast.success("밸런싱 완료!")
    })

    // 게임 기록 저장 (백그라운드에서 실행)
    saveGame(filledPlayers).catch(() => {
      // 기록 저장 실패해도 밸런싱은 완료됨
    })
  }, [players, saveGame])

  // 10명이 채워지면 자동 밸런싱
  useEffect(() => {
    if (filledCount === 10) {
      balanceTeams()
    }
  }, [filledCount, balanceTeams])

  const getTeamScore = useCallback((teamPlayers: string[]) => {
    return teamPlayers.reduce((sum, name) => sum + getPlayerScore(name), 0)
  }, [])

  const isPlayerAdded = useCallback((name: string) => {
    return players.some((p) => p.trim().toLowerCase() === name.toLowerCase())
  }, [players])

  return {
    players,
    teams,
    inputRefs,
    activeInputIndex,
    suggestions,
    selectedSuggestionIndex,
    filledCount,
    playersLoading,
    handleInputChange,
    handleInputFocus,
    handleInputBlur,
    handleKeyDown,
    selectSuggestion,
    clearInput,
    resetAll,
    addPlayerFromTier,
    balanceTeams,
    getTeamScore,
    isPlayerAdded,
  }
}
