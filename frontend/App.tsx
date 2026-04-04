import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './app/contexts/AuthContext';
import { NotificationService } from './services/NotificationService';
import notifee, { EventType } from '@notifee/react-native';

// Import Journey Screens
import Landing from './app/screens/Landing';
import LampScreen from './app/screens/LampScreen';
import Login from './app/screens/auth/Login';
import Register from './app/screens/auth/Register';
import Home from './app/screens/tabs/Dashboard';
import Plan from './app/screens/main/plan';
import Insights from './app/screens/main/insights';
import Health from './app/screens/tabs/Health';
import Profile from './app/screens/tabs/Profile';
import AIChat from './app/screens/main/ai-chat';
import ActivityGuidance from './app/screens/main/activity-guidance';
import PulseScreen from './app/screens/main/PulseScreen';
import AgeGuide from './app/screens/main/AgeGuide';
import HelpCenter from './app/screens/main/help-center';
import EditProfile from './app/screens/tabs/EditProfile';
import AddChild from './app/screens/tabs/AddChild';
import Notifications from './app/screens/tabs/Notifications';
import Subscription from './app/screens/tabs/Subscription';
import PrivacySecurity from './app/screens/tabs/PrivacySecurity';
import AboutNeev from './app/screens/tabs/AboutNeev';
import PersonalInfo from './app/screens/tabs/PersonalInfo';
import ChildProfile from './app/screens/tabs/ChildProfile';

const Stack = createNativeStackNavigator();

const AppContent = () => {
  const { user } = useAuth();
  const hasInitializedNotifications = useRef(false);

  useEffect(() => {
    if (!user) return;

    const initNotifications = async () => {
      try {
        // Only run once per session to avoid excessive native calls
        if (hasInitializedNotifications.current) return;
        hasInitializedNotifications.current = true;

        const permission = await NotificationService.requestPermission();
        // Even if permission is not granted, we create channels for later
        await NotificationService.createChannels();

        // Schedule in background without awaiting every single one to speed up app load
        NotificationService.scheduleMorningCheckin();
        NotificationService.scheduleEveningCheckin();
        NotificationService.scheduleWeeklySummary();

        if ((user as any).preferred_activity_time) {
          NotificationService.scheduleActivityReminder((user as any).preferred_activity_time);
        }
      } catch (e) {
        console.error('Notification Init Error:', e);
      }
    };

    initNotifications();
  }, [user]);

  useEffect(() => {
    return notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.PRESS:
          console.log('User pressed notification', detail.notification);
          break;
      }
    });
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right'
        }}
      >
        <Stack.Screen name="Landing" component={Landing} />
        <Stack.Screen name="LampScreen" component={LampScreen} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Plan" component={Plan} />
        <Stack.Screen name="Insights" component={Insights} />
        <Stack.Screen name="Health" component={Health} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="AIChat" component={AIChat} />
        <Stack.Screen name="ActivityGuidance" component={ActivityGuidance} />
        <Stack.Screen name="PulseScreen" component={PulseScreen} />
        <Stack.Screen name="AgeGuide" component={AgeGuide} />
        <Stack.Screen name="HelpCenter" component={HelpCenter} />
        <Stack.Screen name="PersonalInfo" component={PersonalInfo} />
        <Stack.Screen name="ChildProfile" component={ChildProfile} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
        <Stack.Screen name="AddChild" component={AddChild} />
        <Stack.Screen name="Notifications" component={Notifications} />
        <Stack.Screen name="Subscription" component={Subscription} />
        <Stack.Screen name="PrivacySecurity" component={PrivacySecurity} />
        <Stack.Screen name="AboutNeev" component={AboutNeev} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
