// HomeScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Dimensions, StyleSheet, FlatList, StatusBar, Animated } from 'react-native'; // Import Animated
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCall } from '../utils/api';
import { BASE_URL } from '../utils/constants';

const { width } = Dimensions.get('window');

const bannerImages = [
    require('../images/home/banner.png'),
    require('../images/home/banner1.png'),
    require('../images/home/banner2.png'),
];

const HomeScreen = ({ route }) => {
    const { username, showLoginSuccess } = route.params || { username: 'Guest' }; // Nhận tham số showLoginSuccess
    const navigation = useNavigation();

    const [levels, setLevels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State và Ref cho banner tự động trượt
    const [bannerIndex, setBannerIndex] = useState(0);
    const flatListRef = useRef(null);
    const scrollTimeoutRef = useRef(null);

    // State và Animated.Value cho thông báo đăng nhập
    const [showNotification, setShowNotification] = useState(false);
    const notificationOpacity = useRef(new Animated.Value(0)).current;
    const notificationTranslateY = useRef(new Animated.Value(-100)).current;

    const getFullImageUrl = (imageFileName) => {
        if (!imageFileName) {
            return '';
        }
        if (imageFileName.startsWith('http://') || imageFileName.startsWith('https://')) {
            return imageFileName;
        }
        return `${BASE_URL}/images/${imageFileName}`;
    };

    const fetchLevels = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('HomeScreen: Đang fetch levels từ API...');
            const response = await apiCall('GET', '/levels');
            console.log('HomeScreen: Phản hồi API levels:', response);

            if (response.ok) {
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

        // Khởi tạo timeout tự động trượt banner
        const startAutoScroll = () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            scrollTimeoutRef.current = setTimeout(() => {
                setBannerIndex((prevIndex) => {
                    const nextIndex = (prevIndex + 1) % bannerImages.length;
                    if (flatListRef.current) {
                        flatListRef.current.scrollToIndex({ animated: true, index: nextIndex });
                    }
                    return nextIndex;
                });
                startAutoScroll(); // Gọi lại để tiếp tục tự động trượt
            }, 4000); // 4 giây
        };

        startAutoScroll(); // Bắt đầu tự động trượt khi component mount

        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current); // Xóa timeout khi component unmount
            }
        };
    }, []);

    // Effect để xử lý thông báo đăng nhập thành công
    useEffect(() => {
        if (showLoginSuccess) {
            setShowNotification(true);
            Animated.parallel([
                Animated.timing(notificationOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(notificationTranslateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setTimeout(() => {
                    Animated.parallel([
                        Animated.timing(notificationOpacity, {
                            toValue: 0,
                            duration: 500,
                            useNativeDriver: true,
                        }),
                        Animated.timing(notificationTranslateY, {
                            toValue: -100,
                            duration: 500,
                            useNativeDriver: true,
                        }),
                    ]).start(() => {
                        setShowNotification(false);
                        // Đặt lại tham số route để thông báo không xuất hiện lại khi quay lại HomeScreen
                        navigation.setParams({ showLoginSuccess: undefined });
                    });
                }, 2000); // Hiển thị trong 3 giây
            });
        }
    }, [showLoginSuccess, notificationOpacity, notificationTranslateY, navigation]);

    const handleScroll = (event) => {
        // Xóa timeout tự động trượt khi người dùng cuộn thủ công
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        const contentOffsetX = event.nativeEvent.contentOffset.x;
        // Tính toán index dựa trên chiều rộng của mỗi item banner
        const newIndex = Math.round(contentOffsetX / (width * 0.95));
        setBannerIndex(newIndex);

        // Đặt lại timeout tự động trượt sau khi người dùng ngừng cuộn
        // Timeout này sẽ kích hoạt sau 4 giây không có tương tác cuộn
        scrollTimeoutRef.current = setTimeout(() => {
            setBannerIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % bannerImages.length;
                if (flatListRef.current) {
                    flatListRef.current.scrollToIndex({ animated: true, index: nextIndex });
                }
                return nextIndex;
            });
            // startAutoScroll(); // Có thể uncomment nếu muốn tiếp tục tự động trượt từ vị trí mới
        }, 4000); // 4 giây sau khi người dùng ngừng cuộn
    };

    const renderBannerItem = ({ item }) => (
        <Image source={item} style={homeStyles.bannerImage} />
    );

    return (
        <View style={homeStyles.container}>
            {/* Cấu hình Status Bar */}
            <StatusBar
                barStyle="dark-content" // Đặt màu chữ/icon trên Status Bar là màu tối (phù hợp với nền trắng)
                backgroundColor="white" // Đặt màu nền của Status Bar là trắng
                translucent={false} // Đảm bảo Status Bar không bị trong suốt và chiếm không gian
            />

            {/* Header */}
            <View style={homeStyles.header}>
                <Image source={require('../images/home/account.png')} style={homeStyles.avatar} />
                <Text style={homeStyles.greeting}>Hello, {username}</Text>
            </View>

            {/* Thông báo đăng nhập thành công */}
            {showNotification && (
                <Animated.View
                    style={[
                        homeStyles.notificationContainer,
                        {
                            opacity: notificationOpacity,
                            transform: [{ translateY: notificationTranslateY }],
                        },
                    ]}
                >
                    <Text style={homeStyles.notificationText}>Đăng nhập thành công!</Text>
                </Animated.View>
            )}

            {/* Banner - Sử dụng FlatList */}
            <View style={homeStyles.bannerContainer}>
                <FlatList
                    ref={flatListRef}
                    data={bannerImages}
                    renderItem={renderBannerItem}
                    keyExtractor={(item, index) => index.toString()}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll} // Thêm onScroll để theo dõi cuộn thủ công
                    scrollEventThrottle={16} // Tần suất gọi hàm onScroll (ms)
                    onScrollToIndexFailed={info => {
                        const wait = new Promise(resolve => setTimeout(resolve, 500));
                        wait.then(() => {
                            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                        });
                    }}
                />
                <View style={homeStyles.paginationDots}>
                    {bannerImages.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                homeStyles.dot,
                                { backgroundColor: index === bannerIndex ? '#1E90FF' : '#C0C0C0' },
                            ]}
                        />
                    ))}
                </View>
            </View>

            {/* Categories Title */}
            <Text style={homeStyles.categoriesTitle}>Categories</Text>

            {/* Content Area: Loading, Error, or Categories Grid */}
            {loading ? (
                <View style={homeStyles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1E90FF" />
                    <Text style={homeStyles.loadingText}>Đang tải danh mục...</Text>
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
                                    source={{ uri: getFullImageUrl(item.image_url) }}
                                    style={homeStyles.categoryImage}
                                    resizeMode="contain"
                                    onError={(e) => console.log('Lỗi tải ảnh Level:', e.nativeEvent.error, 'URL:', getFullImageUrl(item.image_url))}
                                />
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );
};

const homeStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E0E5FF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: 'white',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        paddingTop: 50,
        zIndex: 1, // Đảm bảo header nằm trên thông báo
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
    // Styles for the success notification
    notificationContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 95 : 10, // Adjust based on your header height and status bar
        width: '70%',
        alignSelf: 'center',
        backgroundColor: '#82DA6C', // Green color for success
        padding: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10, // Ensure it's on top
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    notificationText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    bannerContainer: {
        width: '95%',
        height: 150,
        alignSelf: 'center',
        marginTop: 15,
        marginBottom: 20,
        borderRadius: 15,
        overflow: 'hidden',
        backgroundColor: 'white',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    bannerImage: {
        width: width * 0.95,
        height: '100%',
        resizeMode: 'cover',
        borderRadius: 15,
    },
    paginationDots: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 10,
        alignSelf: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    categoriesTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 10,
        marginLeft: 15,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
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
        backgroundColor: 'transparent',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
        marginBottom: 15,
    },
    retryButton: {
        backgroundColor: '#1E90FF',
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
        // paddingBottom: 80,
    },
    categoryCardWrapper: {
        width: '48%',
        marginBottom: 15,
    },
    categoryCard: {
        width: '100%',
        height: 120,
        backgroundColor: 'white',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        overflow: 'hidden',
    },
    categoryImage: {
        width: '90%',
        height: '90%',
        resizeMode: 'contain',
    },
});

export default HomeScreen;