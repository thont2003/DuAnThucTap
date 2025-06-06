import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import StartersScreen from '../screens/StartersScreen';
import HistoryScreen from '../screens/HistoryScreen';
import RankingScreen from '../screens/RankingScreen';
import AccountScreen from '../screens/AccountScreen';
import UnitsScreen from '../screens/UnitsScreen';
import IntroScreen from '../screens/IntroScreen';
import TestScreen from '../screens/TestScreen'; // <-- THÊM DÒNG NÀY
import DetailTestScreen from '../screens/DetailTestScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="IntroScreen">
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="IntroScreen"
          component={IntroScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Starters"
          component={StartersScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Ranking"
          component={RankingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Units"
          component={UnitsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Account"
          component={AccountScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen // <-- THÊM KHỐI NÀY
          name="TestScreen" // Đảm bảo tên này khớp chính xác với tên bạn gọi trong navigation.navigate()
          component={TestScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DetailTest"
          component={DetailTestScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;