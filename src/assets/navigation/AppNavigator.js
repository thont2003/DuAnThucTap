import React, { useState, useEffect } from 'react'; // Import useState và useEffect
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, Text } from 'react-native'; // Thêm View, ActivityIndicator, Text
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import StartersScreen from '../screens/StartersScreen';
import HistoryScreen from '../screens/HistoryScreen';
import RankingScreen from '../screens/RankingScreen';
import AccountScreen from '../screens/AccountScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true); // Trạng thái tải
  const [userToken, setUserToken] = useState(null); // Lưu token người dùng

  // Hàm để kiểm tra trạng thái đăng nhập khi ứng dụng khởi động
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        // Cố gắng lấy token từ AsyncStorage
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          setUserToken(token); // Nếu có token, đặt userToken
        } else {
          // Hoặc nếu bạn lưu userId thay vì token, kiểm tra userId
          const userId = await AsyncStorage.getItem('userId');
          if (userId) {
            setUserToken(userId);
          }
        }
      } catch (error) {
        console.error('Lỗi khi đọc dữ liệu từ AsyncStorage:', error);
      } finally {
        setIsLoading(false); // Dù có lỗi hay không, kết thúc trạng thái tải
      }
    };

    loadStoredData(); // Gọi hàm này khi component mount
  }, []); // [] đảm bảo useEffect chỉ chạy một lần

  // Hàm để xử lý đăng xuất (có thể truyền xuống các màn hình như HomeScreen, AccountScreen)
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken'); // Xóa token
      await AsyncStorage.removeItem('userId');    // Xóa userId nếu có
      setUserToken(null); // Đặt lại trạng thái token để quay về màn hình đăng nhập
      console.log('Đã đăng xuất và xóa dữ liệu.');
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
    }
  };

  if (isLoading) {
    // Hiển thị màn hình chờ trong khi kiểm tra trạng thái đăng nhập
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Đang kiểm tra trạng thái đăng nhập...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken ? (
          // Nếu userToken có giá trị (người dùng đã đăng nhập)
          <>
            <Stack.Screen name="Home">
              {/* Truyền handleLogout xuống HomeScreen để xử lý đăng xuất */}
              {props => <HomeScreen {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen name="Starters" component={StartersScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="Ranking" component={RankingScreen} />
            <Stack.Screen name="Account">
               {/* Truyền handleLogout xuống AccountScreen nếu muốn đăng xuất từ đây */}
              {props => <AccountScreen {...props} onLogout={handleLogout} />}
            </Stack.Screen>
          </>
        ) : (
          // Nếu userToken là null (người dùng chưa đăng nhập)
          <>
            <Stack.Screen
              name="Login"
              // Truyền onLoginSuccess xuống LoginScreen
              // Khi LoginScreen đăng nhập thành công, nó sẽ gọi onLoginSuccess(token)
              // để cập nhật userToken ở đây, từ đó chuyển sang Home
              component={props => <LoginScreen {...props} onLoginSuccess={setUserToken} />}
            />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;