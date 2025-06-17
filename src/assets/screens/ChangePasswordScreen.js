// ChangePasswordScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { apiCall } from '../utils/api';
import CustomAlertDialog from '../components/CustomAlertDialog';

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setIsAlertVisible(true);
  };

  const validatePassword = (password) => {
    const lengthValid = password.length >= 8 && password.length <= 50;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    return lengthValid && hasLower && hasUpper && hasDigit;
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showAlert('Lỗi', 'Vui lòng nhập đủ đổi mật khẩu.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('Lỗi', 'Xác nhận mật khẩu không khớp.');
      return;
    }

    if (!validatePassword(newPassword)) {
      showAlert('Lỗi', 'Mật khẩu mới không đáp ứng yêu cầu bảo mật.');
      return;
    }

    setLoading(true);
    try {
      const userInfo = JSON.parse(await AsyncStorage.getItem('userInfo'));
      const userId = userInfo?.userId;
      if (!userId) throw new Error('Thiếu userId');

      const response = await apiCall('PUT', `/api/user/${userId}/change-password`, {
        oldPassword,
        newPassword,
      });

      if (response.ok) {
        showAlert('Thành công', 'Mật khẩu đã được thay đổi.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showAlert('Lỗi', response.data?.error || 'Không thay đổi được mật khẩu.');
      }
    } catch (err) {
      console.error(err);
      showAlert('Lỗi', 'Không kết nối được với server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Image source={require('../images/login_signup/back.png')} style={styles.backIcon} />
            </TouchableOpacity>
            <Text style={styles.title}>Đổi mật khẩu</Text>
        </View>


        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mật khẩu cũ</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              secureTextEntry={!showOld}
              style={styles.input}
              value={oldPassword}
              onChangeText={setOldPassword}
            />
            
            <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowOld(!showOld)}
            >
                <Image
                    source={
                        showOld
                            ? require('../images/login_signup/eye_1.png')
                            : require('../images/login_signup/eye_2.png')
                    }
                    style={styles.toggleIcon}
                />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Mật khẩu</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              secureTextEntry={!showNew}
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowNew(!showNew)}
            >
                <Image
                    source={
                        showNew
                            ? require('../images/login_signup/eye_1.png')
                            : require('../images/login_signup/eye_2.png')
                    }
                    style={styles.toggleIcon}
                />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Xác nhận mật khẩu</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              secureTextEntry={!showConfirm}
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowConfirm(!showConfirm)}
            >
                <Image
                    source={
                        showConfirm
                            ? require('../images/login_signup/eye_1.png')
                            : require('../images/login_signup/eye_2.png')
                    }
                    style={styles.toggleIcon}
                />
            </TouchableOpacity>
          </View>

          <View style={styles.rulesContainer}>
            <Text style={styles.rule}>✓ Mật khẩu trong khoảng 8-50 ký tự</Text>
            <Text style={styles.rule}>✓ Mật khẩu không được trùng số điện thoại/username</Text>
            <Text style={styles.rule}>✓ Phải có chữ thường, chữ hoa, và số</Text>
          </View>
        </View>

            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.saveButton, loading && { opacity: 0.5 }]}
                    onPress={handleChangePassword} 
                    disabled={loading}
                >
                <Text style={styles.saveButtonText}>{loading ? 'Đang lưu...' : 'Sửa'}</Text>
                </TouchableOpacity>
            </View>

      <CustomAlertDialog
        isVisible={isAlertVisible}
        title={alertTitle}
        message={alertMessage}
        onConfirm={() => setIsAlertVisible(false)}
        confirmText="OK"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
    header: {
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingHorizontal: 15,
        paddingTop: 50,
        paddingBottom: 15,
        zIndex: 1000,
        elevation: 10,
    },
  title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
  },
  inputGroup: {
        flex: 1,
        margin: 20,
        marginTop: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#CCC',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 60,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
  },
    passwordToggle: {
        padding: 5,
    },
    toggleIcon: {
        width: 20,
        height: 20,
        tintColor: '#000',
        resizeMode: 'contain',
    },
  rulesContainer: {
    marginBottom: 20,
  },
  rule: {
    fontSize: 13,
    color: '#444',
    marginBottom: 5,
  },
    footer: {
        height: 100,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        zIndex: 1000,
        elevation: 10,
    },
    saveButton: {
        backgroundColor: '#007AFF',
        borderRadius: 10,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#333',
  },
});

export default ChangePasswordScreen;
