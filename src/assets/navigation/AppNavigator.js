// AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; // Import this
import { Image, Text, StyleSheet } from 'react-native'; // Import these for custom tab bar icons

// Import all your screens
import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen'; // This will be part of the tabs
import HistoryScreen from '../screens/HistoryScreen'; // This will be part of the tabs
import RankingScreen from '../screens/RankingScreen'; // This will be part of the tabs
import AccountScreen from '../screens/AccountScreen'; // This will be part of the tabs
import StartersScreen from '../screens/StartersScreen';
import UnitsScreen from '../screens/UnitsScreen';
import IntroScreen from '../screens/IntroScreen';
import TestScreen from '../screens/TestScreen';
import DetailTestScreen from '../screens/DetailTestScreen';
import QuestionsScreen from '../screens/QuestionsScreen';
import ResultScreen from '../screens/ResultScreen';
import DragAndDropScreen from '../screens/DragAndDropScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator(); // Define Tab navigator here

// Styles for the Bottom Tab Navigator (can be defined directly or in a separate stylesheet)
const tabStyles = StyleSheet.create({
    tabBar: {
        height: 70,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        backgroundColor: '#FFFFFF',
    },
    tabBarLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: -30,
    },
});

// Define the MainTabNavigator component directly inside AppNavigator.js
const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            initialRouteName="HomeTab"
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused }) => {
                    let iconSource;
                    let label;
                    const iconSize = 28;

                    if (route.name === 'HomeTab') {
                        iconSource = focused 
                          ? require('../images/homeblue-icon.png') 
                          : require('../images/home-icon.png');
                        
                    } else if (route.name === 'HistoryTab') {
                        iconSource = focused 
                            ? require('../images/historyblue-icon.png') 
                            : require('../images/history-icon.png');
                        
                    } else if (route.name === 'RankingTab') {
                        iconSource = focused 
                            ? require('../images/rankingblue-icon.png') 
                            : require('../images/ranking-icon.png');
                        
                    } else if (route.name === 'AccountTab') {
                        iconSource = focused 
                            ? require('../images/accountblue-icon.png') 
                            : require('../images/account-icon.png');
                    }

                    return (
                        <>
                            <Image source={iconSource} style={{ width: iconSize, height: iconSize, resizeMode: 'contain' }} />
                            <Text style={[tabStyles.tabBarLabel, { color: focused ? '#1E90FF' : '#555' }]}>
                                {label}
                            </Text>
                        </>
                    );
                },
                tabBarShowLabel: false,
                tabBarStyle: tabStyles.tabBar,
                headerShown: false,
            })}
        >
            <Tab.Screen name="HomeTab" component={HomeScreen} />
            <Tab.Screen name="HistoryTab" component={HistoryScreen} />
            <Tab.Screen name="RankingTab" component={RankingScreen} />
            <Tab.Screen name="AccountTab" component={AccountScreen} />
        </Tab.Navigator>
    );
};

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
                {/* Integrate MainTabNavigator here */}
                <Stack.Screen
                    name="MainTabs"
                    component={MainTabNavigator} // Use the defined component here
                    options={{ headerShown: false }}
                />
                {/* Screens that are not part of the bottom tabs */}
                <Stack.Screen
                    name="Starters"
                    component={StartersScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Units"
                    component={UnitsScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="TestScreen"
                    component={TestScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="DetailTest"
                    component={DetailTestScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Questions"
                    component={QuestionsScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Result"
                    component={ResultScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="DragAndDrop"
                    component={DragAndDropScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="EditProfileScreen"
                  component={EditProfileScreen}
                  options={{ headerShown: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;