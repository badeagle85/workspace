import { create } from 'zustand';
import type { CardData, CardElement, EffectType, CardCategory } from '@/types';
import { nanoid } from 'nanoid';

interface CardEditorState {
  // 카드 기본 정보
  category: CardCategory;
  creatorName: string;
  recipientName: string;

  // 카드 데이터
  cardData: CardData;

  // 이펙트 & BGM
  effectType: EffectType;
  bgmId: string | null;
  bgmVolume: number;

  // 에디터 상태
  selectedElementId: string | null;

  // Actions
  setCategory: (category: CardCategory) => void;
  setCreatorName: (name: string) => void;
  setRecipientName: (name: string) => void;
  setBackgroundColor: (color: string) => void;
  setEffectType: (effect: EffectType) => void;
  setBgm: (bgmId: string | null) => void;
  setBgmVolume: (volume: number) => void;

  // Element actions
  addElement: (element: Omit<CardElement, 'id'>) => void;
  updateElement: (id: string, updates: Partial<CardElement>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;

  // Reset
  resetEditor: () => void;
}

const initialCardData: CardData = {
  backgroundColor: '#ffffff',
  elements: [],
};

export const useCardStore = create<CardEditorState>((set) => ({
  // 초기값
  category: 'general',
  creatorName: '',
  recipientName: '',
  cardData: initialCardData,
  effectType: 'none',
  bgmId: null,
  bgmVolume: 0.5,
  selectedElementId: null,

  // Actions
  setCategory: (category) => set({ category }),
  setCreatorName: (name) => set({ creatorName: name }),
  setRecipientName: (name) => set({ recipientName: name }),

  setBackgroundColor: (color) =>
    set((state) => ({
      cardData: { ...state.cardData, backgroundColor: color },
    })),

  setEffectType: (effect) => set({ effectType: effect }),
  setBgm: (bgmId) => set({ bgmId }),
  setBgmVolume: (volume) => set({ bgmVolume: volume }),

  // Element actions
  addElement: (element) =>
    set((state) => ({
      cardData: {
        ...state.cardData,
        elements: [...state.cardData.elements, { ...element, id: nanoid() }],
      },
    })),

  updateElement: (id, updates) =>
    set((state) => ({
      cardData: {
        ...state.cardData,
        elements: state.cardData.elements.map((el) =>
          el.id === id ? { ...el, ...updates } : el
        ),
      },
    })),

  removeElement: (id) =>
    set((state) => ({
      cardData: {
        ...state.cardData,
        elements: state.cardData.elements.filter((el) => el.id !== id),
      },
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    })),

  selectElement: (id) => set({ selectedElementId: id }),

  resetEditor: () =>
    set({
      category: 'general',
      creatorName: '',
      recipientName: '',
      cardData: initialCardData,
      effectType: 'none',
      bgmId: null,
      bgmVolume: 0.5,
      selectedElementId: null,
    }),
}));
