import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import Input from '../components/Input';
import Button from '../components/Button';
import registerStyles from '../styles/registerStyles';
import { apiCall } from '../utils/api';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      const response = await apiCall('POST', '/register', { username, email, password });
      if (response.ok) {
        Alert.alert('Thành công', response.data.message);
        navigation.navigate('Login');
      } else {
        Alert.alert('Lỗi', response.data.error || 'Đăng ký thất bại');
      }
    } catch (error) {
      console.error('Lỗi:', error);
      Alert.alert('Lỗi', 'Không thể kết nối đến server');
    }
  };

  return (
    <View style={registerStyles.container}>
      <Text style={registerStyles.title}>Đăng Ký</Text>
      <Input value={username} onChangeText={setUsername} placeholder="Tên người dùng" />
      <Input value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
      <Input value={password} onChangeText={setPassword} placeholder="Mật khẩu" secureTextEntry />
      <Button title="Đăng Ký" onPress={handleRegister} />
      <Text style={registerStyles.loginText}>
        Đã có tài khoản?{' '}
        <Text style={registerStyles.loginLink} onPress={() => navigation.navigate('Login')}>
          Đăng nhập
        </Text>
      </Text>
    </View>
  );
};

export default RegisterScreen;