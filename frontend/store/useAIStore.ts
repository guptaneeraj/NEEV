import { create } from 'zustand';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
};

const AI_API_URL = "https://ai.neevios.com";

interface ChildProfile {
  full_name?: string;
  relationship_type?: string;
  child_name?: string;
  child_dob?: string;
  child_sex?: string;
  diet_preference?: string;
  preferred_plan_type?: string;
  preferred_time_of_day?: string;
  preferred_activity_time?: string;
  stage?: string;
  current_week?: number;
  mood_logs?: any[];
  health_records?: any[];
  task_completions?: string[];
}

interface Task {
  title: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

interface GuidanceData {
  daily_tasks: Task[];
  insight: string;
  recommendation: string;
  alert: boolean;
  mode?: string;
}

interface AIState {
  children: any[];
  selectedChildId: string | null;
  guidanceData: GuidanceData | null;
  isLoading: boolean;
  lastResponse: string | null;
  error: string | null;

  setSelectedChildId: (userId: string, childId: string, isAnother?: boolean) => Promise<void>;
  fetchChildren: (userId: string) => Promise<void>;
  fetchGuidance: (userId: string, profile: ChildProfile) => Promise<void>;
  processChat: (userId: string, question: string, profile: ChildProfile, onToken: (token: string) => void) => Promise<void>;
  getStoredSessionId: (userId: string, childId: string) => Promise<string | null>;
  clearSession: (userId: string, childId: string) => Promise<void>;
}

export const useAIStore = create<AIState>((set, get) => ({
  children: [],
  selectedChildId: null,
  guidanceData: null,
  isLoading: false,
  lastResponse: null,
  error: null,

  getStoredSessionId: async (userId, childId) => {
    const key = `neev_session_${userId}_${childId}`;
    return await AsyncStorage.getItem(key);
  },

  setSelectedChildId: async (userId, childId, isAnother = false) => {
    const id = isAnother ? `another_${childId}` : childId;
    set({ selectedChildId: id, guidanceData: null });
    await AsyncStorage.setItem(`neev_active_session_${userId}`, id);
  },

  clearSession: async (userId, childId) => {
    const key = `neev_session_${userId}_${childId}`;
    await AsyncStorage.removeItem(key);
  },

  fetchChildren: async (userId) => {
    try {
      const res = await axios.post(`${AI_API_URL}/children/list`, { user_id: userId });
      set({ children: res.data.children || [] });

      const activeId = await AsyncStorage.getItem(`neev_active_session_${userId}`);
      if (activeId) {
        set({ selectedChildId: activeId });
      } else if (res.data.children?.length > 0) {
        const firstChildId = res.data.children[0].session_id || res.data.children[0].id?.toString();
        if (firstChildId) {
          await get().setSelectedChildId(userId, firstChildId);
        }
      }
    } catch (error) {
      console.error("Error fetching children:", error);
      set({ error: "Could not connect to AI. Check your connection." });
    }
  },

  fetchGuidance: async (userId, profile) => {
    const childId = get().selectedChildId;
    if (!childId) return;

    const sessionId = await get().getStoredSessionId(userId, childId);
    set({ isLoading: true, error: null });

    try {
      const res = await axios.post(`${AI_API_URL}/ai/guidance`, {
        session_id: sessionId || null,
        user_id: userId,
        child_profile: profile
      });

      set({ guidanceData: res.data });
    } catch (error: any) {
      console.error("AI Guidance Error:", error);
      if (error.response?.status === 404) {
        await get().clearSession(userId, childId);
      }
      set({ error: "Something went wrong. Please try again." });
    } finally {
      set({ isLoading: false });
    }
  },

  processChat: async (userId, question, profile, onToken) => {
    const childId = get().selectedChildId;
    if (!childId && question !== 'start') return;

    let sessionId = childId ? await get().getStoredSessionId(userId, childId) : null;

    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${AI_API_URL}/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          session_id: sessionId,
          user_id: userId,
          child_profile: profile
        })
      });

      if (!response.ok) {
        if (response.status === 404 && childId) {
          await get().clearSession(userId, childId);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newSessionId = response.headers.get('X-Session-ID');
      if (newSessionId && childId) {
        await AsyncStorage.setItem(`neev_session_${userId}_${childId}`, newSessionId);
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            const text = data.token || data.answer;
            if (text) {
              fullText += text;
              onToken(text);
            }
          } catch (e) {
            // Partial JSON
          }
        }
      }

      set({ lastResponse: fullText });
    } catch (error) {
      console.error("AI Chat Error:", error);
      set({ error: "Could not connect to AI. Check your connection." });
    } finally {
      set({ isLoading: false });
    }
  }
}));
