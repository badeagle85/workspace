"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
} from "@/shared/ui"
import { tierColors, tierLabels, tierOrderWithBanned } from "@/shared/config"
import { Tier, type TierKey } from "@/shared/types"

interface PlayerAddModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (name: string, tier: TierKey) => Promise<{ success: boolean; error?: string }>
}

export function PlayerAddModal({
  open,
  onOpenChange,
  onAdd,
}: PlayerAddModalProps) {
  const [name, setName] = useState("")
  const [selectedTier, setSelectedTier] = useState<TierKey>(Tier.NEW)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState("")

  const handleAdd = async () => {
    if (!name.trim()) {
      setError("이름을 입력해주세요.")
      return
    }

    setIsAdding(true)
    setError("")

    const result = await onAdd(name.trim(), selectedTier)

    setIsAdding(false)

    if (result.success) {
      setName("")
      setSelectedTier(Tier.NEW)
      onOpenChange(false)
    } else {
      setError(result.error || "추가 실패")
    }
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setName("")
      setSelectedTier(Tier.NEW)
      setError("")
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>새 유저 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">닉네임</label>
            <Input
              placeholder="닉네임 입력"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">티어 선택</p>
            <div className="grid grid-cols-3 gap-2">
              {tierOrderWithBanned.map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedTier === tier
                      ? `${tierColors[tier]} text-white ring-2 ring-offset-2 ring-primary`
                      : `${tierColors[tier]} text-white opacity-60 hover:opacity-100`
                  }`}
                >
                  {tierLabels[tier]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => handleClose(false)}>
            취소
          </Button>
          <Button onClick={handleAdd} disabled={isAdding || !name.trim()}>
            {isAdding ? "추가 중..." : "추가"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
