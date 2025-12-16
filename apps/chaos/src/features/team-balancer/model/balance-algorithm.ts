import type { Player, BalancedTeams } from "@/shared/types"

// 조합 생성 함수
function getCombinations<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  function combine(start: number, chosen: T[]) {
    if (chosen.length === size) {
      result.push([...chosen])
      return
    }
    for (let i = start; i < arr.length; i++) {
      chosen.push(arr[i])
      combine(i + 1, chosen)
      chosen.pop()
    }
  }
  combine(0, [])
  return result
}

// 팀 점수 계산
function calculateTeamScore(team: Player[]): number {
  return team.reduce((sum, p) => sum + p.score, 0)
}

// 최적 밸런스 찾기 (상위 티어 분배 포함)
export function findBestBalance(playerList: Player[]): {
  team1: Player[]
  team2: Player[]
} {
  const halfSize = Math.floor(playerList.length / 2)

  // 1-2 티어 플레이어 분리
  const topTierPlayers = playerList.filter(p => p.tier === "1" || p.tier === "2")
  const otherPlayers = playerList.filter(p => p.tier !== "1" && p.tier !== "2")

  // 상위 티어가 2명 이상이면 분배 로직 사용
  if (topTierPlayers.length >= 2) {
    return findBalanceWithTopTierDistribution(topTierPlayers, otherPlayers, halfSize)
  }

  // 일반 밸런싱
  return findBalanceOriginal(playerList, halfSize)
}

// 상위 티어 분배를 고려한 밸런싱
function findBalanceWithTopTierDistribution(
  topTierPlayers: Player[],
  otherPlayers: Player[],
  halfSize: number
): {
  team1: Player[]
  team2: Player[]
} {
  const topTierCount = topTierPlayers.length
  const halfTop = Math.floor(topTierCount / 2)

  // 상위 티어 조합들
  const topTierCombos = getCombinations(topTierPlayers, halfTop)

  let bestCombos: {
    team1: Player[]
    team2: Player[]
  }[] = []
  let minDiff = Infinity

  for (const topTeam1 of topTierCombos) {
    const topTeam2 = topTierPlayers.filter(p => !topTeam1.includes(p))

    // 나머지 인원수 계산
    const remaining1 = halfSize - topTeam1.length
    const remaining2 = (topTierPlayers.length + otherPlayers.length) - halfSize - topTeam2.length

    if (remaining1 < 0 || remaining2 < 0 || remaining1 > otherPlayers.length) continue

    // 나머지 플레이어 조합
    const otherCombos = getCombinations(otherPlayers, remaining1)

    for (const otherTeam1 of otherCombos) {
      const otherTeam2 = otherPlayers.filter(p => !otherTeam1.includes(p))

      const team1 = [...topTeam1, ...otherTeam1]
      const team2 = [...topTeam2, ...otherTeam2]

      const score1 = calculateTeamScore(team1)
      const score2 = calculateTeamScore(team2)
      const diff = Math.abs(score1 - score2)

      if (diff < minDiff) {
        minDiff = diff
        bestCombos = [{ team1, team2 }]
      } else if (diff === minDiff) {
        bestCombos.push({ team1, team2 })
      }
    }
  }

  // 동점인 조합 중 랜덤 선택
  if (bestCombos.length > 0) {
    const randomIndex = Math.floor(Math.random() * bestCombos.length)
    return bestCombos[randomIndex]
  }

  // fallback: 일반 밸런싱
  return findBalanceOriginal([...topTierPlayers, ...otherPlayers], halfSize)
}

// 일반 조합 기반 밸런싱
function findBalanceOriginal(
  playerList: Player[],
  halfSize: number
): {
  team1: Player[]
  team2: Player[]
} {
  const combinations = getCombinations(playerList, halfSize)

  let bestCombos: {
    team1: Player[]
    team2: Player[]
  }[] = []
  let minDiff = Infinity

  for (const team1 of combinations) {
    const team2 = playerList.filter(p => !team1.includes(p))

    const score1 = calculateTeamScore(team1)
    const score2 = calculateTeamScore(team2)
    const diff = Math.abs(score1 - score2)

    if (diff < minDiff) {
      minDiff = diff
      bestCombos = [{ team1, team2 }]
    } else if (diff === minDiff) {
      bestCombos.push({ team1, team2 })
    }
  }

  // 동점인 조합 중 랜덤 선택
  if (bestCombos.length > 0) {
    const randomIndex = Math.floor(Math.random() * bestCombos.length)
    return bestCombos[randomIndex]
  }

  // fallback (shouldn't happen)
  return { team1: playerList.slice(0, halfSize), team2: playerList.slice(halfSize) }
}
