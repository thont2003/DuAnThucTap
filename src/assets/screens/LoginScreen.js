import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Image,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiCall } from '../utils/api';
import CustomAlertDialog from '../components/CustomAlertDialog'; // Import CustomAlertDialog


const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const navigation = useNavigation();

        // State cho Custom Alert
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertOnConfirm, setAlertOnConfirm] = useState(() => () => {});
    const [alertOnCancel, setAlertOnCancel] = useState(() => () => {});
    const [alertConfirmText, setAlertConfirmText] = useState('OK');
    const [alertCancelText, setAlertCancelText] = useState('Hủy');
    const [showAlertCancelButton, setShowAlertCancelButton] = useState(true); // State mới cho nút hủy


    // Hàm hiển thị Custom Alert
    const showCustomAlert = (
        title,
        message,
        confirmAction = () => setIsAlertVisible(false),
        cancelAction = null,
        confirmBtnText = 'OK',
        cancelBtnText = 'Hủy',
        shouldShowCancelButton = true // Mặc định là true
    ) => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertOnConfirm(() => confirmAction);
        setAlertOnCancel(() => cancelAction ? cancelAction : () => setIsAlertVisible(false));
        setAlertConfirmText(confirmBtnText);
        setAlertCancelText(cancelBtnText);
        setShowAlertCancelButton(shouldShowCancelButton);
        setIsAlertVisible(true);
    };

    const handleLogin = async () => {
        if (!email || !password) {
            showCustomAlert('Lỗi', 'Vui lòng nhập email và mật khẩu'); // Sử dụng Custom Alert
            return;
        }

        setLoading(true);
        setMessage('');
        try {
            console.log('Sending login request:', { email, password });
            const response = await apiCall('POST', '/login', { email, password });
            console.log('Server response:', response);

            if (response.ok) {
                // Lấy cả 'role' từ phản hồi của server
                const { message, username: usernameFromApi, role } = response.data;
                const finalUsername = usernameFromApi || email.split('@')[0];

                // Logic phân quyền đăng nhập
                if (role === 'admin') {
                    showCustomAlert(
                        'Thành công',
                        message || 'Đăng nhập thành công với quyền Admin!',
                        () => {
                            setIsAlertVisible(false); // Đóng alert
                            navigation.navigate('AdminScreen', { username: finalUsername }); // Điều hướng đến AdminScreen
                        },
                        null,
                        'OK',
                        'Hủy',
                        false
                    );
                } else if (role === 'user') {
                    showCustomAlert(
                        'Thành công',
                        message || 'Đăng nhập thành công!',
                        () => {
                            setIsAlertVisible(false); // Đóng alert
                            navigation.navigate('MainTabs', {
                                screen: 'HomeTab', // Tên màn hình của tab Home trong AppNavigator.js
                                params: { username: finalUsername } // Các tham số vẫn được truyền cho màn hình HomeTab
                            }); // Điều hướng đến MainTabs (HomeTab)
                        },
                        null,
                        'OK',
                        'Hủy',
                        false
                    );
                } else {
                    // Trường hợp role không xác định hoặc không hợp lệ
                    const errorMessage = 'Tài khoản của bạn không có quyền truy cập hoặc vai trò không hợp lệ.';
                    setMessage(errorMessage);
                    showCustomAlert('Lỗi', errorMessage);
                }

            } else {
                // Xử lý lỗi từ server (ví dụ: email/mật khẩu sai)
                const errorMessage = response.data?.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.';
                setMessage(errorMessage);
                showCustomAlert('Lỗi', errorMessage);
            }
        }
        catch (error) {
            console.error('Error calling login API:', error.message);
            setMessage('Cannot connect to server. Please check connection and try again.');
            showCustomAlert('Lỗi', 'Cannot connect to server. Please check connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar
                barStyle="dark-content"
                backgroundColor="#e0e8ff"
            />
            <ScrollView
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps="handled"
            >
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Image
                        source={require('../images/login_signup/back.png')}
                        style={styles.backIcon}
                    />
                </TouchableOpacity>

                <View style={styles.logoContainer}>
                    <Image
                        source={require('../images/login_signup/logo.png')}
                        style={styles.logo}
                        onError={(e) => console.log('Error loading logo:', e.nativeEvent.error)}
                    />
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.loginTitle}>Login</Text>

                    <Text style={styles.inputLabel}>Email address</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Your email address"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            placeholderTextColor="#a0a0a0"
                        />
                    </View>

                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            placeholderTextColor="#a0a0a0"
                        />
                        <TouchableOpacity
                            style={styles.passwordToggle}
                            onPress={() => setShowPassword(!showPassword)}
                        >
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

                    <View style={styles.optionsContainer}>
                        <TouchableOpacity style={styles.rememberMeContainer} onPress={() => setRememberMe(!rememberMe)}>
                            {rememberMe ? (
                                <Image
                                    source={require('../images/login_signup/checkbox.png')}
                                    style={styles.checkboxIcon}
                                />
                            ) : (
                                <Image
                                    source={require('../images/login_signup/uncheckbox.png')}
                                    style={styles.checkboxIcon}
                                />
                            )}
                            <Text style={styles.rememberMeText}>Remember me</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => showCustomAlert('Forgot password pressed')}>
                            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>Login</Text>
                        )}
                    </TouchableOpacity>

                    {message ? <Text style={styles.message}>{message}</Text> : null}

                    <View style={styles.signUpContainer}>
                        <Text style={styles.dontHaveAccountText}>
                            Don't have an account?{' '}
                        </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.signupText}>Signup</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

             {/* Custom Alert Dialog */}
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
        </KeyboardAvoidingView>
    );
};

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
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: '#fff',
        borderColor: '#f0f0f0',
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: height * 0.08,
        left: '50%',
        marginLeft: -120,
        zIndex: 5,
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
        paddingTop: 150,
        alignItems: 'center',
        marginTop: height * 0.22,
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
    optionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 30,
        alignItems: 'center',
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkboxIcon: {
        width: 24,
        height: 24,
        marginRight: 8,
        resizeMode: 'contain',
        tintColor: '#ff5c5c',
    },
    rememberMeText: {
        fontSize: 15,
        color: '#666',
    },
    forgotPasswordText: {
        fontSize: 15,
        color: '#ff5c5c',
        fontWeight: '600',
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
        marginTop: 100,
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

export default LoginScreen;