import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput, // Dùng TextInput thay vì component Input
    TouchableOpacity,
    StyleSheet, // Dùng StyleSheet thay vì loginStyles riêng biệt
    Alert,
    ActivityIndicator,
    Image,
    Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Sử dụng useNavigation
import { apiCall } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Nhận prop `onLoginSuccess` từ AppNavigator
const LoginScreen = ({ onLoginSuccess }) => { // Xóa `navigation` khỏi props vì chúng ta dùng useNavigation()
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(''); // Để hiển thị thông báo lỗi/thành công trực tiếp trên UI

    const navigation = useNavigation(); // Khởi tạo hook useNavigation

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
            return;
        }

        setLoading(true);
        setMessage(''); // Xóa tin nhắn cũ

        try {
            console.log('Đang gửi yêu cầu đăng nhập:', { email, password });
            const response = await apiCall('POST', '/login', { email, password });
            console.log('Phản hồi từ server:', response);

            if (response.ok) {
                // *** QUAN TRỌNG: Đảm bảo server của bạn trả về `token` và `username` ***
                const { userId, message, username, token } = response.data;

                // 1. Lưu token (hoặc userId) vào AsyncStorage
                if (token) {
                    await AsyncStorage.setItem('userToken', token);
                    console.log('Đã lưu userToken vào AsyncStorage:', token);
                } else {
                    await AsyncStorage.setItem('userId', String(userId));
                    console.log('Đã lưu userId vào AsyncStorage:', userId);
                }

                // 2. LƯU USERNAME THỰC TẾ TỪ SERVER VÀO ASYNCSTORAGE
                if (username) {
                    await AsyncStorage.setItem('currentUsername', username);
                    console.log('Đã lưu currentUsername vào AsyncStorage:', username);
                } else {
                    // Cảnh báo nếu username không có trong phản hồi API.
                    console.warn("API '/login' không trả về 'username'. HomeScreen có thể hiển thị 'Guest'.");
                }

                Alert.alert('Thành công', message); // Hiển thị Alert thành công
                setMessage(message); // Cập nhật tin nhắn trên UI (tùy chọn)

                // Gọi onLoginSuccess để thông báo cho AppNavigator đã đăng nhập thành công
                // AppNavigator sẽ xử lý việc điều hướng đến HomeScreen
                onLoginSuccess(token || String(userId));

                // Bỏ dòng navigation.navigate('Home', { username });
                // vì AppNavigator sẽ tự động điều hướng khi trạng thái đăng nhập thay đổi.
            } else {
                const errorMessage = response.data?.error || 'Đăng nhập thất bại';
                Alert.alert('Lỗi', errorMessage); // Hiển thị Alert lỗi
                setMessage(errorMessage); // Cập nhật tin nhắn lỗi trên UI
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
                        source={require('../images/avatar.png')} // Đảm bảo đường dẫn này đúng
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
                        source={require('../images/home-icon.png')} // Biểu tượng khóa (giả sử bạn có)
                        style={styles.inputIcon}
                        onError={(e) => console.log('Lỗi tải icon mật khẩu:', e.nativeEvent.error)}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Mật khẩu"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholderTextColor="#a0a0a0"
                    />
                    <TouchableOpacity style={styles.forgotPasswordButton}>
                        <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
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
    topSection: {
        width: '100%',
        height: height * 0.35,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    topBackgroundImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        marginHorizontal: 0,
        paddingHorizontal: 0,
    },
    logoContainer: {
        position: 'absolute',
        bottom: 550, // Điều chỉnh giá trị này để logo hiển thị đúng vị trí
        width: 180,
        height: 180,
        borderRadius: 120,
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
    formContainer: {
        flex: 1,
        backgroundColor: '#fff',
        marginTop: -10,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 25,
        paddingTop: 50,
        paddingBottom: 20,
        alignItems: 'center',
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
    forgotPasswordButton: {
        position: 'absolute',
        right: 15,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#007bff',
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
    message: {
        marginTop: 20,
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
    },
});

export default LoginScreen;