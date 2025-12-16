// 티어 키 (숫자 포함 문자열이라 string enum 사용)
export enum Tier {
  TIER_1 = "1",
  TIER_2 = "2",
  TIER_2_5 = "2.5",
  TIER_3 = "3",
  TIER_3_5 = "3.5",
  TIER_4 = "4",
  TIER_5 = "5",
  TIER_6 = "6",
  TIER_7 = "7",
  NEW = "new",
  BANNED = "banned",
}

// 기존 코드 호환을 위한 타입 별칭
export type TierKey = `${Tier}`

// 팀 타입
export enum Team {
  NIGHT_ELF = "nightelf",
  UNDEAD = "undead",
}

// 밸런싱 후 이동 상태
export enum MoveStatus {
  STAY = "stay",
  MOVE = "move",
}

// 티어 리스트 모드
export enum TierListMode {
  STANDALONE = "standalone",
  BALANCER = "balancer",
}

export interface Player {
  name: string
  tier: TierKey | null
  score: number
}

export interface BannedPlayer {
  name: string
  reason: string
}

export interface BalancedTeams {
  team1: string[]
  team2: string[]
}
