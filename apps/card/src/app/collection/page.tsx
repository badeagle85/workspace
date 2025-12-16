'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/shared/header';

// 임시 데이터
const mockCards = [
  { id: '1', title: '크리스마스 카드', from: '민수', date: '2024.12.25', emoji: '🎄' },
  { id: '2', title: '생일 카드', from: '엄마', date: '2024.10.15', emoji: '🎂' },
  { id: '3', title: '발렌타인 카드', from: '여자친구', date: '2024.02.14', emoji: '💕' },
];

export default function CollectionPage() {
  const isLoggedIn = false; // TODO: 실제 인증 상태로 교체

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">📦</div>
            <h1 className="text-2xl font-bold mb-2">보관함</h1>
            <p className="text-muted-foreground mb-6">
              로그인하면 받은 카드를 보관할 수 있어요
            </p>
            <Button asChild>
              <Link href="/login">로그인하기</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">📦 내 보관함</h1>
          <select className="border rounded-md px-3 py-2 text-sm">
            <option>최신순</option>
            <option>오래된순</option>
          </select>
        </div>

        {/* 2024년 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
            ── 2024년 ──
          </h2>
          <div className="space-y-3">
            {mockCards.map((card) => (
              <Link key={card.id} href={`/c/${card.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="text-3xl">{card.emoji}</div>
                    <div className="flex-1">
                      <h3 className="font-medium">{card.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        From: {card.from} │ {card.date}
                      </p>
                    </div>
                    <div className="text-muted-foreground">→</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* 네이티브 광고 플레이스홀더 */}
        <Card className="mb-8">
          <CardContent className="p-4 flex items-center justify-center h-24 text-muted-foreground text-sm">
            네이티브 광고 영역
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
