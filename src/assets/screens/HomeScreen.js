import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Dimensions, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage để lấy username
import { apiCall } from '../utils/api'; // Đảm bảo đường dẫn này đúng
import { BASE_URL } from '../utils/constants'; // Đảm bảo đường dẫn này đúng và BASE_URL được định nghĩa

const { width } = Dimensions.get('window'); // Lấy chiều rộng màn hình để tính toán kích thước category

const HomeScreen = ({ route }) => {
    // Lấy username từ route.params hoặc từ AsyncStorage
    const { username } = route.params || { username: 'Guest' };
    const navigation = useNavigation();

    const [levels, setLevels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Hàm để xây dựng URL ảnh đầy đủ (sao chép từ UnitsScreen.js)
    const getFullImageUrl = (imageFileName) => {
        if (!imageFileName) {
            return ''; // Trả về rỗng nếu không có tên file
        }
        // Nếu imageFileName đã là một URL đầy đủ, trả về nó trực tiếp.
        if (imageFileName.startsWith('http://') || imageFileName.startsWith('https://')) {
            return imageFileName;
        }
        // Nếu không, nối nó với base URL và thư mục images.
        return `${BASE_URL}/images/${imageFileName}`;
    };

    // useEffect để lấy username từ AsyncStorage khi component mount


    const fetchLevels = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('HomeScreen: Đang fetch levels từ API...');
            const response = await apiCall('GET', '/levels');
            console.log('HomeScreen: Phản hồi API levels:', response);

            if (response.ok) {
                // Sử dụng image_url trực tiếp từ database
                const fetchedLevels = response.data;
                setLevels(fetchedLevels);
                console.log('HomeScreen: Levels đã được tải thành công:', fetchedLevels.length, 'levels.');
            } else {
                const errorMessage = response.data?.error || 'Không thể tải levels. Vui lòng thử lại.';
                setError(errorMessage);
                Alert.alert('Lỗi', errorMessage);
                console.error('HomeScreen: Lỗi từ server khi fetch levels:', response.status, response.data);
            }
        } catch (err) {
            console.error('HomeScreen: Lỗi khi fetch levels:', err);
            setError('Không thể kết nối đến server để tải levels. Vui lòng kiểm tra kết nối.');
            Alert.alert('Lỗi', 'Không thể kết nối đến server để tải levels. Vui lòng kiểm tra kết nối.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLevels();
    }, []);

    const navItems = [
        { label: 'Home', icon: require('../images/homeblue-icon.png'), route: 'Home' },
        { label: 'History', icon: require('../images/history-icon.png'), route: 'History' },
        { label: 'Ranking', icon: require('../images/ranking-icon.png'), route: 'Ranking' },
        { label: 'Account', icon: require('../images/account-icon.png'), route: 'Account' },
    ];

    return (
        <View style={homeStyles.container}>
            {/* Header */}
            <View style={homeStyles.header}>
                <Image source={require('../images/home/account.png')} style={homeStyles.avatar} />
                <Text style={homeStyles.greeting}>Hello, {username}</Text>
            </View>

            {/* Banner */}
            <Image source={require('../images/banner.png')} style={homeStyles.banner} />

            {/* Categories Title */}
            <Text style={homeStyles.categoriesTitle}>Categories</Text>

            {/* Content Area: Loading, Error, or Categories Grid */}
            {loading ? (
                <View style={homeStyles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1E90FF" />
                    <Text style={homeStyles.loadingText}>Đang tải levels...</Text>
                </View>
            ) : error ? (
                <View style={homeStyles.errorContainer}>
                    <Text style={homeStyles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={fetchLevels} style={homeStyles.retryButton}>
                        <Text style={homeStyles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={homeStyles.categoriesGrid}>
                    {levels.map((item) => (
                        <TouchableOpacity
                            key={item.level_id.toString()}
                            style={homeStyles.categoryCardWrapper}
                            onPress={() => navigation.navigate('Units', {
                                levelId: item.level_id,
                                levelName: item.name
                            })}
                        >
                            <View style={homeStyles.categoryCard}>
                                <Image
                                    source={{ uri: getFullImageUrl(item.image_url) }} // SỬ DỤNG getFullImageUrl
                                    style={homeStyles.categoryImage}
                                    resizeMode="contain"
                                    onError={(e) => console.log('Lỗi tải ảnh Level:', e.nativeEvent.error, 'URL:', getFullImageUrl(item.image_url))}
                                />
                                <Text style={homeStyles.categoryName}>{item.name}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {/* Bottom Navigation */}
            <View style={homeStyles.bottomNav}>
                {navItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => navigation.navigate(item.route)}
                        style={homeStyles.bottomNavItem}
                    >
                        <Image
                            source={item.icon}
                            style={homeStyles.bottomNavIcon}
                        />
                        <Text style={homeStyles.bottomNavText}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const homeStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#FFFFFF',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        paddingTop: 50, // Để tránh notch
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    greeting: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    banner: {
        width: '95%',
        height: 150,
        borderRadius: 15,
        alignSelf: 'center',
        marginTop: 15,
        marginBottom: 20,
        resizeMode: 'cover',
    },
    categoriesTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 10,
        marginLeft: 15, // Căn lề thống nhất
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
        marginBottom: 15,
    },
    retryButton: {
        backgroundColor: '#1E90FF', // Màu xanh dương đẹp hơn
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingBottom: 80, // Để tránh bị thanh nav che khuất
    },
    categoryCardWrapper: {
        width: '48%', // Chiếm 48% để có khoảng cách giữa 2 cột
        marginBottom: 15, // Khoảng cách giữa các hàng
    },
    categoryCard: {
        width: '100%',
        height: 120, // Chiều cao cố định cho mỗi thẻ
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        overflow: 'hidden', // Đảm bảo hình ảnh không tràn ra ngoài bo tròn
    },
    categoryImage: {
        width: '80%', // Điều chỉnh kích thước ảnh bên trong thẻ
        height: '70%',
        resizeMode: 'contain', // Đảm bảo ảnh vừa vặn và không bị méo
        marginBottom: 5, // Khoảng cách giữa ảnh và tên level
    },
    categoryName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        elevation: 8, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        height: 70, // Tăng chiều cao một chút cho đẹp hơn
        alignItems: 'center', // Căn giữa nội dung theo chiều dọc
    },
    bottomNavItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5, // Điều chỉnh padding
    },
    bottomNavIcon: {
        width: 28, // Kích thước icon lớn hơn một chút
        height: 28,
        marginBottom: 3,
        resizeMode: 'contain',
    },
    bottomNavText: {
        fontSize: 11, // Kích thước chữ nhỏ hơn cho gọn
        color: '#555',
        fontWeight: '600',
    },
});

export default HomeScreen;