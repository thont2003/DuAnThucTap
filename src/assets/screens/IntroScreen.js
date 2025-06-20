import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
    TouchableOpacity,
    StatusBar,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const IntroScreen = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="#e0e8ff"
            />

            {/* Phần nền màu xanh nhạt (top background) */}
            <View style={styles.topBackground} />

            {/* Khu vực nội dung chính (main content area) với nền trắng và bo tròn */}
            <View style={styles.mainContentArea}>
                <Text style={styles.introText}>Learn English, explore the world</Text>

                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.loginButtonText}>Đăng Nhập</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.signupButton}
                    onPress={() => navigation.navigate('Register')}
                >
                    <Text style={styles.signupButtonText}>Đăng Ký</Text>
                </TouchableOpacity>
            </View>

            {/* Wrapper chứa logo và tagline được định vị tuyệt đối trên toàn màn hình */}
            <View style={styles.logoAndTaglineWrapper}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../images/login_signup/logo.png')}
                        style={styles.logo}
                        onError={(e) => console.log('Lỗi tải logo:', e.nativeEvent.error)}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e0e8ff', // Màu nền tổng thể
        paddingTop: Platform.OS === 'ios' ? StatusBar.currentHeight || 0 : 0,
    },
    topBackground: {
        height: height * 0.5, // Chiếm khoảng 50% chiều cao màn hình cho phần nền xanh nhạt
        backgroundColor: '#e0e8ff',
    },
    mainContentArea: {
        flex: 1, // Chiếm hết không gian còn lại
        backgroundColor: '#fff', // Nền trắng
        borderTopLeftRadius: 30, // Bo tròn góc trên bên trái
        borderTopRightRadius: 30, // Bo tròn góc trên bên phải
        marginTop: -30, // Kéo phần trắng lên để tạo hiệu ứng cong và che một phần logo
        alignItems: 'center',
        paddingHorizontal: 25,
        paddingTop: 100, // Khoảng cách từ trên xuống để dành chỗ cho logo và tagline bị chồng lên
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 }, // Bóng đổ lên trên
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8,
    },
    logoAndTaglineWrapper: {
        position: 'absolute', // Định vị tuyệt đối trên toàn màn hình
        top: height * 0.5 - 90 - 30, // Tính toán vị trí top: (giữa màn hình) - (nửa chiều cao logo) - (kéo lên thêm)
        left: '50%',
        marginLeft: -90, // Nửa chiều rộng logo (180/2) để căn giữa ngang
        alignItems: 'center', // Căn giữa nội dung (logo và tagline) bên trong wrapper này
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
    logoTagline: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#ff5c5c',
        textAlign: 'center',
        marginTop: 10, // Khoảng cách giữa logo và tagline
        width: 180, // Đảm bảo tagline có cùng chiều rộng để căn giữa
    },
    introText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 50,
        textAlign: 'center',
    },
    loginButton: {
        width: '100%',
        height: 55,
        backgroundColor: '#ff5c5c',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    signupButton: {
        width: '100%',
        height: 55,
        backgroundColor: '#fff',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ff5c5c',
    },
    signupButtonText: {
        color: '#ff5c5c',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default IntroScreen;
