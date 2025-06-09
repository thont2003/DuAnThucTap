import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Dimensions, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCall } from '../utils/api';
import { BASE_URL } from '../utils/constants';

const { width } = Dimensions.get('window');

// Danh sách các ảnh banner (thay thế bằng ảnh của bạn)
// Bạn có thể lấy danh sách này từ API nếu có
const bannerImages = [
    require('../images/banner.png'), // Đổi tên hoặc thêm ảnh của bạn
    require('../images/banner.png'),
    require('../images/banner.png'),
];

const HomeScreen = ({ route }) => {
    const { username } = route.params || { username: 'Guest' };
    const navigation = useNavigation();

    const [levels, setLevels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State và Ref cho banner tự động trượt
    const [bannerIndex, setBannerIndex] = useState(0);
    const flatListRef = useRef(null);

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

        // Logic tự động trượt banner
        const interval = setInterval(() => {
            setBannerIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % bannerImages.length;
                if (flatListRef.current) {
                    flatListRef.current.scrollToIndex({ animated: true, index: nextIndex });
                }
                return nextIndex;
            });
        }, 5000); // 3 giây

        // Dọn dẹp interval khi component bị unmount
        return () => clearInterval(interval);
    }, []);

    const renderBannerItem = ({ item }) => (
        <Image source={item} style={homeStyles.bannerImage} />
    );

    return (
        <View style={homeStyles.container}>
            {/* Header */}
            <View style={homeStyles.header}>
                <Image source={require('../images/home/account.png')} style={homeStyles.avatar} />
                <Text style={homeStyles.greeting}>Hello, {username}</Text>
            </View>

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
                                    source={{ uri: getFullImageUrl(item.image_url) }}
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
        paddingTop: 50,
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
    // Styles mới cho banner tự động trượt
    bannerContainer: {
        width: '95%',
        height: 150,
        alignSelf: 'center',
        marginTop: 15,
        marginBottom: 20,
        borderRadius: 15,
        overflow: 'hidden', // Đảm bảo ảnh bo góc
    },
    bannerImage: {
        width: width * 0.95, // Chiều rộng của mỗi ảnh banner bằng với container
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
        paddingBottom: 80,
    },
    categoryCardWrapper: {
        width: '48%',
        marginBottom: 15,
    },
    categoryCard: {
        width: '100%',
        height: 120,
        backgroundColor: '#FFFFFF',
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
        width: '80%',
        height: '70%',
        resizeMode: 'contain',
        marginBottom: 5,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
});

export default HomeScreen;