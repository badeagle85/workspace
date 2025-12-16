"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button, Input } from "@/shared/ui"
import { tierColors, tierLabels, tierOrderWithBanned } from "@/shared/config"
import { Tier, type TierKey } from "@/shared/types"

interface TierEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playerName: string
  currentTier: TierKey
  currentBanReason?: string | null
  onSave: (playerName: string, newTier: TierKey, banReason?: string) => void
}

export function TierEditModal({
  open,
  onOpenChange,
  playerName,
  currentTier,
  currentBanReason,
  onSave,
}: TierEditModalProps) {
  const [selectedTier, setSelectedTier] = useState<TierKey>(currentTier)
  const [banReason, setBanReason] = useState(currentBanReason || "")
  const [isSaving, setIsSaving] = useState(false)

  // 모달이 열릴 때 상태 초기화
  useEffect(() => {
    if (open) {
      setSelectedTier(currentTier)
      setBanReason(currentBanReason || "")
    }
  }, [open, currentTier, currentBanReason])

  const isBanned = selectedTier === Tier.BANNED

  const handleSave = async () => {
    // banned 선택 시 사유 필수
    if (isBanned && !banReason.trim()) {
      return
    }

    if (selectedTier === currentTier && banReason === (currentBanReason || "")) {
      onOpenChange(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(playerName, selectedTier, isBanned ? banReason.trim() : undefined)
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>티어 변경 - {playerName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-muted-foreground mb-3 text-sm">
              현재 티어:{" "}
              <span
                className={`inline-block rounded px-2 py-0.5 text-xs text-white ${tierColors[currentTier]}`}
              >
                {tierLabels[currentTier]}
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">변경할 티어 선택</p>
            <div className="grid grid-cols-3 gap-2">
              {tierOrderWithBanned.map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    selectedTier === tier
                      ? `${tierColors[tier]} ring-primary text-white ring-2 ring-offset-2`
                      : `${tierColors[tier]} text-white opacity-60 hover:opacity-100`
                  }`}
                >
                  {tierLabels[tier]}
                </button>
              ))}
            </div>
          </div>

          {/* 밴 사유 입력 (banned 선택 시에만 표시) */}
          {isBanned && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-600">밴 사유 (필수)</p>
              <Input
                placeholder="밴 사유를 입력하세요 (예: 총대, 욕설, 트롤)"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="border-red-300 focus-visible:ring-red-400"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isSaving || (isBanned && !banReason.trim())}>
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
