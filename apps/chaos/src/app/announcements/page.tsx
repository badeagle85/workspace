import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Megaphone } from "lucide-react"

const announcements = [
  {
    id: 1,
    title: "WC3 카오스 커뮤니티 오픈",
    content: "WC3 카오스 커뮤니티 관리 시스템이 오픈되었습니다. 티어표 확인, 팀 밸런싱, 점수 계산 기능을 이용해보세요.",
    date: "2024-12-07",
    isNew: true,
  },
  {
    id: 2,
    title: "티어 조정 안내",
    content: "최근 게임 결과를 반영하여 일부 플레이어의 티어가 조정되었습니다. 티어표에서 확인해주세요.",
    date: "2024-12-06",
    isNew: true,
  },
  {
    id: 3,
    title: "게임 매너 관련 공지",
    content: "게임 중 욕설, 비매너 행위 적발 시 경고 없이 밴 처리될 수 있습니다. 건전한 게임 문화를 위해 협조 부탁드립니다.",
    date: "2024-12-01",
    isNew: false,
  },
]

export default function AnnouncementsPage() {
  return (
    <LayoutWrapper title="공지사항">
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-lg">{announcement.title}</CardTitle>
                  {announcement.isNew && (
                    <Badge variant="destructive" className="text-xs">
                      NEW
                    </Badge>
                  )}
                </div>
                <CardDescription>{announcement.date}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{announcement.content}</p>
            </CardContent>
          </Card>
        ))}

        {announcements.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              등록된 공지사항이 없습니다.
            </CardContent>
          </Card>
        )}
      </div>
    </LayoutWrapper>
  )
}
