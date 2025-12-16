import { create } from "zustand";
import { supabase, type AuthUser } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        set({
          user: {
            id: session.user.id,
            email: session.user.email,
          },
          session,
          isLoading: false,
        });
      } else {
        set({ user: null, session: null, isLoading: false });
      }

      // 인증 상태 변경 리스너
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          set({
            user: {
              id: session.user.id,
              email: session.user.email,
            },
            session,
          });
        } else {
          set({ user: null, session: null });
        }
      });
    } catch (error) {
      console.error("Auth initialization error:", error);
      set({ isLoading: false, error: "인증 초기화 실패" });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      if (data.user) {
        set({
          user: {
            id: data.user.id,
            email: data.user.email,
          },
          session: data.session,
          isLoading: false,
        });
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "로그인 실패";
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  signUp: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "회원가입 실패";
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ user: null, session: null, isLoading: false });
  },

  getAccessToken: async () => {
    const { session } = get();
    if (session?.access_token) {
      return session.access_token;
    }

    // 세션 갱신 시도
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
}));
