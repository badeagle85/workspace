import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/shared/header';

const categories = [
  { id: 'christmas', emoji: '🎄', label: '크리스마스' },
  { id: 'birthday', emoji: '🎂', label: '생일' },
  { id: 'anniversary', emoji: '💕', label: '기념일' },
  { id: 'newyear', emoji: '🎊', label: '새해' },
  { id: 'thanks', emoji: '🌸', label: '감사' },
  { id: 'general', emoji: '✍️', label: '자유' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 text-center">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              ✨ 소리가 나는 카드를 보내보세요 ✨
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              눈이 내리고, 음악이 흐르는 특별한 카드를 만들어보세요.
              <br />
              무료로 감성 가득한 e-card를 보낼 수 있습니다.
            </p>
            <Button size="lg" asChild>
              <Link href="/create">🎁 카드 만들기</Link>
            </Button>
          </div>
        </section>

        {/* Category Section */}
        <section className="py-12 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold text-center mb-8">
              어떤 카드를 만들어볼까요?
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/create?category=${cat.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-2">{cat.emoji}</div>
                      <div className="font-medium">{cat.label}</div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold text-center mb-12">
              카드박스만의 특별함
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-5xl mb-4">🎵</div>
                <h3 className="font-semibold mb-2">사운드</h3>
                <p className="text-muted-foreground text-sm">
                  카드를 열면 음악이 흘러나와요
                </p>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-4">✨</div>
                <h3 className="font-semibold mb-2">이펙트</h3>
                <p className="text-muted-foreground text-sm">
                  눈, 하트, 폭죽 효과로 감동을 더해요
                </p>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-4">📦</div>
                <h3 className="font-semibold mb-2">보관함</h3>
                <p className="text-muted-foreground text-sm">
                  소중한 카드를 영원히 간직하세요
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 카드박스. 마음을 담은 카드, 추억으로 남기다.</p>
        </div>
      </footer>
    </div>
  );
}
