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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiCall } from '../utils/api';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const navigation = useNavigation();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            console.log('Đang gửi yêu cầu đăng nhập:', { email, password });
            const response = await apiCall('POST', '/login', { email, password });
            console.log('Phản hồi từ server:', response);

            if (response.ok) {
                const { message } = response.data;
                const username = email.split('@')[0];

                Alert.alert('Thành công', message || 'Đăng nhập thành công!');
                navigation.navigate('Home', { username });
            } else {
                const errorMessage = response.data?.error || 'Đăng nhập thất bại';
                setMessage(errorMessage);
                Alert.alert('Lỗi', errorMessage);
            }
        } catch (error) {
            console.error('Lỗi khi gọi API đăng nhập:', error.message);
            setMessage('Không thể kết nối đến server. Vui lòng kiểm tra kết nối và thử lại.');
            Alert.alert('Lỗi', 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối và thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Top Section with Background Image */}
                <View style={styles.topSection}>
                    <Image
                        source={require('../images/banner.png')}
                        style={styles.topBackgroundImage}
                    />
                </View>

                {/* Logo Container - MOVED OUTSIDE formContainer to fix positioning */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../images/avatar.png')}
                        style={styles.logo}
                        onError={(e) => console.log('Lỗi tải logo:', e.nativeEvent.error)}
                    />
                </View>

                {/* Login Form */}
                <View style={styles.formContainer}>
                    {/* Email Input */}
                    <Text style={styles.inputLabel}>Email</Text>
                    <View style={styles.inputWrapper}>
                        <Image
                            source={require('../images/home-icon.png')} // Changed to email specific icon
                            style={styles.inputIcon}
                            onError={(e) => console.log('Lỗi tải icon email:', e.nativeEvent.error)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            placeholderTextColor="#a0a0a0"
                        />
                    </View>

                    {/* Password Input */}
                    <Text style={styles.inputLabel}>Mật khẩu</Text>
                    <View style={styles.inputWrapper}>
                        <Image
                            source={require('../images/home-icon.png')} // Changed to lock icon
                            style={styles.inputIcon}
                            onError={(e) => console.log('Lỗi tải icon mật khẩu:', e.nativeEvent.error)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Mật khẩu"
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
                                        ? require('../images/home-icon.png') // Icon khi mật khẩu hiển thị
                                        : require('../images/home-icon.png') // Icon khi mật khẩu ẩn
                                }
                                style={styles.toggleIcon}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Sign In Button */}
                    <TouchableOpacity
                        style={styles.signInButton}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.signInButtonText}>Đăng nhập</Text>
                        )}
                    </TouchableOpacity>

                    {/* Sign Up Link */}
                    <TouchableOpacity
                        style={styles.signUpLink}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <Text style={styles.signUpLinkText}>
                            Chưa có tài khoản?{' '}
                            <Text style={styles.signUpLinkTextUnderline}>Đăng ký</Text>
                        </Text>
                    </TouchableOpacity>

                    {/* Forgot Password Link - moved to bottom */}
                    <TouchableOpacity style={styles.forgotPasswordButtonBottom}>
                        <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                    </TouchableOpacity>

                    {message ? <Text style={styles.message}>{message}</Text> : null}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'flex-start',
    },
    topSection: {
        width: '100%',
        height: height * 0.35, // Chiều cao của phần banner
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    topBackgroundImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    formContainer: {
        flex: 1,
        backgroundColor: '#fff',
        marginTop: -10, // Kéo form lên để tạo hiệu ứng cong phủ lên banner
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 25,
        // Điều chỉnh paddingTop để tạo không gian cho logo và căn chỉnh các input
        paddingTop: 80, // (chiều cao logo/2 + khoảng cách từ đỉnh form đến giữa logo) + một chút padding thêm
        paddingBottom: 20,
        alignItems: 'center',
    },
    // Định vị logoContainer độc lập với formContainer
    logoContainer: {
        position: 'absolute',
        // Đặt logo ở giữa đường cong của form và banner
        top: 200, // Chiều cao của topSection - một nửa chiều cao logo (180/2 = 90)
        left: '50%', // Bắt đầu từ giữa ngang
        marginLeft: -90, // Kéo về phía trái một nửa chiều rộng logo để căn giữa thực sự
        width: 180,
        height: 180,
        borderRadius: 90, // Đảm bảo hình tròn hoàn hảo (bán kính = chiều rộng/2)
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 15,
        zIndex: 10,
    },
    logo: {
        width: 180,
        height: 180,
        resizeMode: 'contain',
    },
    inputLabel: {
        alignSelf: 'flex-start',
        fontSize: 14,
        color: '#888',
        marginBottom: 5,
        fontWeight: 'bold',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: 50,
        backgroundColor: '#f5f5f5',
        borderRadius: 25,
        paddingHorizontal: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    inputIcon: {
        width: 20,
        height: 20,
        marginRight: 10,
        resizeMode: 'contain',
        tintColor: '#a0a0a0',
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: '#333',
    },
    passwordToggle: {
        padding: 5,
    },
    toggleIcon: {
        width: 20,
        height: 20,
        tintColor: '#a0a0a0',
        resizeMode: 'contain',
    },
    signInButton: {
        width: '100%',
        height: 55,
        backgroundColor: '#ff5c5c',
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 7,
    },
    signInButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    signUpLink: {
        marginTop: 25,
    },
    signUpLinkText: {
        color: '#888',
        fontSize: 15,
    },
    signUpLinkTextUnderline: {
        color: '#ff5c5c',
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    forgotPasswordButtonBottom: {
        marginTop: 15,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#007bff',
    },
    message: {
        marginTop: 20,
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
    },
});

export default LoginScreen;