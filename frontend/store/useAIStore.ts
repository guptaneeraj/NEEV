import { create } from 'zustand';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as directusService from '../services/DirectusApiClient';

export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
};

import { BACKEND_URL, DIRECTUS_URL, DIRECTUS_TOKEN } from '@env';

const AI_API_URL = BACKEND_URL;

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
  child_age_months?: number;
  mood_logs?: any[];
  health_records?: any[];
  task_completions?: string[];
  check_ins?: any[];
}

interface Task {
  title: string;
  reason?: string;
  priority?: 'high' | 'medium' | 'low';
  domain?: string;
  description?: string;
  tools?: string;
  completed?: boolean;
  session_min?: number;
  session_max?: number;
}

interface GuidanceData {
  daily_tasks: Task[];
  insight?: string;
  recommendation?: string;
  alert?: boolean;
  mode?: string;
  task_completions?: string[];
  week?: number;
  completed_count?: number;
}

interface AIState {
  children: any[];
  mood_logs: any[];
  health_records: any[];
  check_ins: any[];
  selectedChildId: string | null;
  guidanceData: GuidanceData | null;
  isLoading: boolean;
  lastResponse: string | null;
  error: string | null;

  buildRichProfile: (userId: string, profile: ChildProfile) => Promise<ChildProfile>;
  setSelectedChildId: (userId: string, childId: string, isAnother?: boolean) => Promise<void>;
  fetchChildren: (userId: string, forceRefresh?: boolean) => Promise<void>;
  fetchCheckIns: (userId: string) => Promise<void>;
  fetchGuidance: (userId: string, profile: ChildProfile) => Promise<void>;
  streamGuidance: (userId: string, profile: ChildProfile, onUpdate: (data: Partial<GuidanceData>) => void) => Promise<void>;
  processChat: (userId: string, question: string, profile: ChildProfile, onToken: (token: string) => void) => Promise<void>;
  getStoredSessionId: (userId: string, childId: string) => Promise<string | null>;
  clearSession: (userId: string, childId: string) => Promise<void>;
}

export const useAIStore = create<AIState>((set, get) => ({
  children: [],
  mood_logs: [],
  health_records: [],
  check_ins: [],
  selectedChildId: null,
  guidanceData: null,
  isLoading: false,
  lastResponse: null,
  error: null,

  buildRichProfile: async (userId, profile) => {
    const CACHE_KEY = `rich_profile_${userId}`;
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          // Merge cached data with provided profile
          return { ...profile, ...data };
        }
      }
    } catch (e) {}

    const enriched = { ...profile };

    if (profile.child_dob) {
      try {
        const dob = new Date(profile.child_dob);
        const now = new Date();
        enriched.child_age_months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
      } catch (e) {}
    }

    try {
      const response = await axios.get(
        `${DIRECTUS_URL}/items/user_activity_history`,
        {
          headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
          params: {
            filter: { user_id: { _eq: userId } },
            fields: 'activity_id,completed_at',
            limit: 50,
            sort: '-completed_at'
          }
        }
      );
      enriched.task_completions = response.data.data.map((item: any) => item.activity_id.toString());
    } catch (error) {}

    const state = get();
    if (state.mood_logs?.length) enriched.mood_logs = state.mood_logs;
    if (state.health_records?.length) enriched.health_records = state.health_records;
    if (state.check_ins?.length) enriched.check_ins = state.check_ins;

    // Save to cache
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
        data: enriched,
        timestamp: Date.now()
      }));
    } catch (e) {}

    return enriched;
  },

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

  fetchChildren: async (userId, forceRefresh = false) => {
    // Optimization: Don't re-fetch if we already have children unless forced
    if (get().children.length > 0 && !forceRefresh) return;

    try {
      const data = await directusService.fetchChildren(parseInt(userId));
      const formatted = data.map((c: any) => ({
        ...c,
        session_id: c.id?.toString()
      }));

      set({ children: formatted || [] });

      const activeId = await AsyncStorage.getItem(`neev_active_session_${userId}`);
      if (activeId) {
        set({ selectedChildId: activeId });
      } else if (formatted?.length > 0) {
        const firstChildId = formatted[0].session_id || formatted[0].id?.toString();
        if (firstChildId) {
          await get().setSelectedChildId(userId, firstChildId);
        }
      }
    } catch (error) {
      console.error("Error fetching children from Directus:", error);
    }
  },

  fetchCheckIns: async (userId) => {
    try {
      const data = await directusService.fetchCheckIns(parseInt(userId));
      set({ check_ins: data || [] });
    } catch (error) {
      console.error("Error fetching check-ins:", error);
    }
  },

  fetchGuidance: async (userId, profile) => {
    const childId = get().selectedChildId || userId;
    const sessionId = await get().getStoredSessionId(userId, childId);
    set({ isLoading: true, error: null });

    try {
      const enrichedProfile = await get().buildRichProfile(userId, profile);

      const allowedFields = [
        'full_name', 'relationship_type', 'child_name',
        'child_dob', 'child_sex', 'diet_preference',
        'preferred_plan_type', 'preferred_time_of_day',
        'preferred_activity_time', 'stage', 'current_week',
        'child_age_months', 'mood_logs', 'health_records',
        'task_completions', 'check_ins'
      ];
      const sanitizedProfile = Object.fromEntries(
        Object.entries(enrichedProfile)
          .filter(([k, v]) => allowedFields.includes(k) && v !== null && v !== undefined)
          .map(([k, v]) => (k === 'child_age_months' ? [k, Math.floor(Number(v))] : [k, v]))
      );

      const res = await axios.post(`${AI_API_URL}/ai/guidance`, {
        session_id: sessionId || null,
        user_id: userId,
        child_profile: sanitizedProfile
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

  streamGuidance: async (userId, profile, onUpdate) => {
    const childId = get().selectedChildId || userId;
    let sessionId = await get().getStoredSessionId(userId, childId);

    set({ isLoading: true, error: null });

    try {
      const enrichedProfile = await get().buildRichProfile(userId, profile);

      const allowedFields = [
        'full_name', 'relationship_type', 'child_name',
        'child_dob', 'child_sex', 'diet_preference',
        'preferred_plan_type', 'preferred_time_of_day',
        'preferred_activity_time', 'stage', 'current_week',
        'child_age_months', 'mood_logs', 'health_records',
        'task_completions', 'check_ins'
      ];
      const sanitizedProfile = Object.fromEntries(
        Object.entries(enrichedProfile)
          .filter(([k, v]) => allowedFields.includes(k) && v !== null && v !== undefined)
          .map(([k, v]) => (k === 'child_age_months' ? [k, Math.floor(Number(v))] : [k, v]))
      );

      const response = await fetch(`${AI_API_URL}/ai/guidance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId || null,
          user_id: String(userId),
          child_profile: sanitizedProfile,
          stream: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Guidance stream error details:", errorText);
        throw new Error("Guidance stream failed");
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let lineBuffer = '';
      let currentData: Partial<GuidanceData> = {};

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Process final remaining buffer content
          if (lineBuffer.trim()) {
            try {
              const data = JSON.parse(lineBuffer.trim());
              currentData = { ...currentData, ...data };
              set({ guidanceData: currentData as GuidanceData });
            } catch (e) {}
          }
          break;
        }

        lineBuffer += decoder.decode(value, { stream: true });
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const data = JSON.parse(trimmed);
            if (data.mode === 'onboarding') {
              set({ guidanceData: null, isLoading: false });
              return;
          }
          currentData = { ...currentData, ...data };
          set({ guidanceData: currentData as GuidanceData });
          onUpdate(data);
        } catch (e) {}
      }
    }
    } catch (error) {
      console.error("Stream Guidance Error:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  processChat: async (userId, question, profile, onToken) => {
    const childId = get().selectedChildId || userId;
    let sessionId = await get().getStoredSessionId(userId, childId);

    set({ isLoading: true, error: null });

    try {
      const enrichedProfile = await get().buildRichProfile(userId, profile);
      const response = await fetch(`${AI_API_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          session_id: sessionId,
          user_id: userId,
          child_profile: enrichedProfile
        })
      });

      if (!response.ok) {
        if (response.status === 404) {
          await get().clearSession(userId, childId);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newSessionId = response.headers.get('X-Session-ID');
      if (newSessionId) {
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
          } catch (e) {}
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
