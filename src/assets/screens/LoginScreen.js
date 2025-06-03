import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import Input from '../components/Input';
import Button from '../components/Button';
import loginStyles from '../styles/loginStyles';
import { apiCall } from '../utils/api';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }

    try {
      console.log('Đang gửi yêu cầu đăng nhập:', { email, password });
      const response = await apiCall('POST', '/login', { email, password });
      console.log('Phản hồi từ server:', response);

      if (response.ok) {
        const { userId, message } = response.data;
        // Giả định lấy username từ server (cần thêm vào endpoint /login nếu có)
        const username = email.split('@')[0]; // Giả sử username là phần trước @ của email
        Alert.alert('Thành công', message);
        navigation.navigate('Home', { username }); // Chuyển sang HomeScreen với username
      } else {
        const errorMessage = response.data?.error || 'Đăng nhập thất bại';
        Alert.alert('Lỗi', errorMessage);
      }
    } catch (error) {
      console.error('Lỗi khi gọi API đăng nhập:', error.message);
      Alert.alert('Lỗi', 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối và thử lại.');
    }
  };

  return (
    <View style={loginStyles.container}>
      <Text style={loginStyles.title}>Đăng Nhập</Text>
      <Input value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
      <Input value={password} onChangeText={setPassword} placeholder="Mật khẩu" secureTextEntry />
      <Button title="Đăng Nhập" onPress={handleLogin} />
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