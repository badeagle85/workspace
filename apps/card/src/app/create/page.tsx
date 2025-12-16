'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/shared/header';
import { useCardStore } from '@/store/card-store';
import type { CardCategory, EffectType } from '@/types';

const categories = [
  { id: 'christmas', emoji: '🎄', label: '크리스마스' },
  { id: 'birthday', emoji: '🎂', label: '생일' },
  { id: 'anniversary', emoji: '💕', label: '기념일' },
  { id: 'newyear', emoji: '🎊', label: '새해' },
  { id: 'thanks', emoji: '🌸', label: '감사' },
  { id: 'general', emoji: '✍️', label: '자유' },
] as const;

const effects = [
  { id: 'none', emoji: '✖️', label: '없음' },
  { id: 'snow', emoji: '❄️', label: '눈' },
  { id: 'hearts', emoji: '❤️', label: '하트' },
  { id: 'fireworks', emoji: '🎆', label: '폭죽' },
  { id: 'confetti', emoji: '🎊', label: '색종이' },
] as const;

const bgmList = [
  { id: 'none', label: '없음' },
  { id: 'christmas-1', label: '🎄 크리스마스 캐롤' },
  { id: 'birthday-1', label: '🎂 생일 축하' },
  { id: 'piano-1', label: '🎹 잔잔한 피아노' },
  { id: 'acoustic-1', label: '🎸 어쿠스틱 기타' },
];

type EditorTab = 'text' | 'image' | 'effect' | 'sound';

export default function CreatePage() {
  const [activeTab, setActiveTab] = useState<EditorTab>('text');
  const [messageText, setMessageText] = useState('');

  const {
    category,
    setCategory,
    effectType,
    setEffectType,
    bgmId,
    setBgm,
    cardData,
    setBackgroundColor,
    addElement,
  } = useCardStore();

  const handleAddText = () => {
    if (!messageText.trim()) return;
    addElement({
      type: 'text',
      text: messageText,
      x: 50,
      y: 50,
      fontSize: 24,
      fontFamily: 'Noto Sans KR',
      fontColor: '#000000',
      fontWeight: '400',
      textAlign: 'center',
    });
    setMessageText('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            ← 뒤로
          </Link>
          <h1 className="text-xl font-semibold">카드 만들기</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* 카드 프리뷰 */}
          <div className="order-1 lg:order-1">
            <Card className="aspect-[4/5] flex items-center justify-center">
              <CardContent
                className="w-full h-full flex flex-col items-center justify-center p-8"
                style={{ backgroundColor: cardData.backgroundColor }}
              >
                {cardData.elements.length === 0 ? (
                  <p className="text-muted-foreground">
                    메시지를 입력하세요
                  </p>
                ) : (
                  cardData.elements.map((el) => (
                    <div
                      key={el.id}
                      style={{
                        fontSize: el.fontSize,
                        color: el.fontColor,
                        fontWeight: el.fontWeight,
                        textAlign: el.textAlign,
                      }}
                    >
                      {el.text}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="mt-4 flex justify-center">
              <Button size="lg">
                미리보기
              </Button>
            </div>
          </div>

          {/* 에디터 패널 */}
          <div className="order-2 lg:order-2 space-y-6">
            {/* 카테고리 선택 */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">카테고리</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={category === cat.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCategory(cat.id as CardCategory)}
                    >
                      {cat.emoji} {cat.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 에디터 탭 */}
            <Card>
              <CardContent className="p-4">
                <div className="flex border-b mb-4">
                  {(['text', 'image', 'effect', 'sound'] as EditorTab[]).map((tab) => (
                    <button
                      key={tab}
                      className={`px-4 py-2 font-medium ${
                        activeTab === tab
                          ? 'border-b-2 border-primary text-primary'
                          : 'text-muted-foreground'
                      }`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab === 'text' && '📝 텍스트'}
                      {tab === 'image' && '🖼️ 이미지'}
                      {tab === 'effect' && '✨ 이펙트'}
                      {tab === 'sound' && '🎵 사운드'}
                    </button>
                  ))}
                </div>

                {/* 텍스트 탭 */}
                {activeTab === 'text' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        메시지 입력
                      </label>
                      <textarea
                        className="w-full min-h-[100px] p-3 border rounded-md"
                        placeholder="마음을 담은 메시지를 입력하세요..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                      />
                      <Button onClick={handleAddText} className="mt-2">
                        텍스트 추가
                      </Button>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        배경색
                      </label>
                      <div className="flex gap-2">
                        {['#ffffff', '#fef3c7', '#fce7f3', '#dbeafe', '#d1fae5', '#1f2937'].map(
                          (color) => (
                            <button
                              key={color}
                              className={`w-8 h-8 rounded-full border-2 ${
                                cardData.backgroundColor === color
                                  ? 'border-primary'
                                  : 'border-transparent'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => setBackgroundColor(color)}
                            />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 이미지 탭 */}
                {activeTab === 'image' && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>🖼️ 이미지 업로드 기능</p>
                    <p className="text-sm">곧 추가됩니다</p>
                  </div>
                )}

                {/* 이펙트 탭 */}
                {activeTab === 'effect' && (
                  <div className="space-y-4">
                    <label className="text-sm font-medium mb-2 block">
                      이펙트 선택
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {effects.map((effect) => (
                        <button
                          key={effect.id}
                          className={`p-3 rounded-lg border text-center ${
                            effectType === effect.id
                              ? 'border-primary bg-primary/10'
                              : 'border-muted'
                          }`}
                          onClick={() => setEffectType(effect.id as EffectType)}
                        >
                          <div className="text-2xl">{effect.emoji}</div>
                          <div className="text-xs mt-1">{effect.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 사운드 탭 */}
                {activeTab === 'sound' && (
                  <div className="space-y-4">
                    <label className="text-sm font-medium mb-2 block">
                      BGM 선택
                    </label>
                    <div className="space-y-2">
                      {bgmList.map((bgm) => (
                        <button
                          key={bgm.id}
                          className={`w-full p-3 rounded-lg border text-left ${
                            bgmId === bgm.id || (bgmId === null && bgm.id === 'none')
                              ? 'border-primary bg-primary/10'
                              : 'border-muted'
                          }`}
                          onClick={() => setBgm(bgm.id === 'none' ? null : bgm.id)}
                        >
                          {bgm.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 완료 버튼 */}
            <Button size="lg" className="w-full">
              ✅ 완료하기
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
