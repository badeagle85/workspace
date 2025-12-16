'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ParticleEffects } from '@/components/viewer/particle-effects';
import { SoundPlayer, useBgmPlayer } from '@/components/viewer/sound-player';
import { CardOpenAnimation, CardContentAnimation, TypingAnimation } from '@/components/viewer/card-open-animation';
import type { EffectType } from '@/types';

// 임시 카드 데이터 (나중에 API에서 가져올 예정)
const mockCardData = {
  id: 'demo',
  creatorName: '민수',
  recipientName: '사랑하는 당신',
  message: '메리 크리스마스! 🎄\n올해도 함께해서 행복했어요.\n따뜻한 연말 보내세요 ❤️',
  effect: 'snow' as EffectType,
  bgmId: 'christmas-1',
  emoji: '🎄',
  backgroundColor: '#fef3c7',
};

export default function CardViewerPage() {
  const params = useParams();
  const cardId = params.id as string;

  const [isOpened, setIsOpened] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [effectEnabled, setEffectEnabled] = useState(true);

  // BGM 훅
  const { play: playBgm, isReady: bgmReady } = useBgmPlayer(mockCardData.bgmId);

  const handleOpenCard = useCallback(() => {
    setIsOpened(true);
    // 카드 열릴 때 BGM 재생 시작 (사용자 인터랙션 내에서)
    if (bgmReady) {
      playBgm();
    }
  }, [bgmReady, playBgm]);

  const handleOpenComplete = useCallback(() => {
    setShowContent(true);
  }, []);

  // 카드 열기 전 화면
  if (!isOpened) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="text-center max-w-md w-full">
          <CardOpenAnimation isOpen={false}>
            <div />
          </CardOpenAnimation>

          <h1 className="text-2xl font-bold mb-2 mt-6">
            {mockCardData.creatorName}님이 보낸 카드가 도착했어요!
          </h1>
          <p className="text-muted-foreground mb-8">
            터치하여 카드를 열어보세요
          </p>

          {/* 광고 영역 (플레이스홀더) */}
          <div className="w-full h-24 bg-muted rounded-lg mb-8 flex items-center justify-center text-muted-foreground text-sm">
            광고 영역
          </div>

          <Button
            size="lg"
            onClick={handleOpenCard}
            className="w-full max-w-xs"
          >
            🎁 카드 열기
          </Button>
        </div>
      </div>
    );
  }

  // 카드 열린 후 화면
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4 relative overflow-hidden">
      {/* 파티클 이펙트 */}
      <ParticleEffects effect={mockCardData.effect} enabled={effectEnabled} />

      {/* 카드 열기 애니메이션 */}
      <CardOpenAnimation isOpen={true} onOpenComplete={handleOpenComplete}>
        <Card className="aspect-[4/5] relative z-10 shadow-2xl">
          <CardContent
            className="h-full flex flex-col items-center justify-center p-8 text-center"
            style={{ backgroundColor: mockCardData.backgroundColor }}
          >
            {showContent && (
              <>
                <CardContentAnimation delay={0}>
                  <div className="text-6xl mb-6">{mockCardData.emoji}</div>
                </CardContentAnimation>

                <CardContentAnimation delay={0.2}>
                  <p className="text-lg whitespace-pre-line mb-6">
                    <TypingAnimation text={mockCardData.message} delay={0.3} />
                  </p>
                </CardContentAnimation>

                <CardContentAnimation delay={0.8}>
                  <div className="mt-4 text-sm text-muted-foreground">
                    - {mockCardData.creatorName} -
                  </div>
                </CardContentAnimation>
              </>
            )}
          </CardContent>
        </Card>
      </CardOpenAnimation>

      {/* 컨트롤 영역 */}
      {showContent && (
        <CardContentAnimation delay={1}>
          <div className="mt-6 flex flex-col items-center gap-4">
            {/* BGM 컨트롤 */}
            <SoundPlayer bgmId={mockCardData.bgmId} autoPlay={true} />

            {/* 이펙트 토글 */}
            <button
              onClick={() => setEffectEnabled((prev) => !prev)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {effectEnabled ? '✨ 이펙트 끄기' : '✨ 이펙트 켜기'}
            </button>

            {/* 액션 버튼 */}
            <div className="flex gap-3 mt-4">
              <Button variant="outline" asChild>
                <Link href="/collection">📦 보관함에 저장</Link>
              </Button>
              <Button asChild>
                <Link href="/create">🎁 나도 만들기</Link>
              </Button>
            </div>
          </div>
        </CardContentAnimation>
      )}

      {/* 하단 광고 */}
      {showContent && (
        <CardContentAnimation delay={1.2}>
          <div className="mt-8 w-full max-w-md h-20 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
            광고 영역
          </div>
        </CardContentAnimation>
      )}
    </div>
  );
}
