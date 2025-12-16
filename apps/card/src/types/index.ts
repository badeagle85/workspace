// 카드 이펙트 타입
export type EffectType = 'snow' | 'hearts' | 'fireworks' | 'confetti' | 'none';

// 카드 카테고리
export type CardCategory = 'christmas' | 'birthday' | 'anniversary' | 'newyear' | 'thanks' | 'general';

// 카드 데이터 (에디터에서 직렬화)
export interface CardData {
  backgroundColor: string;
  elements: CardElement[];
}

export interface CardElement {
  id: string;
  type: 'text' | 'image' | 'sticker';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  // 텍스트 전용
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  // 이미지/스티커 전용
  src?: string;
}

// 카드 (DB 스키마)
export interface Card {
  id: string;
  creator_id: string | null;
  creator_name: string | null;
  recipient_name: string | null;
  category: CardCategory;
  card_data: CardData;
  effect_type: EffectType;
  bgm_id: string | null;
  is_public: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

// 사용자 (DB 스키마)
export interface User {
  id: string;
  email: string;
  nickname: string | null;
  avatar_url: string | null;
  created_at: string;
}

// 보관함 (DB 스키마)
export interface CardCollection {
  id: string;
  user_id: string;
  card_id: string;
  saved_at: string;
  card?: Card;
}

// BGM 정보
export interface BGM {
  id: string;
  name: string;
  category: CardCategory;
  file_url: string;
  duration: number; // 초
  artist?: string;
  license: string;
}

// 템플릿
export interface Template {
  id: string;
  name: string;
  category: CardCategory;
  thumbnail_url: string;
  card_data: CardData;
  effect_type: EffectType;
  bgm_id: string | null;
  is_premium: boolean;
}
