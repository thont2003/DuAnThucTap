import React, { useState, useEffect } from 'react'; // Import useEffect
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native'; // Import useIsFocused
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomAlertDialog from '../components/CustomAlertDialog';
import { BASE_URL } from '../utils/constants';

const AccountScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused(); // Hook để kiểm tra khi màn hình được focus
  const [isLogoutAlertVisible, setLogoutAlertVisible] = useState(false);
  const [userInfo, setUserInfo] = useState({ username: '', email: '', profileImageUrl: '' }); // State để lưu thông tin người dùng

  // Hàm để tải thông tin người dùng từ AsyncStorage
  const loadUserInfo = async () => {
    try {
      const storedUserInfo = await AsyncStorage.getItem('userInfo');
      if (storedUserInfo) {
        const parsed = JSON.parse(storedUserInfo);
        setUserInfo({
          username: parsed.username || '',
          email: parsed.email || '',
          profileImageUrl: parsed.profileImageUrl || '',
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin người dùng:', error);
    }
  };

  useEffect(() => {
    // Tải thông tin người dùng khi màn hình được focus (hoặc khởi tạo lần đầu)
    if (isFocused) {
      loadUserInfo();
    }
  }, [isFocused]); // Chạy lại khi isFocused thay đổi

  const handlePressPersonalInfo = () => {
    navigation.navigate('EditProfileScreen');
  };

  const handlePressOtherOption = (optionName) => {
    console.log(`Pressed: ${optionName}`);
  };

  const confirmLogout = async () => {
    setLogoutAlertVisible(false);
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo'); // Xóa cả userInfo khi đăng xuất
      console.log('Đã xóa thông tin đăng nhập khỏi AsyncStorage.');
      navigation.reset({
        index: 0,
        routes: [{ name: 'IntroScreen' }],
      });
      // Có thể thêm thông báo toast hoặc snackbar thay vì Alert.alert() mặc định
      // Ví dụ: ToastAndroid.show('Bạn đã đăng xuất thành công!', ToastAndroid.SHORT);
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      // Có thể hiển thị một Custom Alert khác cho lỗi
      // setLogoutErrorAlertVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tài khoản</Text>
      </View>

      
      <View style={styles.userInfoContainer}>
        <View style={styles.profileIconContainer}>
          <Image
            source={
              userInfo.profileImageUrl
                ? { uri: `${BASE_URL}${userInfo.profileImageUrl}` }
                : require('../images/profile/avatar.png')
            }
            style={styles.profileIcon}
          />
        </View>
        <Text style={styles.userName}>{userInfo.username || 'Người dùng'}</Text>
        <Text style={styles.userEmail}>{userInfo.email || 'email@example.com'}</Text>
      </View>

      
      <ScrollView style={styles.optionsList}>
        <TouchableOpacity style={styles.optionItem} onPress={handlePressPersonalInfo}>
          <View style={styles.optionIconContainer}>
            <Image
              source={require('../images/profile/user.png')}
              style={styles.optionIcon}
            />
          </View>
          <Text style={styles.optionText}>Thông tin tài khoản</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem} onPress={() => handlePressOtherOption('Đổi mật khẩu')}>
          <View style={styles.optionIconContainer}>
            <Image
              source={require('../images/profile/reset-password.png')}
              style={styles.optionIcon}
            />
          </View>
          <Text style={styles.optionText}>Đổi mật khẩu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem} onPress={() => handlePressOtherOption('Liên hệ/Hỗ trợ')}>
          <View style={styles.optionIconContainer}>
            <Image
              source={require('../images/profile/support.png')}
              style={styles.optionIcon}
            />
          </View>
          <Text style={styles.optionText}>Liên hệ/Hỗ trợ</Text>
        </TouchableOpacity>

        
        <TouchableOpacity style={styles.optionItem} onPress={() => setLogoutAlertVisible(true)}>
          <View style={styles.optionIconContainer}>
            <Image
              source={require('../images/profile/logout.png')}
              style={styles.optionIcon}
            />
          </View>
          <Text style={styles.optionText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>

      
      <CustomAlertDialog
        isVisible={isLogoutAlertVisible}
        title="Đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?"
        onConfirm={confirmLogout}
        onCancel={() => setLogoutAlertVisible(false)}
        confirmText="Đăng xuất"
        cancelText="Hủy"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0e5ff',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userInfoContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 15,
    marginTop: 20,
    paddingVertical: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  profileIconContainer: {
    width: 130,
    height: 130,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileIcon: {
    width: 160,
    height: 160,
    borderRadius: 100,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  optionsList: {
    marginTop: 20,
    maxHeight: 400,
    marginHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 5,
  },
  optionIconContainer: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionIcon: {
    width: 20,
    height: 20,
    tintColor: '#333',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    height: 70,
    alignItems: 'center',
  },
  bottomNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  bottomNavIcon: {
    width: 28,
    height: 28,
    marginBottom: 3,
    resizeMode: 'contain',
  },
  bottomNavText: {
    fontSize: 11,
    color: '#555',
    fontWeight: '600',
  },
});

export default AccountScreen;
