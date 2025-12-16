import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Template, CreateTemplateInput, TemplateRegion } from "@/types/template";

interface TemplateState {
  templates: Template[];
  selectedTemplateId: string | null;

  // Actions
  addTemplate: (input: CreateTemplateInput) => Template;
  updateTemplate: (id: string, updates: Partial<CreateTemplateInput>) => void;
  deleteTemplate: (id: string) => void;
  selectTemplate: (id: string | null) => void;
  getTemplate: (id: string) => Template | undefined;

  // 템플릿 매칭
  findMatchingTemplate: (text: string) => Template | null;
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      templates: [],
      selectedTemplateId: null,

      addTemplate: (input) => {
        const newTemplate: Template = {
          id: crypto.randomUUID(),
          name: input.name,
          description: input.description,
          keywords: input.keywords,
          regions: input.regions.map((r) => ({
            ...r,
            id: crypto.randomUUID(),
          })),
          sampleImageUrl: input.sampleImageUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          templates: [...state.templates, newTemplate],
        }));

        return newTemplate;
      },

      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...updates,
                  regions: updates.regions
                    ? updates.regions.map((r) => ({
                        ...r,
                        id: (r as TemplateRegion).id || crypto.randomUUID(),
                      }))
                    : t.regions,
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
          selectedTemplateId:
            state.selectedTemplateId === id ? null : state.selectedTemplateId,
        }));
      },

      selectTemplate: (id) => {
        set({ selectedTemplateId: id });
      },

      getTemplate: (id) => {
        return get().templates.find((t) => t.id === id);
      },

      findMatchingTemplate: (text) => {
        const templates = get().templates;
        const lowerText = text.toLowerCase();

        let bestMatch: Template | null = null;
        let bestScore = 0;

        for (const template of templates) {
          let score = 0;
          for (const keyword of template.keywords) {
            if (lowerText.includes(keyword.toLowerCase())) {
              score += 1;
            }
          }

          if (score > bestScore) {
            bestScore = score;
            bestMatch = template;
          }
        }

        // 최소 1개 이상의 키워드가 매칭되어야 함
        return bestScore > 0 ? bestMatch : null;
      },
    }),
    {
      name: "delivery-note-templates",
    }
  )
);
