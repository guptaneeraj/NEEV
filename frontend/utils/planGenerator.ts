import { Activity } from '../types/activities';

// Simple seed-based random generator to ensure "Daily" consistency
const mulberry32 = (a: number) => {
  return () => {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};

export const generateDailyPlan = (
  allActivities: Activity[],
  childAgeGroup: string,
  planDuration: number,
  recentHistoryIds: string[] = [],
  recentDomains: string[] = []
): Activity[] => {
  // Create a seed based on the current date (YYYYMMDD)
  const today = new Date();
  const seed = parseInt(`${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}`);
  const random = mulberry32(seed);

  // 1. Filter by age group and exclude recent history
  let available = allActivities.filter(a =>
    a.age_group === childAgeGroup &&
    !recentHistoryIds.includes(a.id)
  );

  // Failsafe: if too few activities, ignore history
  if (available.length < 10) {
    available = allActivities.filter(a =>
      a.age_group === childAgeGroup
    );
  }

  // 2. Deprioritize recently used domains
  const fresh = available.filter(a =>
    !recentDomains.includes(a.domain)
  );
  const pool = fresh.length >= 10 ? fresh : available;

  // 3. Bucket by energy level using seeded shuffle
  const seededShuffle = <T>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const high = seededShuffle(pool.filter(a =>
    a.energy_level === "High Energy"
  ));
  const focused = seededShuffle(pool.filter(a =>
    a.energy_level === "Focused"
  ));
  const low = seededShuffle(pool.filter(a =>
    a.energy_level === "Low Energy"
  ));

  const getItems = (bucket: Activity[], count: number): Activity[] => {
    const items: Activity[] = [];
    for (let i = 0; i < count && bucket.length > 0; i++) {
      const item = bucket.pop();
      if (item) items.push(item);
    }
    return items;
  };

  // 4. Time recipe based on planDuration
  let plan: Activity[] = [];
  if (planDuration === 20) {
    plan = [
      ...getItems(high, 1),
      ...getItems(focused, 1),
      ...getItems(low, 1)
    ];
  } else if (planDuration === 40) {
    plan = [
      ...getItems(high, 2),
      ...getItems(focused, 2),
      ...getItems(low, 2)
    ];
  } else if (planDuration === 60) {
    plan = [
      ...getItems(high, 2),
      ...getItems(focused, 4),
      ...getItems(low, 4)
    ];
  }

  // 5. Enforce domain diversity - no two consecutive same domain
  const diversified: Activity[] = [];
  let lastDomain: string | null = null;
  const remaining = [...plan];

  while (remaining.length > 0) {
    const idx = remaining.findIndex(a => a.domain !== lastDomain);
    if (idx === -1) {
      diversified.push(...remaining);
      break;
    }
    diversified.push(remaining[idx]);
    lastDomain = remaining[idx].domain;
    remaining.splice(idx, 1);
  }

  // 6. Validate total duration does not exceed planDuration (+5 min buffer)
  let total = 0;
  const validated: Activity[] = [];
  for (const activity of diversified) {
    if (total + activity.duration_mins <= planDuration + 5) {
      validated.push(activity);
      total += activity.duration_mins;
    }
  }

  return validated;
};
