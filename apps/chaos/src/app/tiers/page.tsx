"use client"

import { useState } from "react"
import { Lock, LogOut, Loader2, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui"
import { useTierFilter } from "@/features/tier-filter"
import { useAuth } from "@/features/auth"
import { usePlayerContext } from "@/entities/player"
import { TierList, TierEditModal, PlayerAddModal } from "@/widgets/tier-list"
import { Tier, TierListMode, type TierKey } from "@/shared/types"

// 티어표 페이지에서는 banned도 포함
const tierOrderWithBanned: TierKey[] = [
  Tier.TIER_1,
  Tier.TIER_2,
  Tier.TIER_2_5,
  Tier.TIER_3,
  Tier.TIER_3_5,
  Tier.TIER_4,
  Tier.TIER_5,
  Tier.TIER_6,
  Tier.NEW,
  Tier.BANNED,
]

export default function TiersPage() {
  const { isAuthenticated, isLoading: authLoading, login, logout } = useAuth()
  const {
    players,
    isLoading: playersLoading,
    updatePlayerTier,
    addPlayer,
    getPlayerBanReason,
  } = usePlayerContext()
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [password, setPassword] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // 티어 편집 모달 상태
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<{ name: string; tier: TierKey } | null>(null)

  // 유저 추가 모달 상태
  const [addModalOpen, setAddModalOpen] = useState(false)

  const {
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
  } = useTierFilter({ tierOrder: tierOrderWithBanned, players })

  const handleLogin = async () => {
    if (!password.trim()) return

    setIsLoggingIn(true)
    const success = await login(password)
    setIsLoggingIn(false)

    if (success) {
      toast.success("로그인 성공!")
      setShowLoginDialog(false)
      setPassword("")
    } else {
      toast.error("비밀번호가 틀렸습니다.")
    }
  }

  const handleLogout = () => {
    logout()
    toast.success("로그아웃 되었습니다.")
  }

  const handleEditPlayer = (playerName: string, currentTier: TierKey) => {
    setEditingPlayer({ name: playerName, tier: currentTier })
    setEditModalOpen(true)
  }

  const handleSaveTier = async (playerName: string, newTier: TierKey, banReason?: string) => {
    const success = await updatePlayerTier(playerName, newTier, banReason)
    if (success) {
      if (newTier === Tier.BANNED) {
        toast.success(`${playerName}이(가) 밴 처리되었습니다.`)
      } else {
        toast.success(`${playerName}의 티어가 변경되었습니다.`)
      }
    } else {
      toast.error("티어 변경에 실패했습니다.")
    }
  }

  const handleAddPlayer = async (name: string, tier: TierKey) => {
    const result = await addPlayer(name, tier)
    if (result.success) {
      toast.success(`${name}이(가) 추가되었습니다.`)
    }
    return result
  }

  if (playersLoading) {
    return (
      <LayoutWrapper title="티어표">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          <span className="text-muted-foreground ml-2">플레이어 데이터 로딩 중...</span>
        </div>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper title="티어표">
      {/* 상단 컨트롤 */}
      <div className="mb-4 flex justify-end gap-2">
        {isAuthenticated ? (
          <>
            <Button variant="outline" size="sm" onClick={() => setAddModalOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              유저 추가
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLoginDialog(true)}
            disabled={authLoading}
          >
            <Lock className="mr-2 h-4 w-4" />
            운영진 로그인
          </Button>
        )}
      </div>

      <TierList
        mode={TierListMode.STANDALONE}
        tierOrder={tierOrder}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTiers={selectedTiers}
        onToggleTier={toggleTier}
        onSelectAll={selectAll}
        onSelectNone={selectNone}
        filteredData={filteredData}
        totalPlayers={totalPlayers}
        matchedCount={matchedCount}
        isEditMode={isAuthenticated}
        onEditPlayer={handleEditPlayer}
      />

      {/* 로그인 다이얼로그 */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>운영진 로그인</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="password"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <Button
              className="w-full"
              onClick={handleLogin}
              disabled={isLoggingIn || !password.trim()}
            >
              {isLoggingIn ? "로그인 중..." : "로그인"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 티어 편집 모달 */}
      {editingPlayer && (
        <TierEditModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          playerName={editingPlayer.name}
          currentTier={editingPlayer.tier}
          currentBanReason={getPlayerBanReason(editingPlayer.name)}
          onSave={handleSaveTier}
        />
      )}

      {/* 유저 추가 모달 */}
      <PlayerAddModal open={addModalOpen} onOpenChange={setAddModalOpen} onAdd={handleAddPlayer} />
    </LayoutWrapper>
  )
}
