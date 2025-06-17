import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Dimensions,
  Platform,
  StatusBar,
  BackHandler,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiCall } from '../utils/api';
import CustomAlertDialog from '../components/CustomAlertDialog';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const { width, height } = Dimensions.get('window');

const RegisterScreen = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertOnConfirm, setAlertOnConfirm] = useState(() => () => {});
  const [alertOnCancel, setAlertOnCancel] = useState(() => () => {});
  const [alertConfirmText, setAlertConfirmText] = useState('OK');
  const [alertCancelText, setAlertCancelText] = useState('Hủy');
  const [showAlertCancelButton, setShowAlertCancelButton] = useState(true);

  const showCustomAlert = (
    title,
    message,
    confirmAction = () => setIsAlertVisible(false),
    cancelAction = null,
    confirmBtnText = 'OK',
    cancelBtnText = 'Hủy',
    shouldShowCancelButton = true
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOnConfirm(() => confirmAction);
    setAlertOnCancel(() => (cancelAction ? cancelAction : () => setIsAlertVisible(false)));
    setAlertConfirmText(confirmBtnText);
    setAlertCancelText(cancelBtnText);
    setShowAlertCancelButton(shouldShowCancelButton);
    setIsAlertVisible(true);
  };

  useEffect(() => {
    const backAction = () => {
      navigation.popToTop();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [navigation]);

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      showCustomAlert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (password !== confirmPassword) {
      showCustomAlert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);

    try {
      console.log('Sending registration request:', { username, email, password });
      const response = await apiCall('POST', '/register', { username, email, password });
      console.log('Server response:', response);

      if (response.ok) {
        showCustomAlert(
          'Thành công',
          response.data.message || 'Đăng ký thành công!',
          () => {
            setIsAlertVisible(false);
            navigation.replace('Login');
          },
          null,
          'OK',
          'Hủy',
          false
        );
      } else {
        const errorMessage = response.data?.error || 'Đăng ký thất bại';
        showCustomAlert('Lỗi', errorMessage);
      }
    } catch (error) {
      console.error('Error calling register API:', error.message);
      showCustomAlert('Lỗi', 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#e0e8ff" />
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={Platform.OS === 'ios' ? 80 : 100} // Điều chỉnh khoảng cách giữa input và bàn phím
        enableOnAndroid={true}
        enableAutomaticScroll={(event) => {
          scrollViewRef.current?.scrollToFocusedInput(ReactNative.findNodeHandle(event.target));
        }}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.popToTop()}>
          <Image source={require('../images/login_signup/back.png')} style={styles.backIcon} />
        </TouchableOpacity>

        {/* Di chuyển logoContainer vào trong luồng cuộn */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../images/login_signup/logo.png')}
            style={styles.logo}
            onError={(e) => console.log('Error loading logo:', e.nativeEvent.error)}
          />
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.loginTitle}>Register</Text>

          <Text style={styles.inputLabel}>Username</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={usernameRef}
              style={styles.input}
              placeholder="Your username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholderTextColor="#a0a0a0"
              onFocus={() => {
                scrollViewRef.current?.scrollToFocusedInput(ReactNative.findNodeHandle(usernameRef.current));
              }}
            />
          </View>

          <Text style={styles.inputLabel}>Email address</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={emailRef}
              style={styles.input}
              placeholder="Your email address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#a0a0a0"
              onFocus={() => {
                scrollViewRef.current?.scrollToFocusedInput(ReactNative.findNodeHandle(emailRef.current));
              }}
            />
          </View>

          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#a0a0a0"
              onFocus={() => {
                scrollViewRef.current?.scrollToFocusedInput(ReactNative.findNodeHandle(passwordRef.current));
              }}
            />
            <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPassword(!showPassword)}>
              <Image
                source={
                  showPassword
                    ? require('../images/login_signup/eye_1.png')
                    : require('../images/login_signup/eye_2.png')
                }
                style={styles.toggleIcon}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Confirm Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={confirmPasswordRef}
              style={styles.input}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              placeholderTextColor="#a0a0a0"
              onFocus={() => {
                scrollViewRef.current?.scrollToFocusedInput(ReactNative.findNodeHandle(confirmPasswordRef.current));
              }}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Image
                source={
                  showConfirmPassword
                    ? require('../images/login_signup/eye_1.png')
                    : require('../images/login_signup/eye_2.png')
                }
                style={styles.toggleIcon}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Register</Text>}
          </TouchableOpacity>

          <View style={styles.signUpContainer}>
            <Text style={styles.dontHaveAccountText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.replace('Login')}>
              <Text style={styles.signupText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>

        <CustomAlertDialog
          isVisible={isAlertVisible}
          title={alertTitle}
          message={alertMessage}
          onConfirm={alertOnConfirm}
          onCancel={alertOnCancel}
          confirmText={alertConfirmText}
          cancelText={alertCancelText}
          showCancelButton={showAlertCancelButton}
        />
      </KeyboardAwareScrollView>
    </View>
  );
};

// Lưu ý: Cần import ReactNative để sử dụng findNodeHandle
const ReactNative = require('react-native');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0e8ff',
    paddingTop: Platform.OS === 'ios' ? StatusBar.currentHeight || 0 : 0,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: height * 0.08, // Thay thế vị trí absolute của logo
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
    resizeMode: 'contain',
  },
  logoContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#fff',
    borderColor: '#f0f0f0',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20, // Khoảng cách dưới logo
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
  },
  formContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 25,
    paddingTop: 20, // Giảm paddingTop vì logo đã nằm trong luồng
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    paddingBottom: 60,
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
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
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
  signUpContainer: {
    marginTop: 20,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  dontHaveAccountText: {
    fontSize: 15,
    color: '#666',
  },
  signupText: {
    fontSize: 15,
    color: '#ff5c5c',
    fontWeight: 'bold',
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});

export default RegisterScreen;