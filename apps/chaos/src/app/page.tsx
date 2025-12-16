"use client"

import { Shuffle, RotateCcw, Users, HelpCircle } from "lucide-react"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui"
import { tierScores, tierColors, tierLabels } from "@/shared/config"
import { Team, TierListMode, type TierKey } from "@/shared/types"
import { useBalancer } from "@/features/team-balancer"
import { useTierFilter } from "@/features/tier-filter"
import { usePlayerContext } from "@/entities/player"
import { PlayerInputPanel, BalanceResult } from "@/widgets/balancer-panel"
import { TierList } from "@/widgets/tier-list"

export default function Home() {
  const { players: playerData } = usePlayerContext()

  const {
    players,
    teams,
    inputRefs,
    activeInputIndex,
    suggestions,
    selectedSuggestionIndex,
    filledCount,
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
  } = useBalancer()

  const {
    tierOrder,
    searchQuery,
    setSearchQuery,
    selectedTiers,
    toggleTier,
    filteredData,
  } = useTierFilter({ players: playerData })

  return (
    <LayoutWrapper title="팀 밸런서">
      <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-4 lg:gap-6">
        {/* 왼쪽: 참가자 입력 + 결과 */}
        <div className="space-y-3 lg:space-y-4">
          <Card>
            <CardHeader className="pb-2 lg:pb-3 px-4 lg:px-6">
              <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                <Users className="h-4 w-4 lg:h-5 lg:w-5" />
                참가자 ({filledCount}/10)
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="ml-1 text-muted-foreground hover:text-foreground transition-colors">
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>티어별 점수표</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      {(Object.entries(tierScores) as [TierKey, number][]).map(([tier, score]) => (
                        <div
                          key={tier}
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${tierColors[tier]}`} />
                            <span className="font-medium">{tierLabels[tier]}</span>
                          </div>
                          <span className="font-bold">{score}점</span>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 lg:space-y-4 px-4 lg:px-6">
              {/* 세로 2열: 나엘(1-5), 언데(6-10) */}
              <div className="grid grid-cols-2 gap-3 lg:gap-5">
                <PlayerInputPanel
                  team={Team.NIGHT_ELF}
                  players={players}
                  inputRefs={inputRefs}
                  activeInputIndex={activeInputIndex}
                  suggestions={suggestions}
                  selectedSuggestionIndex={selectedSuggestionIndex}
                  onInputChange={handleInputChange}
                  onInputFocus={handleInputFocus}
                  onInputBlur={handleInputBlur}
                  onKeyDown={handleKeyDown}
                  onSelectSuggestion={selectSuggestion}
                  onClearInput={clearInput}
                  getTeamScore={getTeamScore}
                />
                <PlayerInputPanel
                  team={Team.UNDEAD}
                  players={players}
                  inputRefs={inputRefs}
                  activeInputIndex={activeInputIndex}
                  suggestions={suggestions}
                  selectedSuggestionIndex={selectedSuggestionIndex}
                  onInputChange={handleInputChange}
                  onInputFocus={handleInputFocus}
                  onInputBlur={handleInputBlur}
                  onKeyDown={handleKeyDown}
                  onSelectSuggestion={selectSuggestion}
                  onClearInput={clearInput}
                  getTeamScore={getTeamScore}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={resetAll}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  초기화
                </Button>
                <Button
                  onClick={balanceTeams}
                  disabled={filledCount !== 10}
                  className="flex-1"
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  팀 밸런싱
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 결과 */}
          {teams && (
            <BalanceResult
              teams={teams}
              players={players}
              getTeamScore={getTeamScore}
            />
          )}
        </div>

        {/* 오른쪽: 티어표 */}
        <TierList
          mode={TierListMode.BALANCER}
          tierOrder={tierOrder}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTiers={selectedTiers}
          onToggleTier={toggleTier}
          filteredData={filteredData}
          isPlayerAdded={isPlayerAdded}
          onAddPlayer={addPlayerFromTier}
        />
      </div>
    </LayoutWrapper>
  )
}
