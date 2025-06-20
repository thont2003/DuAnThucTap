import React, { useState } from 'react'; // Add useState
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomAlertDialog from '../../components/CustomAlertDialog'; // Đảm bảo đường dẫn này đúng

const AdminScreen = () => {
    const navigation = useNavigation();
    const [isLogoutAlertVisible, setLogoutAlertVisible] = useState(false); // State để điều khiển CustomAlertDialog

    const handleLogout = async () => {
        // Hiển thị CustomAlertDialog thay vì Alert.alert() mặc định
        setLogoutAlertVisible(true);
    };

    const confirmLogout = async () => {
        setLogoutAlertVisible(false); // Ẩn alert sau khi xác nhận
        try {
            // Xóa userToken và userInfo (hoặc bất kỳ dữ liệu xác thực nào khác)
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userInfo');
            console.log('Đã xóa thông tin đăng nhập khỏi AsyncStorage.');

            // Reset navigation stack về IntroScreen
            navigation.reset({
                index: 0,
                routes: [{ name: 'IntroScreen' }], // Đảm bảo 'IntroScreen' là tên màn hình chính xác
            });
        } catch (error) {
            console.error('Lỗi khi đăng xuất:', error);
            // Có thể hiển thị một thông báo lỗi khác nếu cần
            Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Quản trị hệ thống</Text>

            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('LevelScreen')}
            >
                <Text style={styles.buttonText}>Quản lý Cấp độ (Level)</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: '#6f42c1' }]}
                onPress={() => navigation.navigate('UnitScreen')}
            >
                <Text style={styles.buttonText}>Quản lý Đơn vị (Unit)</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.button, { backgroundColor: '#00ff00' }]}
                onPress={() => navigation.navigate('TestADScreen')}
            >
                <Text style={styles.buttonText}>Quản lý bài tập (Test)</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.button, { backgroundColor: '#28a745' }]}
                onPress={() => navigation.navigate('QuestionTypeScreen')}
            >
                <Text style={styles.buttonText}>Quản lý Thể loại câu hỏi</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: '#dc3545' }]}
                onPress={() => navigation.navigate('UserManagementScreen')}
            >
                <Text style={styles.buttonText}>Quản lý người dùng</Text>
            </TouchableOpacity>

            {/* Nút Đăng xuất */}
            <TouchableOpacity
                style={[styles.button, styles.logoutButton]}
                onPress={handleLogout} // Gọi hàm handleLogout để hiển thị alert
            >
                <Text style={styles.buttonText}>Đăng xuất</Text>
            </TouchableOpacity>

            {/* Custom AlertDialog */}
            <CustomAlertDialog
                isVisible={isLogoutAlertVisible}
                title="Đăng xuất"
                message="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?"
                onConfirm={confirmLogout}
                onCancel={() => setLogoutAlertVisible(false)} // Hủy sẽ ẩn alert
                confirmText="Đăng xuất"
                cancelText="Hủy"
            />
        </View>
    );
};

export default AdminScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 30,
        justifyContent: 'center',
        backgroundColor: '#E0E5FF',
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 40,
        textAlign: 'center',
        color: '#212529',
    },
    button: {
        backgroundColor: '#007bff',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginVertical: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    logoutButton: {
        backgroundColor: '#ffc107', // Màu vàng/cam để phân biệt
        marginTop: 30, // Tăng khoảng cách
    },
});