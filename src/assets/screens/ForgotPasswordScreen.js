import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiCall } from '../utils/api';
import CustomAlertDialog from '../components/CustomAlertDialog';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const { width, height } = Dimensions.get('window');

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertOnConfirm, setAlertOnConfirm] = useState(() => () => setIsAlertVisible(false));

  const showCustomAlert = (title, message, confirmAction = () => setIsAlertVisible(false)) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOnConfirm(() => confirmAction);
    setIsAlertVisible(true);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      showCustomAlert('Lỗi', 'Vui lòng nhập email.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiCall('POST', '/api/forgot-password', { email });
      if (response.ok) {
        showCustomAlert('Thành công', response.data.message || 'Mật khẩu mới đã được gửi đến email của bạn.');
      } else {
        showCustomAlert('Lỗi', response.data?.error || 'Không thể xử lý yêu cầu.');
      }
    } catch (error) {
      console.error('Forgot password error:', error.message);
      showCustomAlert('Lỗi', 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#e0e8ff" />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={Platform.OS === 'ios' ? 80 : 0}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image source={require('../images/login_signup/back.png')} style={styles.backIcon} />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Image source={require('../images/login_signup/logo.png')} style={styles.logo} />
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.loginTitle}>Forgot Password</Text>

          <Text style={styles.inputLabel}>Enter your email</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Your email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#a0a0a0"
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleResetPassword} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Send</Text>}
          </TouchableOpacity>
        </View>

        <CustomAlertDialog
          isVisible={isAlertVisible}
          title={alertTitle}
          message={alertMessage}
          onConfirm={alertOnConfirm}
          confirmText="OK"
          showCancelButton={false}
        />
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0e8ff',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: height * 0.08,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 10,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#333',
  },
  logoContainer: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  logo: {
    width: 240,
    height: 240,
    resizeMode: 'contain',
  },
  formContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 25,
    paddingTop: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    paddingBottom: 40,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    alignSelf: 'flex-start',
  },
  inputLabel: {
    alignSelf: 'flex-start',
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  loginButton: {
    width: '100%',
    height: 55,
    backgroundColor: '#ff5c5c',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;
