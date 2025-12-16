"use client"

import { ArrowRightLeft } from "lucide-react"
import { MoveStatus, type BalancedTeams } from "@/shared/types"
import { tierColors } from "@/shared/config"
import { usePlayerContext } from "@/entities/player"

interface BalanceResultProps {
  teams: BalancedTeams
  players: string[]
  getTeamScore: (teamPlayers: string[]) => number
}

export function BalanceResult({ teams, players, getTeamScore }: BalanceResultProps) {
  const { getPlayerTier } = usePlayerContext()
  // 원래 나엘(1-5), 언데(6-10) 멤버
  const originalNightElf = players.slice(0, 5).map(p => p.trim().toLowerCase()).filter(p => p)
  const originalUndead = players.slice(5, 10).map(p => p.trim().toLowerCase()).filter(p => p)

  // 이동 여부 판단
  const getStatus = (name: string, isTeam1: boolean): MoveStatus => {
    const nameLower = name.toLowerCase()
    const wasNightElf = originalNightElf.includes(nameLower)
    const wasUndead = originalUndead.includes(nameLower)

    if (isTeam1) {
      if (wasNightElf) return MoveStatus.STAY
      if (wasUndead) return MoveStatus.MOVE
    } else {
      if (wasUndead) return MoveStatus.STAY
      if (wasNightElf) return MoveStatus.MOVE
    }
    return MoveStatus.STAY
  }

  const moveCount = teams.team1.filter(name => getStatus(name, true) === MoveStatus.MOVE).length +
                   teams.team2.filter(name => getStatus(name, false) === MoveStatus.MOVE).length

  const team1Score = getTeamScore(teams.team1)
  const team2Score = getTeamScore(teams.team2)

  return (
    <div className="space-y-4">
      {/* 요약 정보 */}
      <div className="flex items-center justify-center gap-6 py-3 px-4 bg-muted/50 rounded-xl">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{team1Score}</div>
          <div className="text-xs text-muted-foreground">나엘</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground">차이</div>
          <div className="text-xl font-bold">{Math.abs(team1Score - team2Score)}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{team2Score}</div>
          <div className="text-xs text-muted-foreground">언데</div>
        </div>
      </div>

      {/* 이동 정보 */}
      {moveCount > 0 ? (
        <div className="flex items-center justify-center gap-2 py-2 px-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
          <span className="text-yellow-700 dark:text-yellow-300 font-medium">
            {moveCount}명 이동 필요
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 py-2 px-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
          <span className="text-green-700 dark:text-green-300 font-medium">
            이동 없음
          </span>
        </div>
      )}

      {/* 팀 목록 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 나이트엘프 */}
        <div className="space-y-2">
          <div className="text-sm font-semibold text-green-600 dark:text-green-400 px-1">나이트엘프</div>
          <div className="space-y-1">
            {teams.team1.map((name) => {
              const tier = getPlayerTier(name)
              const status = getStatus(name, true)
              return (
                <div
                  key={name}
                  className={`flex justify-between items-center py-2 px-3 rounded-lg transition-colors ${
                    status === MoveStatus.MOVE
                      ? "bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700"
                      : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {status === MoveStatus.MOVE && (
                      <ArrowRightLeft className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    )}
                    <span className="font-medium text-foreground">{name}</span>
                  </div>
                  {tier && (
                    <span className={`text-xs text-white px-2 py-0.5 rounded-full ${tierColors[tier]}`}>
                      {tier}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 언데드 */}
        <div className="space-y-2">
          <div className="text-sm font-semibold text-purple-600 dark:text-purple-400 px-1">언데드</div>
          <div className="space-y-1">
            {teams.team2.map((name) => {
              const tier = getPlayerTier(name)
              const status = getStatus(name, false)
              return (
                <div
                  key={name}
                  className={`flex justify-between items-center py-2 px-3 rounded-lg transition-colors ${
                    status === MoveStatus.MOVE
                      ? "bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700"
                      : "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {status === MoveStatus.MOVE && (
                      <ArrowRightLeft className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    )}
                    <span className="font-medium text-foreground">{name}</span>
                  </div>
                  {tier && (
                    <span className={`text-xs text-white px-2 py-0.5 rounded-full ${tierColors[tier]}`}>
                      {tier}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
