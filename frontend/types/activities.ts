export interface Activity {
  id: string;
  name: string;
  description: string;
  domain: string;
  tools: string;
  age_group: string;
  energy_level: 'High Energy' | 'Focused' | 'Low Energy';
  duration_mins: number;
  toy_photo?: string;
  activity_photo?: string;
  completed?: boolean;
}

export interface ActivityHistory {
  activity_id: string;
  completed_at: string;
  domain?: string; // Optional, might need to join or fetch separately if needed for generator
}
