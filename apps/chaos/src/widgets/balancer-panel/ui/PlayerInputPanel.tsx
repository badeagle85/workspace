"use client"

import { Input, Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui"
import { tierColors } from "@/shared/config"
import { Team, type TierKey } from "@/shared/types"
import { usePlayerContext } from "@/entities/player"
import { useGameHistory, type ActivityLevel } from "@/features/team-balancer"

interface PlayerInputPanelProps {
  team: Team
  players: string[]
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>
  activeInputIndex: number | null
  suggestions: { name: string; tier: TierKey }[]
  selectedSuggestionIndex: number
  onInputChange: (index: number, value: string) => void
  onInputFocus: (index: number) => void
  onInputBlur: () => void
  onKeyDown: (index: number, e: React.KeyboardEvent) => void
  onSelectSuggestion: (name: string, index: number) => void
  onClearInput: (index: number) => void
  getTeamScore: (players: string[]) => number
}

// 활동 레벨별 스타일
const activityStyles: Record<ActivityLevel, { label: string; color: string; tooltip: string }> = {
  frequent: { label: "🔥", color: "text-orange-500", tooltip: "자주 참가 (5회 이상)" },
  occasional: { label: "⭐", color: "text-yellow-500", tooltip: "가끔 참가 (2~4회)" },
  rare: { label: "💤", color: "text-gray-400", tooltip: "드물게 참가 (1회)" },
  new: { label: "🆕", color: "text-blue-500", tooltip: "신규 참가자" },
}

export function PlayerInputPanel({
  team,
  players,
  inputRefs,
  activeInputIndex,
  suggestions,
  selectedSuggestionIndex,
  onInputChange,
  onInputFocus,
  onInputBlur,
  onKeyDown,
  onSelectSuggestion,
  onClearInput,
  getTeamScore,
}: PlayerInputPanelProps) {
  const { getPlayerTier, isBannedPlayer } = usePlayerContext()
  const { getActivityLevel, getPlayCount, isLoading: historyLoading } = useGameHistory()
  const isNightElf = team === Team.NIGHT_ELF
  const indices = isNightElf ? [0, 1, 2, 3, 4] : [5, 6, 7, 8, 9]
  const teamPlayers = isNightElf ? players.slice(0, 5) : players.slice(5, 10)
  const filledPlayers = teamPlayers.filter(p => p.trim())
  const teamSum = teamPlayers.reduce((sum, p) => sum + (p.trim() ? getTeamScore([p.trim()]) : 0), 0)
  const teamAvg = filledPlayers.length > 0 ? Math.round(teamSum / filledPlayers.length) : 0

  const colors = isNightElf
    ? {
        bg: "bg-green-50 dark:bg-green-950/30",
        border: "border-green-200 dark:border-green-800",
        text: "text-green-700 dark:text-green-400",
        textLight: "text-green-600 dark:text-green-400",
        inputBorder: "border-green-300 dark:border-green-700",
        focusRing: "focus-visible:ring-green-400",
      }
    : {
        bg: "bg-purple-50 dark:bg-purple-950/30",
        border: "border-purple-200 dark:border-purple-800",
        text: "text-purple-700 dark:text-purple-400",
        textLight: "text-purple-600 dark:text-purple-400",
        inputBorder: "border-purple-300 dark:border-purple-700",
        focusRing: "focus-visible:ring-purple-400",
      }

  const teamName = isNightElf ? "나이트엘프" : "언데드"

  return (
    <div className={`p-2 lg:p-4 ${colors.bg} border ${colors.border} rounded-lg lg:rounded-xl space-y-2 lg:space-y-3`}>
      <div className={`flex flex-col lg:flex-row lg:justify-between lg:items-center pb-2 lg:pb-3 border-b ${colors.border}`}>
        <span className={`font-bold text-sm lg:text-lg ${colors.text}`}>{teamName}</span>
        <span className={`text-xs lg:text-sm ${colors.textLight}`}>
          합: <strong>{teamSum}</strong> / 평균: <strong>{teamAvg}</strong>
        </span>
      </div>

      {indices.map((index) => {
        const player = players[index]
        const playerName = player.trim()
        const tier = playerName ? getPlayerTier(playerName) : null
        const isBanned = playerName ? isBannedPlayer(playerName) : false
        const showSuggestions = activeInputIndex === index && suggestions.length > 0
        const activityLevel = playerName && !historyLoading ? getActivityLevel(playerName) : null
        const playCount = playerName && !historyLoading ? getPlayCount(playerName) : 0
        const activityStyle = activityLevel ? activityStyles[activityLevel] : null

        return (
          <div key={index} className="flex items-center gap-2 lg:gap-3">
            <span className={`text-sm lg:text-base w-5 lg:w-6 text-right font-bold ${colors.textLight}`}>
              {index + 1}
            </span>
            <div className="relative flex-1">
              <Input
                ref={(el) => { inputRefs.current[index] = el }}
                placeholder="이름 검색..."
                value={player}
                onChange={(e) => onInputChange(index, e.target.value)}
                onKeyDown={(e) => onKeyDown(index, e)}
                onFocus={() => onInputFocus(index)}
                onBlur={onInputBlur}
                className={`pr-20 lg:pr-24 text-sm lg:text-base h-9 lg:h-11 ${colors.inputBorder} ${colors.focusRing} ${
                  isBanned ? "border-red-500 bg-red-50 dark:bg-red-950" : ""
                }`}
              />
              {/* 활동 레벨 표시 */}
              {activityStyle && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`absolute right-14 lg:right-16 top-1/2 -translate-y-1/2 cursor-help ${activityStyle.color}`}>
                      {activityStyle.label}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{activityStyle.tooltip}</p>
                    <p className="text-xs opacity-70">최근 30일: {playCount}회 참가</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {tier && (
                <span
                  className={`hidden lg:inline absolute right-8 top-1/2 -translate-y-1/2 text-xs text-white px-1.5 py-0.5 rounded ${tierColors[tier]}`}
                >
                  {tier}
                </span>
              )}
              {player && (
                <button
                  onClick={() => onClearInput(index)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              )}

              {showSuggestions && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {suggestions.map((s, sIndex) => {
                    const sugActivityLevel = getActivityLevel(s.name)
                    const sugActivityStyle = activityStyles[sugActivityLevel]
                    return (
                      <button
                        key={s.name}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => onSelectSuggestion(s.name, index)}
                        className={`w-full px-3 py-2.5 text-left text-base flex justify-between items-center ${
                          sIndex === selectedSuggestionIndex
                            ? "bg-accent"
                            : "hover:bg-accent"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{s.name}</span>
                          <span className={sugActivityStyle.color} title={sugActivityStyle.tooltip}>
                            {sugActivityStyle.label}
                          </span>
                        </span>
                        <span className={`text-xs text-white px-1.5 py-0.5 rounded ${tierColors[s.tier]}`}>
                          {s.tier}티어
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
