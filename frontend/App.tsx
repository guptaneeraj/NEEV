import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './app/contexts/AuthContext';
import { NotificationService } from './services/NotificationService';

// Import Journey Screens from consolidated screens folder
import Landing from './app/screens/Landing';
import Login from './app/screens/auth/Login';
import Register from './app/screens/auth/Register';
import Home from './app/screens/tabs/Dashboard';
import Plan from './app/screens/main/plan';
import Insights from './app/screens/main/insights';
import Health from './app/screens/tabs/Health';
import Profile from './app/screens/tabs/Profile';
import AIChat from './app/screens/main/ai-chat';
import ActivityGuidance from './app/screens/main/activity-guidance';
import AgeGuide from './app/screens/main/AgeGuide';
import HelpCenter from './app/screens/main/help-center';

const Stack = createNativeStackNavigator();

const AppContent = () => {
  const { user } = useAuth();
  const hasInitializedNotifications = useRef(false);

  useEffect(() => {
    const initNotifications = async () => {
      // Only initialize once per user login/session to avoid excessive callbacks
      if (hasInitializedNotifications.current || !user) return;

      try {
        await NotificationService.requestPermission();
        await NotificationService.createChannels();
        await NotificationService.scheduleMorningCheckin();
        await NotificationService.scheduleEveningCheckin();
        await NotificationService.scheduleWeeklySummary();

        if ((user as any).preferred_activity_time) {
          await NotificationService.scheduleActivityReminder((user as any).preferred_activity_time);
        }

        hasInitializedNotifications.current = true;
      } catch (e) {
        console.error('Notification Init Error:', e);
      }
    };

    initNotifications();
  }, [user]);

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
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Plan" component={Plan} />
        <Stack.Screen name="Insights" component={Insights} />
        <Stack.Screen name="Health" component={Health} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="AIChat" component={AIChat} />
        <Stack.Screen name="ActivityGuidance" component={ActivityGuidance} />
        <Stack.Screen name="AgeGuide" component={AgeGuide} />
        <Stack.Screen name="HelpCenter" component={HelpCenter} />
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
