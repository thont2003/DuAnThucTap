import React, { useState, useEffect } from 'react'; // Import useEffect
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
    BackHandler, // Import BackHandler
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiCall } from '../utils/api';
import CustomAlertDialog from '../components/CustomAlertDialog'; // Import CustomAlertDialog

const { width, height } = Dimensions.get('window');

const RegisterScreen = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    // Thêm showCancelButton vào tham số
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
        setShowAlertCancelButton(shouldShowCancelButton); // Cập nhật state này
        setIsAlertVisible(true);
    };

    // useEffect để xử lý nút back cứng trên Android
    useEffect(() => {
        const backAction = () => {
            navigation.navigate('IntroScreen'); // Điều hướng về IntroScreen
            return true; // Trả về true để ngăn hành vi mặc định của nút back
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove(); // Hủy đăng ký listener khi component unmount
    }, [navigation]); // Dependency array: chỉ chạy lại effect khi navigation thay đổi

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
        setMessage('');

        try {
            console.log('Sending registration request:', { username, email, password });
            const response = await apiCall('POST', '/register', { username, email, password });
            console.log('Server response:', response);

            if (response.ok) {
                showCustomAlert(
                    'Thành công',
                    response.data.message || 'Đăng ký thành công!',
                    () => {
                        setIsAlertVisible(false); // Đóng alert
                        navigation.navigate('Login'); // Điều hướng
                    },
                    null, // Không có hàm cancel đặc biệt cho trường hợp này
                    'OK', // Nút chỉ là 'OK'
                    'Hủy', // Văn bản này không dùng vì nút hủy không hiển thị
                    false // Rất quan trọng: Không hiển thị nút Hủy
                );
            } else {
                const errorMessage = response.data?.error || 'Đăng ký thất bại';
                setMessage(errorMessage);
                showCustomAlert('Lỗi', errorMessage); // Mặc định vẫn có nút hủy nếu là lỗi
            }
        } catch (error) {
            console.error('Error calling register API:', error.message);
            setMessage('Cannot connect to server. Please check connection and try again.');
            showCustomAlert('Lỗi', 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối.');
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
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('IntroScreen')}>
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
                    <Text style={styles.loginTitle}>Register</Text>

                    <Text style={styles.inputLabel}>Username</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Your username"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            placeholderTextColor="#a0a0a0"
                        />
                    </View>

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

                    <Text style={styles.inputLabel}>Confirm Password</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            placeholderTextColor="#a0a0a0"
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

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>Register</Text>
                        )}
                    </TouchableOpacity>

                    {message ? <Text style={styles.message}>{message}</Text> : null}

                    <View style={styles.signUpContainer}>
                        <Text style={styles.dontHaveAccountText}>
                            Already have an account?{' '}
                        </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.signupText}>Login</Text>
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
                showCancelButton={showAlertCancelButton} // Truyền prop này vào
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
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: '#fff',
        borderColor: '#f0f0f0',
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: height * 0.08,
        left: '50%',
        marginLeft: -90,
        zIndex: 5,
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
        paddingTop: 80,
        alignItems: 'center',
        marginTop: height * 0.19,
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
        marginTop: 60,
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
