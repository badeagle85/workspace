"use client"

import { useState } from "react"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group"
import { Calculator, RotateCcw } from "lucide-react"

export default function CalculatorPage() {
  const [currentScore, setCurrentScore] = useState("")
  const [gameResult, setGameResult] = useState<"win" | "lose" | null>(null)
  const [opponentTier, setOpponentTier] = useState("")
  const [calculatedScore, setCalculatedScore] = useState<number | null>(null)

  const tierScoreChange: Record<string, { win: number; lose: number }> = {
    "1": { win: 15, lose: -5 },
    "2": { win: 12, lose: -8 },
    "2.5": { win: 11, lose: -9 },
    "3": { win: 10, lose: -10 },
    "3.5": { win: 9, lose: -11 },
    "4": { win: 8, lose: -12 },
    "5": { win: 6, lose: -14 },
    "6": { win: 5, lose: -15 },
  }

  const calculate = () => {
    const current = parseFloat(currentScore)
    if (isNaN(current) || !gameResult || !opponentTier) return

    const change = tierScoreChange[opponentTier]
    if (!change) return

    const delta = gameResult === "win" ? change.win : change.lose
    setCalculatedScore(current + delta)
  }

  const reset = () => {
    setCurrentScore("")
    setGameResult(null)
    setOpponentTier("")
    setCalculatedScore(null)
  }

  return (
    <LayoutWrapper title="점수 계산기">
      <div className="max-w-md mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              게임 점수 계산
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-score">현재 점수</Label>
              <Input
                id="current-score"
                type="number"
                placeholder="현재 점수 입력"
                value={currentScore}
                onChange={(e) => setCurrentScore(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>게임 결과</Label>
              <RadioGroup
                value={gameResult || ""}
                onValueChange={(v) => setGameResult(v as "win" | "lose")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="win" id="win" />
                  <Label htmlFor="win" className="text-blue-600 font-medium">
                    승리
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="lose" id="lose" />
                  <Label htmlFor="lose" className="text-red-600 font-medium">
                    패배
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>상대 티어</Label>
              <RadioGroup
                value={opponentTier}
                onValueChange={setOpponentTier}
                className="grid grid-cols-4 gap-2"
              >
                {Object.keys(tierScoreChange).map((tier) => (
                  <div key={tier} className="flex items-center space-x-1">
                    <RadioGroupItem value={tier} id={`tier-${tier}`} />
                    <Label htmlFor={`tier-${tier}`} className="text-sm">
                      {tier}티어
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex gap-2">
              <Button onClick={calculate} className="flex-1">
                계산
              </Button>
              <Button variant="outline" onClick={reset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {calculatedScore !== null && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">계산 결과</p>
                <p className="text-4xl font-bold">
                  {calculatedScore.toFixed(0)}점
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {parseFloat(currentScore)}점 →{" "}
                  <span
                    className={
                      gameResult === "win" ? "text-blue-600" : "text-red-600"
                    }
                  >
                    {gameResult === "win" ? "+" : ""}
                    {(calculatedScore - parseFloat(currentScore)).toFixed(0)}점
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">점수 변동표</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1">
              <div className="grid grid-cols-3 font-medium border-b pb-1">
                <span>상대 티어</span>
                <span className="text-blue-600">승리</span>
                <span className="text-red-600">패배</span>
              </div>
              {Object.entries(tierScoreChange).map(([tier, changes]) => (
                <div key={tier} className="grid grid-cols-3">
                  <span>{tier}티어</span>
                  <span className="text-blue-600">+{changes.win}</span>
                  <span className="text-red-600">{changes.lose}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutWrapper>
  )
}
