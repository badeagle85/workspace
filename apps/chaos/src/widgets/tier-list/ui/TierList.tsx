"use client"

import { Search, X, Pencil } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Badge,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/shared/ui"
import { tierColors, tierLabels } from "@/shared/config"
import { Tier, TierListMode, type TierKey } from "@/shared/types"
import { usePlayerContext } from "@/entities/player"

interface TierListProps {
  // 공통 props
  searchQuery: string
  onSearchChange: (value: string) => void
  selectedTiers: Set<TierKey>
  onToggleTier: (tier: TierKey) => void
  tierOrder: TierKey[]
  filteredData: { tier: TierKey; players: string[]; matchedPlayers: Set<string> }[]

  // 모드별 설정
  mode?: TierListMode // standalone: 티어표 페이지, balancer: 밸런서 사이드

  // standalone 모드 전용
  onSelectAll?: () => void
  onSelectNone?: () => void
  totalPlayers?: number
  matchedCount?: number

  // balancer 모드 전용
  isPlayerAdded?: (name: string) => boolean
  onAddPlayer?: (name: string) => void

  // 편집 모드 전용
  isEditMode?: boolean
  onEditPlayer?: (playerName: string, currentTier: TierKey) => void
}

export function TierList({
  searchQuery,
  onSearchChange,
  selectedTiers,
  onToggleTier,
  tierOrder,
  filteredData,
  mode = TierListMode.STANDALONE,
  onSelectAll,
  onSelectNone,
  totalPlayers,
  matchedCount,
  isPlayerAdded,
  onAddPlayer,
  isEditMode = false,
  onEditPlayer,
}: TierListProps) {
  const { getBanInfo } = usePlayerContext()
  const isBalancerMode = mode === TierListMode.BALANCER
  const isStandaloneMode = mode === TierListMode.STANDALONE

  // 날짜 포맷팅 함수
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "알 수 없음"
    const date = new Date(dateStr)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        {isBalancerMode && (
          <CardHeader className="pb-3">
            <CardTitle className="text-base">티어표 (클릭하여 추가)</CardTitle>
          </CardHeader>
        )}
        <CardContent className={`space-y-3 ${isStandaloneMode ? "space-y-4 pt-6" : ""}`}>
          {/* 검색 */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="플레이어 검색..."
              className={`pr-9 pl-9 ${isBalancerMode ? "h-9" : "text-base"}`}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* 티어 필터 */}
          <div className={isStandaloneMode ? "space-y-2" : ""}>
            {isStandaloneMode && onSelectAll && onSelectNone && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">티어 필터</span>
                <div className="flex gap-2 text-sm">
                  <button onClick={onSelectAll} className="text-primary hover:underline">
                    전체 선택
                  </button>
                  <span className="text-muted-foreground">|</span>
                  <button onClick={onSelectNone} className="text-primary hover:underline">
                    전체 해제
                  </button>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {tierOrder.map((tier) => (
                <button
                  key={tier}
                  onClick={() => onToggleTier(tier)}
                  className={`rounded-full px-2 py-1 text-xs font-medium transition-all ${
                    selectedTiers.has(tier)
                      ? `${tierColors[tier]} text-white`
                      : "bg-muted text-muted-foreground opacity-50"
                  }`}
                >
                  {tierLabels[tier]}
                </button>
              ))}
            </div>
          </div>

          {/* 결과 카운트 (standalone 모드만) */}
          {isStandaloneMode && totalPlayers !== undefined && matchedCount !== undefined && (
            <div className="text-muted-foreground text-sm">
              {searchQuery.trim() ? (
                <>
                  <span className="text-foreground font-medium">{matchedCount}명</span> 검색됨 (전체{" "}
                  {totalPlayers}명)
                </>
              ) : (
                <>
                  <span className="text-foreground font-medium">{matchedCount}명</span> 표시 중{" "}
                  (전체 {totalPlayers}명)
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 티어 목록 */}
      {isStandaloneMode && filteredData.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center">
            {searchQuery.trim()
              ? `"${searchQuery}" 검색 결과가 없습니다.`
              : "선택된 티어가 없습니다."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredData.map(({ tier, players: tierPlayers, matchedPlayers }) => (
            <Card key={tier} className="overflow-hidden">
              <CardHeader className={isBalancerMode ? "px-3 py-2" : "pb-3"}>
                <CardTitle className={`flex items-center gap-2 ${isBalancerMode ? "text-sm" : ""}`}>
                  <Badge className={`${tierColors[tier]} text-white`}>{tierLabels[tier]}</Badge>
                  <span
                    className={`text-muted-foreground font-normal ${isBalancerMode ? "text-xs" : "text-base"}`}
                  >
                    {searchQuery.trim() && matchedPlayers.size > 0
                      ? `${matchedPlayers.size}명 / ${tierPlayers.length}명`
                      : `${tierPlayers.length}명`}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className={isBalancerMode ? "p-2" : ""}>
                <div className={`flex flex-wrap ${isBalancerMode ? "gap-1" : "gap-2"}`}>
                  {tierPlayers.map((name, index) => {
                    const isMatched = matchedPlayers.has(name)
                    const isSearching = searchQuery.trim().length > 0
                    const isAdded = isBalancerMode && isPlayerAdded ? isPlayerAdded(name) : false

                    if (isBalancerMode && onAddPlayer) {
                      return (
                        <button
                          key={`${name}-${index}`}
                          onClick={() => onAddPlayer(name)}
                          disabled={isAdded}
                          className={`rounded border px-2 py-1 text-sm transition-colors ${
                            isAdded
                              ? "bg-primary text-primary-foreground border-primary"
                              : isSearching
                                ? isMatched
                                  ? "border-yellow-400 bg-yellow-100 hover:bg-yellow-200 dark:border-yellow-600 dark:bg-yellow-900/50 dark:hover:bg-yellow-900"
                                  : "border-border opacity-40"
                                : "border-border hover:bg-accent"
                          }`}
                        >
                          {name}
                        </button>
                      )
                    }

                    // 밴 유저인 경우 툴팁 표시
                    const banInfo = tier === Tier.BANNED ? getBanInfo(name) : null

                    const playerElement = (
                      <span
                        className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-sm transition-colors ${
                          isSearching
                            ? isMatched
                              ? "border-yellow-400 bg-yellow-100 dark:border-yellow-600 dark:bg-yellow-900/50"
                              : "border-border opacity-40"
                            : tier === Tier.BANNED
                              ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                              : "border-border"
                        }`}
                      >
                        {name}
                        {isEditMode && onEditPlayer && (
                          <button
                            onClick={() => onEditPlayer(name, tier)}
                            className="hover:bg-primary/20 text-muted-foreground hover:text-primary ml-1 rounded p-0.5 transition-colors"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    )

                    // 밴 유저는 툴팁으로 감싸기
                    if (banInfo) {
                      return (
                        <Tooltip key={`${name}-${index}`}>
                          <TooltipTrigger asChild>{playerElement}</TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-medium">밴 사유</p>
                              <p>{banInfo.reason || "사유 없음"}</p>
                              <p className="text-xs opacity-70">{formatDate(banInfo.date)}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )
                    }

                    return <span key={`${name}-${index}`}>{playerElement}</span>
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
