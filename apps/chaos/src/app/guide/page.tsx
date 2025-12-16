"use client"

import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui"
import { Users, Shield, AlertTriangle, Trophy, Heart } from "lucide-react"

export default function GuidePage() {
  return (
    <LayoutWrapper title="가이드">
      <div className="space-y-6">
        {/* 운영진 소개 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              운영진 소개
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-1">클랜 마스터</h4>
              <p>Pris, 신관동이쁘니</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-1">클랜 운영진</h4>
              <p>Pris, 신관동이쁘니, IceBlast, Platinium, DESPERADO, 라온, 나으린아뽱, 부드러운남자, 모르는개산책</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-1">티어표 편집</h4>
              <p>IceBlast, 라온, 너보단잘해욤, Pris</p>
            </div>
          </CardContent>
        </Card>

        {/* 이용 수칙 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              이용 수칙
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</span>
              <p>조금씩 양보하며 실수는 사과하고, 그러면 큰 문제 없습니다!</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</span>
              <p>각 운영진들이 고생하여 만든 곳입니다. 짜증나더라도 대화할 때 신중해주세요. (신고 등 자기 애로사항을 이야기할 때)</p>
            </div>
          </CardContent>
        </Card>

        {/* 벤 수칙 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              벤 수칙
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p><strong>1.</strong> 패드립, 욕설, 총대는 벤입니다.</p>
              <p><strong>2.</strong> 노소통, 개템, 고의트롤, 비매 조롱은 입증하기 어렵습니다. 명확한 증거와 운영진이 여러 유저의 증거를 토대로 진행합니다.</p>
              <p className="text-sm text-muted-foreground">톡방 유저들끼리는 대화를 먼저 시도, 벤 사유에 해당되더라도 문제 상황 설명 후 개선 요구 (톡방은 하나의 클랜이라 생각하세요)</p>
              <p className="text-sm text-muted-foreground">비톡방 유저분들은 방장의 재량으로 방 운영에 문제나 불편함을 발생시킨다면 과감히 벤합니다.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">경고 횟수</th>
                    <th className="text-left py-2 px-3">제재</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-3">2회 경고</td>
                    <td className="py-2 px-3">3일 벤</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3">3회 경고</td>
                    <td className="py-2 px-3">10일 벤</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3">4회 경고</td>
                    <td className="py-2 px-3">30일 벤</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">패드립/욕설 5회 경고</td>
                    <td className="py-2 px-3">평생 벤</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-semibold mb-2 text-yellow-700 dark:text-yellow-400">비매너 복귀권</h4>
              <p className="text-sm text-yellow-600 dark:text-yellow-300">5인 추천으로 복귀권을 가질 수 있습니다.</p>
              <ul className="text-sm text-yellow-600 dark:text-yellow-300 mt-2 space-y-1">
                <li>• 단순 총대나 욕설은 화해나 기타 유저 5명에게 사과하면 복귀권 부여</li>
                <li>• 복귀 후 재범 시 가차없이 벤</li>
                <li>• 최종 판단은 운영진이 함</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 명예의 전당 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-500">
              <Trophy className="h-5 w-5" />
              명예의 전당 - 공식대회 우승자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-semibold mb-2">제 1대회 우승자</h4>
              <p>Pris, 데스나이트, Platinium, 강호동, Daddy</p>
            </div>
          </CardContent>
        </Card>

        {/* 대회 후원자 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-pink-500">
              <Heart className="h-5 w-5" />
              대회 후원자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800">
              <h4 className="font-semibold mb-2">제 1대회 후원자</h4>
              <ul className="space-y-1">
                <li>Heaven : 10만</li>
                <li>Drakedog : 4만</li>
                <li>hsh4411 : 3만</li>
                <li>Gattaca : 1만</li>
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">각 참여하신 20분께도 감사의 말씀을 드립니다.</p>
            </div>
          </CardContent>
        </Card>

        {/* 접속 방법 */}
        <Card>
          <CardHeader>
            <CardTitle>접속 방법</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">대회 방송</h4>
              <a
                href="https://www.youtube.com/@%EA%B0%9C%EB%B0%9C%EC%9E%90%EC%9D%B4%EB%A6%84%EC%97%86%EB%8A%94"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                유튜브에서 [개발자이름없는] 검색
              </a>
            </div>
            <div>
              <h4 className="font-semibold mb-2">디스코드</h4>
              <a
                href="https://discord.com/invite/xKdKZzGSk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                디스코드 접속하기
              </a>
              <p className="text-sm text-muted-foreground mt-1">※ 디코방 접속 시 카오스 아이디랑 똑같이 해주세요. 안 할 시 디코방 강퇴</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutWrapper>
  )
}
