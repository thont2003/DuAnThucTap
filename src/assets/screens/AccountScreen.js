import React, { useState, useEffect } from 'react'; // Import useState và useEffect nếu bạn muốn hiển thị username
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

// Nhận prop `onLogout` từ AppNavigator
const AccountScreen = ({ onLogout }) => {
    const [username, setUsername] = useState('Người dùng'); // Thêm state để lưu username

    useEffect(() => {
        const loadUsername = async () => {
            try {
                const storedUsername = await AsyncStorage.getItem('currentUsername');
                if (storedUsername) {
                    setUsername(storedUsername);
                }
            } catch (error) {
                console.error("Lỗi khi tải username từ AsyncStorage:", error);
            }
        };
        loadUsername();
    }, []);

    const handleLogout = () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
                {
                    text: 'Hủy',
                    style: 'cancel',
                },
                {
                    text: 'Đồng ý',
                    onPress: async () => {
                        try {
                            // Xóa token và username khỏi AsyncStorage
                            await AsyncStorage.removeItem('userToken');
                            await AsyncStorage.removeItem('userId'); // Nếu bạn lưu userId thay vì token
                            await AsyncStorage.removeItem('currentUsername');
                            console.log('Đã xóa dữ liệu người dùng khỏi AsyncStorage.');
                            
                            // Gọi hàm onLogout được truyền từ AppNavigator để cập nhật trạng thái đăng nhập
                            if (onLogout) {
                                onLogout();
                            }
                        } catch (error) {
                            console.error('Lỗi khi đăng xuất:', error);
                            Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại.');
                        }
                    },
                },
            ],
            { cancelable: false }
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Thông tin tài khoản</Text>
            <Text style={styles.usernameText}>Xin chào, {username}!</Text>
            
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Đăng xuất</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0', // Nền màu xám nhạt
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 30,
    },
    usernameText: {
        fontSize: 20,
        color: '#555',
        marginBottom: 40,
    },
    logoutButton: {
        backgroundColor: '#ff5c5c', // Màu đỏ như nút đăng nhập
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        elevation: 5, // Shadow cho Android
        shadowColor: '#000', // Shadow cho iOS
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default AccountScreen;