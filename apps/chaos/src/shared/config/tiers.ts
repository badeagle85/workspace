import { Tier, type TierKey } from "@/shared/types"

export const tierScores: Record<TierKey, number> = {
  [Tier.TIER_1]: 8.5,
  [Tier.TIER_2]: 7,
  [Tier.TIER_2_5]: 6.5,
  [Tier.TIER_3]: 6,
  [Tier.TIER_3_5]: 5,
  [Tier.TIER_4]: 4,
  [Tier.TIER_5]: 3,
  [Tier.TIER_6]: 2,
  [Tier.TIER_7]: 1,
  [Tier.NEW]: 5,
  [Tier.BANNED]: 0,
}

export const tierColors: Record<TierKey, string> = {
  [Tier.TIER_1]: "bg-red-500",
  [Tier.TIER_2]: "bg-orange-500",
  [Tier.TIER_2_5]: "bg-amber-500",
  [Tier.TIER_3]: "bg-yellow-500",
  [Tier.TIER_3_5]: "bg-lime-500",
  [Tier.TIER_4]: "bg-green-500",
  [Tier.TIER_5]: "bg-teal-500",
  [Tier.TIER_6]: "bg-blue-500",
  [Tier.TIER_7]: "bg-indigo-500",
  [Tier.NEW]: "bg-purple-500",
  [Tier.BANNED]: "bg-gray-500",
}

export const tierLabels: Record<TierKey, string> = {
  [Tier.TIER_1]: "1티어",
  [Tier.TIER_2]: "2티어",
  [Tier.TIER_2_5]: "2.5티어",
  [Tier.TIER_3]: "3티어",
  [Tier.TIER_3_5]: "3.5티어",
  [Tier.TIER_4]: "4티어",
  [Tier.TIER_5]: "5티어",
  [Tier.TIER_6]: "6티어",
  [Tier.TIER_7]: "7티어",
  [Tier.NEW]: "신규",
  [Tier.BANNED]: "밴",
}

// 밸런서용 티어 순서 (banned 제외)
export const tierOrder: TierKey[] = [
  Tier.TIER_1,
  Tier.TIER_2,
  Tier.TIER_2_5,
  Tier.TIER_3,
  Tier.TIER_3_5,
  Tier.TIER_4,
  Tier.TIER_5,
  Tier.TIER_6,
  Tier.NEW,
]

// 티어표 페이지용 (banned 포함)
export const tierOrderWithBanned: TierKey[] = [
  ...tierOrder,
  Tier.BANNED,
]
