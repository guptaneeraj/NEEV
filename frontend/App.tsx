import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './app/contexts/AuthContext';

// Import Journey Screens
import Landing from './app/screens/Landing';
import Login from './app/(auth)/login';
import Register from './app/(auth)/register';
import RegisterDetails from './app/(auth)/register-details';
import Home from './app/(tabs)/dashboard';
import Plan from './app/(main)/plan';
import Insights from './app/(main)/insights';
import Health from './app/(tabs)/health';
import Profile from './app/(tabs)/profile';
import AIChat from './app/(main)/ai-chat';
import ActivityGuidance from './app/(main)/activity-guidance';

const Stack = createNativeStackNavigator();

const AppContent = () => {
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
        <Stack.Screen name="RegisterDetails" component={RegisterDetails} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Plan" component={Plan} />
        <Stack.Screen name="Insights" component={Insights} />
        <Stack.Screen name="Health" component={Health} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="AIChat" component={AIChat} />
        <Stack.Screen name="ActivityGuidance" component={ActivityGuidance} />
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
