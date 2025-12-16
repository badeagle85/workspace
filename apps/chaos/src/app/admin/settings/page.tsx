import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Switch } from "@/shared/ui/switch"
import { Settings, Database, Bell, Shield } from "lucide-react"

export default function AdminSettingsPage() {
  return (
    <LayoutWrapper title="설정" isAdmin>
      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              일반 설정
            </CardTitle>
            <CardDescription>
              커뮤니티 기본 설정을 관리합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="community-name">커뮤니티 이름</Label>
              <Input id="community-name" defaultValue="WC3 카오스" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>공개 티어표</Label>
                <p className="text-sm text-muted-foreground">
                  비로그인 사용자도 티어표를 볼 수 있습니다.
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              점수 설정
            </CardTitle>
            <CardDescription>
              티어별 기본 점수와 점수 변동 규칙을 설정합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base-score">기본 점수</Label>
                <Input id="base-score" type="number" defaultValue="1000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="win-points">승리 시 기본 점수</Label>
                <Input id="win-points" type="number" defaultValue="10" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              알림 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>티어 변동 알림</Label>
                <p className="text-sm text-muted-foreground">
                  플레이어 티어 변경 시 알림을 보냅니다.
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>밴 알림</Label>
                <p className="text-sm text-muted-foreground">
                  플레이어 밴 처리 시 알림을 보냅니다.
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              권한 관리
            </CardTitle>
            <CardDescription>
              관리자 권한 설정 (추후 구현 예정)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              현재 개발 중인 기능입니다.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button>설정 저장</Button>
        </div>
      </div>
    </LayoutWrapper>
  )
}
