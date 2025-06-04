import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'; // Import StyleSheet nếu dùng customStyles
import { useNavigation } from '@react-navigation/native'; // Giữ nguyên useNavigation nếu bạn dùng nó
import homeStyles from '../styles/homeStyles';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

// Nhận prop `onLogout` từ AppNavigator
const HomeScreen = ({ navigation, onLogout }) => {
    const [username, setUsername] = useState('Guest'); // Khởi tạo với 'Guest'

    useEffect(() => {
        const getUsernameFromStorage = async () => {
            try {
                // Lấy username từ AsyncStorage
                const storedUsername = await AsyncStorage.getItem('currentUsername');
                if (storedUsername) {
                    setUsername(storedUsername);
                } else {
                    console.log('Không tìm thấy username trong AsyncStorage. Hiển thị "Guest".');
                }
            } catch (error) {
                console.error('Lỗi khi lấy username từ AsyncStorage:', error);
                setUsername('Guest'); // Đặt lại là Guest nếu có lỗi
            }
        };

        getUsernameFromStorage();
    }, []); // Chỉ chạy một lần khi component mount

    const categoryImages = [
        { image: require('../images/Starters.png'), name: 'Starters', route: 'Starters' },
        { image: require('../images/Movers.png'), name: 'Movers', route: 'Movers' },
        { image: require('../images/Flyers.png'), name: 'Flyers', route: 'Flyers' },
        { image: require('../images/Grammar.png'), name: 'Grammar', route: 'Grammar' },
    ];

    const navItems = [
        { label: 'Home', icon: require('../images/homeblue-icon.png'), route: 'Home' },
        { label: 'History', icon: require('../images/history-icon.png'), route: 'History' },
        { label: 'Ranking', icon: require('../images/ranking-icon.png'), route: 'Ranking' },
        { label: 'Account', icon: require('../images/account-icon.png'), route: 'Account' },
    ];

    return (
        <View style={homeStyles.container}>
            <View style={homeStyles.header}>
                <Image source={require('../images/accountblue-icon.png')} style={homeStyles.avatar} />
                {/* Hiển thị username đã lấy từ state */}
                <Text style={homeStyles.greeting}>Hello, {username}</Text>
                {/* Nút Đăng xuất */}
            
            </View>
            <Image source={require('../images/banner.png')} style={homeStyles.banner} />
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginVertical: 10, marginLeft: 10 }}>
                Categories
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 10, paddingBottom: 80 }}>
                {categoryImages.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={{
                            width: '48%',
                            height: 100,
                            marginBottom: 10,
                        }}
                        onPress={() => navigation.navigate(item.route)}
                    >
                        <View
                            style={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: '#FFFFFF',
                                borderRadius: 10,
                                justifyContent: 'center',
                                alignItems: 'center',
                                elevation: 2,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.2,
                                shadowRadius: 2,
                            }}
                        >
                            <Image
                                source={item.image}
                                style={{ width: '90%', height: '90%', resizeMode: 'contain' }}
                            />
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
            {/* Thanh nav dưới cùng */}
            <View
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    backgroundColor: '#FFFFFF',
                    paddingVertical: 10,
                    borderTopWidth: 1,
                    borderTopColor: '#DDD',
                    elevation: 5,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    height: 60,
                }}
            >
                {navItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => navigation.navigate(item.route)}
                        style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 5,
                        }}
                    >
                        <Image
                            source={item.icon}
                            style={{ width: 24, height: 24, marginBottom: 5 }}
                        />
                        <Text style={{ fontSize: 12, color: '#333' }}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

// Styles cho nút đăng xuất
const customStyles = StyleSheet.create({
    logoutButton: {
        backgroundColor: '#ff5c5c',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 15,
        position: 'absolute', // Đặt nút này ở vị trí cụ thể trong header
        right: 10,
        top: 20, // Điều chỉnh vị trí cho phù hợp
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default HomeScreen;