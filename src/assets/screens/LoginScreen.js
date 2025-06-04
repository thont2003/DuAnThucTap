import React, { useState } from 'react';
import {
    View,
    Text,
    Alert,
    ActivityIndicator, // Đảm bảo đã import nếu dùng trong button
    // Các imports khác tùy thuộc vào các component bạn sử dụng
} from 'react-native';
// import { useNavigation } from '@react-navigation/native'; // Chỉ dùng nếu bạn muốn dùng hook
import Input from '../components/Input'; // Nếu bạn đang dùng component Input của mình
import Button from '../components/Button'; // Nếu bạn đang dùng component Button của mình
import loginStyles from '../styles/loginStyles'; // Styles của bạn
import { apiCall } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Nhận prop `onLoginSuccess` từ AppNavigator
const LoginScreen = ({ navigation, onLoginSuccess }) => { // Giữ lại `navigation` nếu bạn dùng nó cho nút Đăng ký
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // const navigation = useNavigation(); // Bỏ comment nếu bạn muốn dùng hook thay vì prop

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
            return;
        }

        setLoading(true);

        try {
            console.log('Đang gửi yêu cầu đăng nhập:', { email, password });
            const response = await apiCall('POST', '/login', { email, password });
            console.log('Phản hồi từ server:', response);

            if (response.ok) {
                // *** Đảm bảo API của bạn trả về `username` và `token` ***
                const { userId, message, token, username } = response.data; // Lấy `username` trực tiếp từ phản hồi

                // 1. Lưu token (hoặc userId)
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
                    // Cảnh báo nếu username không có trong phản hồi API
                    console.warn("API '/login' không trả về 'username'. HomeScreen có thể hiển thị 'Guest'.");
                }

                Alert.alert('Thành công', message);
                // Gọi onLoginSuccess để thông báo cho AppNavigator đã đăng nhập thành công
                // AppNavigator sẽ xử lý việc điều hướng đến HomeScreen
                onLoginSuccess(token || String(userId));

            } else {
                const errorMessage = response.data?.error || 'Đăng nhập thất bại';
                Alert.alert('Lỗi', errorMessage);
            }
        } catch (error) {
            console.error('Lỗi khi gọi API đăng nhập:', error.message);
            Alert.alert('Lỗi', 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối và thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={loginStyles.container}>
            <Text style={loginStyles.title}>Đăng Nhập</Text>
            <Input value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
            <Input value={password} onChangeText={setPassword} placeholder="Mật khẩu" secureTextEntry />
            <Button title="Đăng Nhập" onPress={handleLogin} disabled={loading} />
            {/* Bạn có thể thêm ActivityIndicator vào đây hoặc trong component Button */}
            {/* {loading && <ActivityIndicator size="small" color="#0000ff" />} */}

            <Text style={loginStyles.registerText}>
                Chưa có tài khoản?{' '}
                <Text style={loginStyles.registerLink} onPress={() => navigation.navigate('Register')}>
                    Đăng ký
                </Text>
            </Text>
        </View>
    );
};

export default LoginScreen;