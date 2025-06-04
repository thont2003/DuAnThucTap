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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiCall } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Nhận prop `onLoginSuccess` từ AppNavigator
const LoginScreen = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false); // Thêm state để ẩn/hiện mật khẩu

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
                const { userId, message, username, token } = response.data;

                if (token) {
                    await AsyncStorage.setItem('userToken', token);
                    console.log('Đã lưu userToken vào AsyncStorage:', token);
                } else {
                    await AsyncStorage.setItem('userId', String(userId));
                    console.log('Đã lưu userId vào AsyncStorage:', userId);
                }

                if (username) {
                    await AsyncStorage.setItem('currentUsername', username);
                    console.log('Đã lưu currentUsername vào AsyncStorage:', username);
                } else {
                    console.warn("API '/login' không trả về 'username'. HomeScreen có thể hiển thị 'Guest'.");
                }

                Alert.alert('Thành công', message);
                setMessage(message);

                onLoginSuccess(token || String(userId));
            } else {
                const errorMessage = response.data?.error || 'Đăng nhập thất bại';
                Alert.alert('Lỗi', errorMessage);
                setMessage(errorMessage);
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
        <View style={styles.container}>
            {/* Top Section with Background Image and Logo */}
            <View style={styles.topSection}>
                <Image
                    source={require('../images/banner.png')}
                    style={styles.topBackgroundImage}
                />
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../images/avatar.png')} // Đảm bảo đường dẫn này đúng
                        style={styles.logo}
                        onError={(e) => console.log('Lỗi tải logo:', e.nativeEvent.error)}
                    />
                </View>
                {/* Email Input */}
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputWrapper}>
                    <Image
                        source={require('../images/avatar.png')} // Đã đổi lại thành user.png
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
                        // Thay đổi icon dựa vào trạng thái showPassword
                        source={showPassword ? require('../images/home-icon.png') : require('../images/home-icon.png')}
                        // Lưu ý: Bạn cần có các file eye-open.png và eye-closed.png trong thư mục images.
                        // Nếu không có, bạn có thể dùng tạm home-icon.png và user.png như trước,
                        // hoặc dùng icon từ thư viện như FontAwesome/Ionicons.
                        style={styles.inputIcon}
                        onError={(e) => console.log('Lỗi tải icon mật khẩu:', e.nativeEvent.error)}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Mật khẩu"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword} // Ẩn/hiện mật khẩu dựa vào state
                        placeholderTextColor="#a0a0a0"
                    />
                    {/* Nút toggle ẩn/hiện mật khẩu */}
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.passwordToggle}
                    >
                        <Image
                            source={showPassword ? require('../images/home-icon.png') : require('../images/home-icon.png')}
                            // Lưu ý: Đảo ngược icon cho nút toggle để nó hiển thị trạng thái SẼ ĐƯỢC CHUYỂN ĐỔI
                            // Ví dụ: nếu mật khẩu đang hiển thị (showPassword = true), nút sẽ hiện icon mắt đóng (để ẩn)
                            style={styles.toggleIcon}
                            onError={(e) => console.log('Lỗi tải icon toggle:', e.nativeEvent.error)}
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

                {/* Nút quên mật khẩu */}
                <TouchableOpacity style={styles.forgotPasswordButtonBottom}>
                    <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                </TouchableOpacity>

                {message ? <Text style={styles.message}>{message}</Text> : null}
            </View>
        </View>
    );
};

// Sử dụng các styles bạn đã cung cấp
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
        paddingTop: 80, // (chiều cao logo/2 + khoảng cách từ đỉnh form đến giữa logo) + một chút padding thêm
        paddingBottom: 20,
        alignItems: 'center',
    },
    logoContainer: {
        position: 'absolute',
        top: -100, // Điều chỉnh vị trí logo
        left: '50%',
        marginLeft: -55,
        width: 180,
        height: 180,
        borderRadius: 90,
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
    // Style cho nút toggle mật khẩu
    passwordToggle: {
        padding: 5,
        position: 'absolute', // Đặt nút toggle ở cuối inputWrapper
        right: 10,
    },
    toggleIcon: {
        width: 24, // Kích thước lớn hơn một chút cho dễ nhấn
        height: 24,
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