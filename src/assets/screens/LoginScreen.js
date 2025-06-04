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
import { apiCall } from '../utils/api'; // Assuming you still want to use your apiCall utility

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(''); // For displaying messages if needed

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
            const { userId, message, username } = response.data; 

            Alert.alert('Thành công', message);
            navigation.navigate('Home', { username }); // Chuyển sang HomeScreen với username từ server
          } else {
            const errorMessage = response.data?.error || 'Đăng nhập thất bại';
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
                        source={require('../images/avatar.png')} // Make sure this path is correct
                        style={styles.logo}
                        onError={(e) => console.log('Lỗi tải logo:', e.nativeEvent.error)}
                    />
                </View>
                {/* Email Input */}
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputWrapper}>
                    <Image
                        source={require('../images/user.png')} // Make sure this path is correct
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
                        source={require('../images/home-icon.png')} // Changed to a lock icon for password (assuming you have one)
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
        width: '100%', // Chiếm toàn bộ chiều rộng
        height: '100%',
        resizeMode: 'cover',
        marginHorizontal: 0, // Loại bỏ margin ngang
        paddingHorizontal: 0, // Loại bỏ padding ngang
    },
    logoContainer: {
        position: 'absolute',
        bottom: 550, // Consider adjusting this value to bring the logo into view
        width: 180,
        height: 180,
        borderRadius: 120,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 }, // Increased vertical offset for a longer shadow
        shadowOpacity: 0.4, // Slightly increased opacity to make it more visible
        shadowRadius: 12, // Increased radius for a softer, more spread-out shadow
        elevation: 15, // Increased elevation for Android for a more prominent shadow
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