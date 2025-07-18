import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, Text, StyleSheet } from 'react-native'; // Import these for custom tab bar icons

// Import all your screens
import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import RankingScreen from '../screens/RankingScreen';
import AccountScreen from '../screens/AccountScreen';
import StartersScreen from '../screens/StartersScreen';
import UnitsScreen from '../screens/UnitsScreen';
import IntroScreen from '../screens/IntroScreen';
import TestScreen from '../screens/TestScreen';
import DetailTestScreen from '../screens/DetailTestScreen';
import QuestionsScreen from '../screens/QuestionsScreen';
import ResultScreen from '../screens/ResultScreen';
import DragAndDropScreen from '../screens/DragAndDropScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AdminScreen from '../screens/admin/AdminScreen';
import LevelScreen from '../screens/admin/LevelScreen';
import UnitScreen from '../screens/admin/UnitScreen';
import QuestionTypeScreen from '../screens/admin/QuestionTypeScreen';
import QuestionListScreen from '../screens/admin/QuestionListScreen';
import EditQuestionScreen from '../screens/admin/EditQuestionScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen.js';
import TestSelectorScreen from '../screens/admin/TestSelectorScreen';
import TestADScreen from '../screens/admin/TestADScreen';
import ContactSupportScreen from '../screens/ContactSupportScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Styles for the Bottom Tab Navigator
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
    // Adjust tabBarLabel style to move it up (closer to icon) or remove marginTop if you want default spacing
    tabBarLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 5, // Adjusted from -30 to a positive value for better visibility/default behavior
    },
    tabBarItemContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 5, // Add padding to push content down from top of tab bar area
    }
});

// MainTabNavigator component encapsulates the bottom tabs
const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            initialRouteName="HomeTab"
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused }) => {
                    let iconSource;
                    let labelText; // Use a specific variable for label text
                    const iconSize = 28;

                    if (route.name === 'HomeTab') {
                        iconSource = focused
                            ? require('../images/tabbar/homeblue-icon.png')
                            : require('../images/tabbar/home-icon.png');
                        labelText = 'Trang chủ';
                    } else if (route.name === 'HistoryTab') {
                        iconSource = focused
                            ? require('../images/tabbar/historyblue-icon.png')
                            : require('../images/tabbar/history-icon.png');
                        labelText = 'Lịch sử';
                    } else if (route.name === 'RankingTab') {
                        iconSource = focused
                            ? require('../images/tabbar/rankingblue-icon.png')
                            : require('../images/tabbar/ranking-icon.png');
                        labelText = 'Xếp hạng';
                    } else if (route.name === 'AccountTab') {
                        iconSource = focused
                            ? require('../images/tabbar/accountblue-icon.png')
                            : require('../images/tabbar/account-icon.png');
                        labelText = 'Tài khoản';
                    }

                    return (
                        <Image
                            source={iconSource}
                            style={{
                                width: iconSize,
                                height: iconSize,
                                resizeMode: 'contain',
                                tintColor: focused ? '#1E90FF' : '#555', // Apply tint color directly to image
                            }}
                        />
                        // No need for a separate Text component here, as tabBarLabel handles it
                    );
                },
                tabBarLabel: ({ focused }) => {
                    let labelText;
                    if (route.name === 'HomeTab') {
                        labelText = 'Trang chủ';
                    } else if (route.name === 'HistoryTab') {
                        labelText = 'Lịch sử';
                    } else if (route.name === 'RankingTab') {
                        labelText = 'Xếp hạng';
                    } else if (route.name === 'AccountTab') {
                        labelText = 'Tài khoản';
                    }
                    return (
                        <Text style={[tabStyles.tabBarLabel, { color: focused ? '#1E90FF' : '#555' }]}>
                            {labelText}
                        </Text>
                    );
                },
                tabBarShowLabel: true, // Make sure labels are shown
                tabBarStyle: tabStyles.tabBar,
                headerShown: false, // Hide header for screens within the tab navigator
            })}
        >
            <Tab.Screen name="HomeTab" component={HomeScreen} />
            <Tab.Screen name="HistoryTab" component={HistoryScreen} />
            <Tab.Screen name="RankingTab" component={RankingScreen} />
            <Tab.Screen name="AccountTab" component={AccountScreen} />
        </Tab.Navigator>
    );
};

// AppNavigator is the main Stack Navigator that wraps everything
const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="IntroScreen">
                {/* Authentication and Intro Screens */}
                <Stack.Screen name="IntroScreen" component={IntroScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} options={{ headerShown: false }} />


                {/* Main application tabs */}
                <Stack.Screen
                    name="MainTabs"
                    component={MainTabNavigator} // This is where your tabs are integrated
                    options={{ headerShown: false }}
                />

                {/* Screens accessible from tabs or other flows (not part of the bottom tabs) */}
                <Stack.Screen name="Starters" component={StartersScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Units" component={UnitsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="TestScreen" component={TestScreen} options={{ headerShown: false }} />
                <Stack.Screen name="DetailTest" component={DetailTestScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Questions" component={QuestionsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Result" component={ResultScreen} options={{ headerShown: false }} />
                <Stack.Screen name="DragAndDrop" component={DragAndDropScreen} options={{ headerShown: false }} />
                <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} options={{ headerShown: false }} />
                <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} options={{ headerShown: false }} />
                <Stack.Screen name="ContactSupportScreen" component={ContactSupportScreen} options={{ headerShown: false }} />


                {/* Admin Screens (if applicable, separate them logically) */}
                <Stack.Screen name="AdminScreen" component={AdminScreen} options={{ headerShown: false }} />
                <Stack.Screen name="LevelScreen" component={LevelScreen} options={{ headerShown: false }} />
                <Stack.Screen name="UnitScreen" component={UnitScreen} options={{ headerShown: false }} />
                <Stack.Screen name="QuestionTypeScreen" component={QuestionTypeScreen} options={{ headerShown: false }} />
                <Stack.Screen name="QuestionListScreen" component={QuestionListScreen} options={{ headerShown: false }} />
                <Stack.Screen name="EditQuestionScreen" component={EditQuestionScreen} options={{ headerShown: false }} />
                <Stack.Screen name="UserManagementScreen" component={UserManagementScreen} options={{ headerShown: false }} />
                <Stack.Screen name="TestSelectorScreen" component={TestSelectorScreen} options={{ headerShown: false }} />
                <Stack.Screen name="TestADScreen" component={TestADScreen} options={{ headerShown: false }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;