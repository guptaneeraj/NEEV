import axios from 'axios';
import { DIRECTUS_URL, DIRECTUS_TOKEN } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Activity, ActivityHistory } from '../types/activities';

const directus = axios.create({
  baseURL: DIRECTUS_URL,
  headers: {
    Authorization: `Bearer ${DIRECTUS_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Cache Helpers
const setCache = async (key: string, data: any) => {
  try {
    if (data === undefined || data === null) {
      await AsyncStorage.removeItem(key);
    } else {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    }
  } catch (e) {
    console.error(`Error setting cache for ${key}:`, e);
  }
};

const getCache = async (key: string) => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error(`Error getting cache for ${key}:`, e);
    return null;
  }
};

// User & Child Profile Management
export const createDirectusUser = async (userData: any) => {
  const response = await directus.post('/items/users', userData);
  const user = response.data.data;
  if (user && user.email) {
    await setCache(`user_profile_${user.email}`, user);
  }
  return user;
};

export const fetchUserProfile = async (email: string) => {
  const cacheKey = `user_profile_${email}`;
  try {
    const response = await directus.get('/items/users', {
      params: {
        filter: { email: { _eq: email } },
        fields: '*.*'
      }
    });
    const profile = response.data.data[0];
    if (profile) {
      await setCache(cacheKey, profile);
    }
    return profile;
  } catch (error: any) {
    console.error("Fetch User Profile Error:", error.message);
    const cached = await getCache(cacheKey);
    return cached || null;
  }
};

export const fetchUserChildren = async (userId: number) => {
  const cacheKey = `user_children_${userId}`;
  try {
    const response = await directus.get('/items/children', {
      params: {
        filter: { user_id: { _eq: userId } },
        fields: '*'
      }
    });
    const children = response.data.data;
    await setCache(cacheKey, children);
    return children;
  } catch (error: any) {
    console.error("Fetch Children Error:", error.message);
    const cached = await getCache(cacheKey);
    return cached || [];
  }
};

export const fetchChildren = fetchUserChildren;

export const createChild = async (childData: any) => {
  const response = await directus.post('/items/children', childData);
  const newChild = response.data.data;

  // Update cache
  const cacheKey = `user_children_${childData.user_id}`;
  const cachedChildren = await getCache(cacheKey);
  if (cachedChildren) {
    await setCache(cacheKey, [...cachedChildren, newChild]);
  }

  return newChild;
};

export const updateChild = async (id: number, childData: any) => {
  const response = await directus.patch(`/items/children/${id}`, childData);
  const updated = response.data.data;

  if (updated && updated.user_id) {
    const cacheKey = `user_children_${updated.user_id}`;
    const cachedChildren = await getCache(cacheKey);
    if (cachedChildren) {
      const newList = cachedChildren.map((c: any) => c.id === id ? updated : c);
      await setCache(cacheKey, newList);
    }
  }
  return updated;
};

export const updateUser = async (userId: number, data: any) => {
  const response = await directus.patch(`/items/users/${userId}`, data);
  const updatedProfile = response.data.data;

  if (updatedProfile && updatedProfile.email) {
    await setCache(`user_profile_${updatedProfile.email}`, updatedProfile);
  }

  return updatedProfile;
};

export const updateUserProfile = updateUser;

// Check-ins (Pulse Logs)
export interface CheckIn {
  id?: number;
  user_id: number;
  child_id?: number;
  type: 'morning' | 'evening';
  date: string; // YYYY-MM-DD
  timestamp: string;
  is_perfect_timing: boolean;
  parent_mood?: string;
  parent_energy?: number;
  parent_intention?: string;
  baby_mood_evening?: string;
  evening_reflection?: string;
  linked_morning_id?: number;
  // Backward compatibility fields
  sleep_hours?: number;
  baby_mood?: string;
  cry_label?: string;
  cry_cue?: string;
}

export const saveCheckIn = async (checkIn: CheckIn) => {
  const response = await directus.post('/items/check_ins', checkIn);
  const newCheckIn = response.data.data;

  // Update list cache
  const cacheKey = `check_ins_${checkIn.user_id}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    await setCache(cacheKey, [newCheckIn, ...cached].slice(0, 100));
  }

  // Handle date-specific cache if it exists
  const dateCacheKey = `check_ins_${checkIn.user_id}_${checkIn.date}`;
  const dateCached = await getCache(dateCacheKey);
  if (dateCached) {
     await setCache(dateCacheKey, [newCheckIn, ...dateCached]);
  }

  return newCheckIn;
};

export const updateCheckIn = async (id: number, checkIn: Partial<CheckIn>) => {
  const response = await directus.patch(`/items/check_ins/${id}`, checkIn);
  return response.data.data;
};

export const fetchCheckIns = async (userId: number, date?: string) => {
  const cacheKey = `check_ins_${userId}${date ? `_${date}` : ''}`;
  try {
    const params: any = {
      filter: { user_id: { _eq: userId } },
      sort: '-timestamp',
      limit: 100
    };
    if (date) {
      params.filter.date = { _eq: date };
    }
    const response = await directus.get('/items/check_ins', { params });
    const data = response.data.data;
    await setCache(cacheKey, data);
    return data;
  } catch (error: any) {
    console.warn("Fetch Check-ins Warning:", error.message);
    const cached = await getCache(cacheKey);
    return cached || [];
  }
};

// Mood Logs
export const saveMoodLog = async (data: { user_id: number; mood: string; notes?: string; date: string }) => {
  const response = await directus.post('/items/mood_logs', data);
  const newLog = response.data.data;

  const cacheKey = `mood_logs_${data.user_id}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    await setCache(cacheKey, [newLog, ...cached].slice(0, 100));
  }

  return newLog;
};

export const fetchMoodLogs = async (userId: number) => {
  const cacheKey = `mood_logs_${userId}`;
  try {
    const response = await directus.get('/items/mood_logs', {
      params: {
        filter: { user_id: { _eq: userId } },
        sort: '-date',
        limit: 100
      }
    });
    const logs = response.data.data;
    await setCache(cacheKey, logs);
    return logs;
  } catch (error: any) {
    console.warn("Fetch Mood Logs Warning:", error.message);
    const cached = await getCache(cacheKey);
    return cached || [];
  }
};

// Health Records
export interface HealthRecord {
  id?: number;
  user_id: number;
  child_id?: number;
  record_type: string;
  value: string;
  unit?: string;
  sub_value?: string;
  date: string;
  notes?: string;
}

export const saveHealthRecord = async (record: HealthRecord) => {
  const response = await directus.post('/items/health_records', record);
  const newRecord = response.data.data;

  const cacheKey = `health_records_${record.user_id}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    await setCache(cacheKey, [newRecord, ...cached].slice(0, 100));
  }

  return newRecord;
};

export const fetchHealthRecords = async (userId: number) => {
  const cacheKey = `health_records_${userId}`;
  try {
    const response = await directus.get('/items/health_records', {
      params: {
        filter: { user_id: { _eq: userId } },
        sort: '-date',
        limit: 100
      }
    });
    const data = response.data.data;
    await setCache(cacheKey, data);
    return data;
  } catch (error: any) {
    console.warn("Fetch Health Records Warning (Collection might not exist):", error.message);
    const cached = await getCache(cacheKey);
    return cached || [];
  }
};

// Cry Analysis
export interface CryAnalysisRecord {
  user_id: number;
  child_id?: number;
  recorded_at: string;
  analysis_result: string;
  cry_type: string;
  confidence: number;
  audio_file_id?: string;
}

export const saveCryAnalysis = async (record: CryAnalysisRecord) => {
  const response = await directus.post('/items/cry_recordings', record);
  return response.data.data;
};

// Pregnancy Info
export interface PregnancyInfo {
  id?: number;
  user_id: number;
  current_week: number;
  due_date?: string;
  last_period_date?: string;
  notes?: string;
}

export const savePregnancyInfo = async (info: PregnancyInfo) => {
  const response = await directus.post('/items/Pregnancy_Info', info);
  const newInfo = response.data.data;
  await setCache(`pregnancy_info_${info.user_id}`, newInfo);
  return newInfo;
};

export const updatePregnancyInfo = async (id: number, info: any) => {
  const response = await directus.patch(`/items/Pregnancy_Info/${id}`, info);
  const updated = response.data.data;
  if (updated && updated.user_id) {
    await setCache(`pregnancy_info_${updated.user_id}`, updated);
  }
  return updated;
};

export const fetchPregnancyInfo = async (userId: number) => {
  const cacheKey = `pregnancy_info_${userId}`;
  try {
    const response = await directus.get('/items/Pregnancy_Info', {
      params: {
        filter: { user_id: { _eq: userId } },
        limit: 1
      }
    });
    const data = response.data.data[0];
    if (data) {
      await setCache(cacheKey, data);
    }
    return data;
  } catch (error: any) {
    console.warn("Fetch Pregnancy Info Warning:", error.message);
    const cached = await getCache(cacheKey);
    return cached || null;
  }
};

// Milestones
export interface Milestone {
  id: number;
  milestone_text: string;
  category: string;
  months: number;
  is_cdc_standard: boolean;
}

export const fetchMilestones = async (ageMonths?: number) => {
  const cacheKey = `milestones${ageMonths !== undefined ? `_${ageMonths}` : ''}`;
  try {
    const params: any = {
      sort: 'months',
      fields: 'id,milestone_text,category,months,is_cdc_standard'
    };
    if (ageMonths !== undefined) {
      params.filter = {
        months: { _lte: ageMonths }
      };
    }
    const response = await directus.get('/items/Milestones', { params });
    const data = response.data.data;
    await setCache(cacheKey, data);
    return data;
  } catch (error: any) {
    console.warn("Fetch Milestones Warning:", error.message);
    const cached = await getCache(cacheKey);
    return cached || [];
  }
};

export const fetchUserMilestones = async (userId: number) => {
  const cacheKey = `user_milestones_${userId}`;
  try {
    const response = await directus.get('/items/user_milestones', {
      params: {
        filter: { user_id: { _eq: userId } },
        fields: 'milestone_id,status,achieved_date'
      }
    });
    const data = response.data.data;
    await setCache(cacheKey, data);
    return data;
  } catch (error: any) {
    console.warn("Fetch User Milestones Warning:", error.message);
    const cached = await getCache(cacheKey);
    return cached || [];
  }
};

// Activities & History
export const fetchCurrentSchedule = async (userId: number) => {
  const cacheKey = `schedule_${userId}`;
  try {
    // Legacy support for Scheduler.tsx which expects this to return something
    // Refactoring: we'll fetch general activities if no specific schedule is found
    const response = await directus.get('/items/Activities', {
      params: {
        limit: 10,
        fields: 'id,activity,description,domain,tools,age_group'
      }
    });
    // Map 'activity' field to 'title' to match legacy frontend expectations
    const data = response.data.data.map((item: any) => ({
      ...item,
      title: item.activity,
      frequency: 'Daily' // Default frequency for legacy UI
    }));
    await setCache(cacheKey, data);
    return data;
  } catch (error: any) {
    console.warn("Fetch Schedule Warning:", error.message);
    const cached = await getCache(cacheKey);
    return cached || [];
  }
};

export const fetchCompletedTasks = async (userId: number) => {
  const cacheKey = `completed_tasks_${userId}`;
  try {
    const response = await directus.get('/items/user_activity_history', {
      params: {
        filter: { user_id: { _eq: userId } },
        fields: 'id,activity_id,completed_at,category'
      }
    });
    const data = response.data.data;
    await setCache(cacheKey, data);
    return data;
  } catch (error: any) {
    console.warn("Fetch Completed Tasks Warning:", error.message);
    const cached = await getCache(cacheKey);
    return cached || [];
  }
};

export const toggleTaskCompletion = async (userId: number, activityId: number, activityName: string) => {
  const response = await directus.post('/items/user_activity_history', {
    user_id: userId,
    activity_id: activityId,
    completed_at: new Date().toISOString(),
    activity_name: activityName,
    category: 'Nurture Hub'
  });
  const newRecord = response.data.data;

  // Update completed tasks cache
  const cacheKey = `completed_tasks_${userId}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    await setCache(cacheKey, [...cached, newRecord]);
  }

  return newRecord;
};

// Activities
export const fetchActivities = async (ageGroup: string): Promise<Activity[]> => {
  const cacheKey = `activities_${ageGroup}`;
  try {
    const response = await directus.get('/items/Activities', {
      params: {
        filter: { age_group: { _eq: ageGroup } },
        limit: 100,
        fields: 'id,activity,description,domain,tools,age_group,energy_level,duration_mins,toy_photo,activity_photo'
      }
    });
    const data = response.data.data;
    await setCache(cacheKey, data);
    return data;
  } catch (error: any) {
    console.warn("Fetch Activities Warning:", error.message);
    const cached = await getCache(cacheKey);
    return cached || [];
  }
};

export const saveActivityToHistory = async (
  userId: string,
  activityId: string,
  category?: string
) => {
  const response = await directus.post('/items/user_activity_history', {
    user_id: userId,
    activity_id: activityId,
    completed_at: new Date().toISOString(),
    category: category
  });
  const newRecord = response.data.data;

  // Update recent history cache
  const cacheKey = `recent_history_${userId}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    await setCache(cacheKey, [newRecord, ...cached]);
  }

  // Clear completed tasks cache to force refresh
  await setCache(`completed_tasks_${userId}`, null);

  return newRecord;
};

export const deleteActivityFromHistory = async (historyId: string | number, userId: string) => {
  await directus.delete(`/items/user_activity_history/${historyId}`);

  // Update cache
  const cacheKey = `recent_history_${userId}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    const filtered = (cached as any[]).filter(h => String(h.id) !== String(historyId));
    await setCache(cacheKey, filtered);
  }
  await setCache(`completed_tasks_${userId}`, null);
};

export const fetchActivityLog = async (
  userId: string,
  daysBack: number = 7
): Promise<any[]> => {
  const cacheKey = `activity_log_${userId}`;
  try {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - daysBack);
    const response = await directus.get('/items/user_activity_history', {
      params: {
        filter: {
          user_id: { _eq: userId }
        },
        fields: 'id,activity_id,completed_at,category',
        sort: '-completed_at',
        limit: 100
      }
    });
    const data = response.data.data;
    await setCache(cacheKey, data);
    return data;
  } catch (error) {
    const cached = await getCache(cacheKey);
    if (cached) return cached;
    return [];
  }
};

export const fetchRecentHistory = async (userId: string, limit: number = 100): Promise<ActivityHistory[]> => {
  const cacheKey = `recent_history_${userId}`;
  try {
    const response = await directus.get('/items/user_activity_history', {
      params: {
        filter: {
          user_id: { _eq: userId }
        },
        fields: 'id,activity_id,completed_at,category',
        sort: '-completed_at',
        limit: limit
      }
    });
    const data = response.data.data;
    await setCache(cacheKey, data);
    return data;
  } catch (error: any) {
    console.warn("Fetch Recent History Warning:", error.message);
    const cached = await getCache(cacheKey);
    return cached || [];
  }
};

// Utilities for Daily Plan
const shuffleArray = (array: any[]) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export const generateDailyPlan = (
  allActivities: Activity[],
  childAgeGroup: string,
  planDuration: number,
  recentHistoryIds: string[] = [],
  recentDomains: string[] = []
) => {
  let available = allActivities.filter((a: any) =>
    a.age_group === childAgeGroup &&
    !recentHistoryIds.includes(String(a.id))
  );

  if (available.length < 10) {
    available = allActivities.filter((a: any) =>
      a.age_group === childAgeGroup
    );
  }

  const fresh = available.filter((a: any) =>
    !recentDomains.includes(a.domain)
  );
  const pool = fresh.length >= 10 ? fresh : available;

  const high = shuffleArray(pool.filter((a: any) =>
    a.energy_level === 'High Energy'
  ));
  const focused = shuffleArray(pool.filter((a: any) =>
    a.energy_level === 'Focused'
  ));
  const low = shuffleArray(pool.filter((a: any) =>
    a.energy_level === 'Low Energy'
  ));

  const getItems = (bucket: any[], count: number) => {
    const items = [];
    for (let i = 0; i < count && bucket.length > 0; i++) {
      items.push(bucket.pop());
    }
    return items;
  };

  let plan: any[] = [];
  if (planDuration <= 20) {
    plan = [...getItems(high, 1), ...getItems(focused, 1), ...getItems(low, 1)];
  } else if (planDuration <= 40) {
    plan = [...getItems(high, 2), ...getItems(focused, 2), ...getItems(low, 2)];
  } else {
    plan = [...getItems(high, 2), ...getItems(focused, 4), ...getItems(low, 4)];
  }

  const diversified: any[] = [];
  let lastDomain = null;
  const remaining = [...plan];

  while (remaining.length > 0) {
    const idx = remaining.findIndex((a: any) => a.domain !== lastDomain);
    if (idx === -1) { diversified.push(...remaining); break; }
    diversified.push(remaining[idx]);
    lastDomain = remaining[idx].domain;
    remaining.splice(idx, 1);
  }

  let total = 0;
  const validated: any[] = [];
  for (const activity of diversified) {
    if (total + (activity.duration_mins || 5) <= planDuration + 5) {
      validated.push(activity);
      total += activity.duration_mins || 5;
    }
  }

  return validated;
};

// Sleep Logs & SweetSpot
export interface SleepLog {
  id?: number;
  user_id: number;
  child_id?: number;
  sleep_start: string; // ISO string
  sleep_end: string;   // ISO string
  quality?: string;
}

export const saveSleepLog = async (log: SleepLog) => {
  const response = await directus.post('/items/sleep_logs', log);
  const newLog = response.data.data;

  const cacheKey = `sleep_logs_${log.user_id}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    await setCache(cacheKey, [newLog, ...cached].slice(0, 100));
  }

  return newLog;
};

export const fetchSleepLogs = async (userId: number, daysBack: number = 5) => {
  const cacheKey = `sleep_logs_${userId}_last_${daysBack}d`;
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const response = await directus.get('/items/sleep_logs', {
      params: {
        filter: {
          user_id: { _eq: userId },
          sleep_start: { _gte: startDate.toISOString() }
        },
        sort: '-sleep_start',
        limit: 100
      }
    });
    const data = response.data.data;
    await setCache(cacheKey, data);
    return data;
  } catch (error: any) {
    console.warn("Fetch Sleep Logs Warning:", error.message);
    const cached = await getCache(cacheKey);
    return cached || [];
  }
};

export const calculateSweetSpot = async (userId: number) => {
  try {
    const logs: SleepLog[] = await fetchSleepLogs(userId, 5);
    if (!logs || logs.length < 3) return null;

    // Sort logs by time
    const sortedLogs = [...logs].sort((a, b) =>
      new Date(a.sleep_start).getTime() - new Date(b.sleep_start).getTime()
    );

    let totalWakeWindow = 0;
    let wakeWindowCount = 0;

    for (let i = 1; i < sortedLogs.length; i++) {
      const prevSleepEnd = new Date(sortedLogs[i - 1].sleep_end).getTime();
      const currentSleepStart = new Date(sortedLogs[i].sleep_start).getTime();

      const wakeWindowMinutes = (currentSleepStart - prevSleepEnd) / (1000 * 60);

      // Filter out wake windows that are too long (e.g., overnight) or too short
      if (wakeWindowMinutes > 30 && wakeWindowMinutes < 300) {
        totalWakeWindow += wakeWindowMinutes;
        wakeWindowCount++;
      }
    }

    if (wakeWindowCount === 0) return null;

    const avgWakeWindow = totalWakeWindow / wakeWindowCount;

    // Predict next sweet spot based on the LAST sleep session's end time
    const lastSleepEnd = new Date(sortedLogs[sortedLogs.length - 1].sleep_end);
    const predictedStartTime = new Date(lastSleepEnd.getTime() + avgWakeWindow * 60000);

    return {
      predictedStartTime: predictedStartTime.toISOString(),
      avgWakeWindowMinutes: Math.round(avgWakeWindow)
    };
  } catch (error) {
    console.error("SweetSpot Calculation Error:", error);
    return null;
  }
};

export const getAgeGroup = (dob: string): string => {
  const ageInMonths = Math.floor(
    (new Date().getTime() - new Date(dob).getTime()) /
    (1000 * 60 * 60 * 24 * 30.44)
  );
  if (ageInMonths <= 12) return 'Infant';
  if (ageInMonths <= 36) return 'Toddler';
  return 'Early Preschooler';
};
