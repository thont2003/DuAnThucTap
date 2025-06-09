import React, { useState } from 'react'; // Import useState
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomAlertDialog from '../components/CustomAlertDialog'; // Import CustomAlertDialog

const AccountScreen = () => {
  const navigation = useNavigation();
  const [isLogoutAlertVisible, setLogoutAlertVisible] = useState(false); // State để quản lý hiển thị alert

  const handlePressPersonalInfo = () => {
    navigation.navigate('EditProfileScreen');
  };

  const handlePressOtherOption = (optionName) => {
    console.log(`Pressed: ${optionName}`);
  };

  const confirmLogout = async () => {
    setLogoutAlertVisible(false); // Đóng alert trước khi thực hiện logout
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
      console.log('Đã xóa thông tin đăng nhập khỏi AsyncStorage.');
      navigation.reset({
        index: 0,
        routes: [{ name: 'IntroScreen' }], // Thay 'Login' bằng tên màn hình đăng nhập của bạn
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tài khoản</Text>
      </View>

      {/* User Info Section */}
      <View style={styles.userInfoContainer}>
        <View style={styles.profileIconContainer}>
          <Image
            source={require('../images/profile/avatar.png')}
            style={styles.profileIcon}
          />
        </View>
        <Text style={styles.userName}>lê thanh tùng</Text>
        <Text style={styles.userEmail}>lethanhtung0234@gmail.com</Text>
      </View>

      {/* Options List */}
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

        {/* Nút Đăng xuất - Mở Custom Alert */}
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

      {/* Custom Logout Alert */}
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
    width: 120,
    height: 120,
    borderRadius: 50,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileIcon: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
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
