import notifee, { TriggerType, RepeatFrequency, AndroidImportance } from '@notifee/react-native';

export const NotificationService = {

  // Request permissions
  requestPermission: async () => {
    await notifee.requestPermission();
  },

  // Create notification channel (Android)
  createChannels: async () => {
    await notifee.createChannel({
      id: 'checkin', name: 'Daily Check-in', importance: AndroidImportance.HIGH
    });
    await notifee.createChannel({
      id: 'activity', name: 'Activity Reminders', importance: AndroidImportance.DEFAULT
    });
    await notifee.createChannel({
      id: 'streak', name: 'Streak Reminders', importance: AndroidImportance.DEFAULT
    });
    await notifee.createChannel({
      id: 'weekly', name: 'Weekly Summary', importance: AndroidImportance.DEFAULT
    });
  },

  // Schedule morning check-in (default 8:00 AM daily)
  scheduleMorningCheckin: async (hour = 8, minute = 0) => {
    await notifee.cancelNotification('morning-checkin');
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    if (date <= new Date()) date.setDate(date.getDate() + 1);
    await notifee.createTriggerNotification(
      {
        id: 'morning-checkin',
        title: '🌅 Good Morning!',
        body: 'How did your baby sleep? Take 30 seconds to log the morning check-in.',
        android: {
          channelId: 'checkin',
          pressAction: { id: 'default' }
        },
      },
      { type: TriggerType.TIMESTAMP, timestamp: date.getTime(), repeatFrequency: RepeatFrequency.DAILY }
    );
  },

  // Schedule evening check-in (default 7:00 PM daily)
  scheduleEveningCheckin: async (hour = 19, minute = 0) => {
    await notifee.cancelNotification('evening-checkin');
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    if (date <= new Date()) date.setDate(date.getDate() + 1);
    await notifee.createTriggerNotification(
      {
        id: 'evening-checkin',
        title: '🌙 Evening Check-in',
        body: 'How was your day with baby? Log feeds, mood and any new milestones.',
        android: {
          channelId: 'checkin',
          pressAction: { id: 'default' }
        },
      },
      { type: TriggerType.TIMESTAMP, timestamp: date.getTime(), repeatFrequency: RepeatFrequency.DAILY }
    );
  },

  // Schedule activity reminder based on user preferred_activity_time
  scheduleActivityReminder: async (timeString: string) => {
    // timeString format: "08:00 AM" or "07:00 PM"
    const [time, period] = timeString.split(' ');
    const [hourStr, minuteStr] = time.split(':');
    let hour = parseInt(hourStr);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    await notifee.cancelNotification('activity-reminder');
    const date = new Date();
    date.setHours(hour, parseInt(minuteStr), 0, 0);
    if (date <= new Date()) date.setDate(date.getDate() + 1);
    await notifee.createTriggerNotification(
      {
        id: 'activity-reminder',
        title: '⭐ Time for Activities!',
        body: "Your child's activity time is now. Check today's tasks.",
        android: {
          channelId: 'activity',
          pressAction: { id: 'default' }
        },
      },
      { type: TriggerType.TIMESTAMP, timestamp: date.getTime(), repeatFrequency: RepeatFrequency.DAILY }
    );
  },

  // Schedule weekly summary (Sunday 7 PM)
  scheduleWeeklySummary: async () => {
    const date = new Date();
    const daysUntilSunday = (7 - date.getDay()) % 7 || 7;
    date.setDate(date.getDate() + daysUntilSunday);
    date.setHours(19, 0, 0, 0);
    await notifee.createTriggerNotification(
      {
        id: 'weekly-summary',
        title: '📊 Your Weekly Summary',
        body: 'See how your week went and get AI insights for next week.',
        android: {
          channelId: 'weekly',
          pressAction: { id: 'default' }
        },
      },
      { type: TriggerType.TIMESTAMP, timestamp: date.getTime(), repeatFrequency: RepeatFrequency.WEEKLY }
    );
  },

  // Cancel all notifications
  cancelAll: async () => {
    await notifee.cancelAllNotifications();
  },
};
