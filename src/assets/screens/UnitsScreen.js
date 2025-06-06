// screens/UnitsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, FlatList, Alert, ScrollView } from 'react-native'; // Thêm Alert
import { useNavigation, useRoute } from '@react-navigation/native';

const UnitsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();

    // Lấy levelId và levelName từ route.params. Đảm bảo tên màn hình trong navigation.navigate là 'Units'
    const { levelId: initialLevelId, levelName: initialLevelName = 'Units' } = route.params || {};

    const [levels, setLevels] = useState([]); // Để lưu trữ danh sách tất cả các levels cho tabs
    const [currentLevel, setCurrentLevel] = useState(null); // Level hiện tại đang hiển thị units
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_BASE_URL = 'http://192.168.1.15:3000'; // Đảm bảo đây là IP đúng cho thiết bị của bạn

    // Hàm để xây dựng URL ảnh đầy đủ
    const getFullImageUrl = (imageFileName) => {
        if (!imageFileName) {
            return ''; // Trả về rỗng nếu không có tên file
        }
        // Nếu imageFileName đã là một URL đầy đủ, trả về nó trực tiếp.
        if (imageFileName.startsWith('http://') || imageFileName.startsWith('https://')) {
            return imageFileName;
        }
        // Nếu không, nối nó với base URL và thư mục images.
        return `${API_BASE_URL}/images/${imageFileName}`;
    };

    // --- EFFECT 1: Fetch tất cả levels khi component mount lần đầu ---
    useEffect(() => {
        const fetchAllLevels = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/levels`);
                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`Lỗi HTTP khi lấy levels! Trạng thái: ${response.status}. Chi tiết: ${errorBody}`);
                }
                const data = await response.json();
                setLevels(data);

                // Thiết lập currentLevel ban đầu dựa trên levelId được truyền từ HomeScreen
                const foundLevel = data.find(l => l.level_id === initialLevelId);
                if (foundLevel) {
                    setCurrentLevel(foundLevel);
                } else if (data.length > 0) {
                    // Fallback nếu initialLevelId không khớp hoặc không được truyền
                    setCurrentLevel(data[0]);
                } else {
                    setError("Không tìm thấy cấp độ nào trong database.");
                    setLoading(false);
                }
            } catch (e) {
                console.error("Lỗi khi lấy cấp độ (từ UnitsScreen):", e);
                setError("Không thể tải dữ liệu cấp độ. Vui lòng thử lại sau.");
                setLoading(false);
            }
        };

        fetchAllLevels();
    }, []); // Chạy một lần khi component mount

    // --- EFFECT 2: Fetch units khi currentLevel thay đổi ---
    useEffect(() => {
        const fetchUnitsForCurrentLevel = async () => {
            if (!currentLevel) {
                setLoading(false);
                setUnits([]);
                return;
            }

            setLoading(true);
            setError(null);
            setUnits([]); // Xóa units cũ khi tải level mới

            try {
                // Sử dụng endpoint mới: /levels/:level_id/units
                const response = await fetch(`${API_BASE_URL}/levels/${currentLevel.level_id}/units`);
                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`Lỗi HTTP khi lấy units! Trạng thái: ${response.status}. Chi tiết: ${errorBody}`);
                }
                const data = await response.json();
                setUnits(data);
            } catch (e) {
                console.error(`Lỗi khi lấy units cho level ${currentLevel.name}:`, e);
                setError(`Không thể tải bài tập cho ${currentLevel.name}. Vui lòng thử lại sau.`);
                setUnits([]); // Đảm bảo units trống khi có lỗi
            } finally {
                setLoading(false);
            }
        };

        if (currentLevel) { // Chỉ fetch units nếu đã có currentLevel
            fetchUnitsForCurrentLevel();
        }
    }, [currentLevel]); // Chạy lại khi currentLevel thay đổi

    // Xử lý khi người dùng nhấn vào một tab level
    const handleLevelPress = (level) => {
        setCurrentLevel(level);
        // navigation.replace('Units', { levelId: level.level_id, levelName: level.name });
        // Không cần navigation.replace ở đây nếu bạn đã quản lý currentLevel bằng state
        // và useEffect sẽ tự động re-fetch units
    };

    // Hiển thị loading ban đầu hoặc lỗi fetch levels
    if (loading && !currentLevel && !error) { // Chỉ hiện loading chung nếu chưa có level nào được tải
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#1E90FF" />
                <Text>Đang tải dữ liệu...</Text>
            </View>
        );
    }

    if (error && !currentLevel) { // Hiển thị lỗi fetch levels ban đầu
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={() => { setLevels([]); setCurrentLevel(null); setLoading(true); setError(null); fetchAllLevels(); }} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }


    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>{"<--"}</Text>
                    </TouchableOpacity>
                    {/* Sử dụng tên level hiện tại */}
                    <Text style={styles.headerTitle}>{currentLevel ? currentLevel.name : 'Units'}</Text>
                </View>
                {/* Tabs */}
                <View style={styles.tabContainer}>
                    {levels.length > 0 ? (
                        levels.map((level) => (
                            <TouchableOpacity
                                key={level.level_id.toString()}
                                onPress={() => handleLevelPress(level)}
                                style={styles.tab}
                            >
                                <Text
                                    style={[
                                        styles.tabText,
                                        currentLevel && level.level_id === currentLevel.level_id
                                            ? styles.activeTab
                                            : null,
                                    ]}
                                >
                                    {level.name}
                                </Text>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={styles.noLevelsText}>Không tìm thấy cấp độ nào.</Text>
                    )}
                </View>
            </View>
            {/* Nội dung trang */}
            <ScrollView style={styles.content}>
                {loading && currentLevel ? ( // Chỉ hiện loading units nếu đã có currentLevel
                    <View style={styles.centeredContent}>
                        <ActivityIndicator size="large" color="#1E90FF" />
                        <Text>Đang tải bài tập...</Text>
                    </View>
                ) : error ? ( // Hiển thị lỗi khi tải units
                    <View style={styles.centeredContent}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={() => fetchUnitsForCurrentLevel()} style={styles.retryButton}>
                            <Text style={styles.retryButtonText}>Thử lại</Text>
                        </TouchableOpacity>
                    </View>
                ) : units.length === 0 ? (
                    <View style={styles.centeredContent}>
                        <Text style={styles.noUnitsText}>
                            {currentLevel ? `Không có bài tập nào cho ${currentLevel.name}.` : 'Không có bài tập nào để hiển thị.'}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={units}
                        keyExtractor={item => item.unit_id.toString()}
                        numColumns={2}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                key={item.unit_id} // FlatList keyExtractor đã xử lý key
                                style={styles.imageContainer}
                                onPress={() => {
                                    console.log(`Đã nhấn vào Unit: ${item.title} (Level: ${currentLevel.name})`);
                                    // Điều hướng đến màn hình chi tiết bài tập
                                    // navigation.navigate('UnitDetailScreen', { unitId: item.unit_id, unitTitle: item.title });
                                }}
                            >
                                {/* SỬ DỤNG getFullImageUrl */}
                                <Image
                                    source={{ uri: getFullImageUrl(item.image_url) }}
                                    style={styles.image}
                                    resizeMode="cover"
                                    onError={(e) => console.log('Lỗi tải ảnh:', e.nativeEvent.error, 'URL:', getFullImageUrl(item.image_url))}
                                />
                                <Text style={styles.imageTitle}>{item.title}</Text>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.imageGrid}
                        scrollEnabled={false} // Cho phép ScrollView bên ngoài xử lý cuộn
                    />
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    header: {
        backgroundColor: '#FFFFFF',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        paddingTop: 40,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingBottom: 10,
    },
    backButton: {
        padding: 5,
        borderRadius: 5,
    },
    backButtonText: {
        fontSize: 28,
        color: '#666',
        fontWeight: 'bold',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    tab: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    tabText: {
        fontSize: 15,
        color: '#555',
        fontWeight: '600',
    },
    activeTab: {
        color: '#1E90FF',
    },
    content: {
        flex: 1,
        marginTop: 180,
        paddingHorizontal: 10,
    },
    imageGrid: {
        justifyContent: 'space-between',
        paddingBottom: 20,
        // Khi dùng FlatList bên trong ScrollView, FlatList cần height
        // hoặc contentContainerStyle. Nếu scrollEnabled={false}, FlatList
        // sẽ giãn ra theo nội dung, điều khiển bởi ScrollView bên ngoài.
        // Bỏ flexWrap ở đây nếu FlatList tự lo layout.
    },
    imageContainer: {
        width: '48%', // Chiếm 48% để có khoảng cách giữa 2 cột
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        alignItems: 'center',
        marginBottom: 15,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    image: {
        width: '100%',
        height: 120,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        marginBottom: 8,
    },
    imageTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        paddingHorizontal: 8,
        paddingBottom: 10,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F7F7F7', // Đặt nền cho các màn hình loading/error/empty
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        minHeight: 200, // Đảm bảo có chiều cao tối thiểu để nội dung không bị nhỏ
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
        marginBottom: 10,
    },
    noLevelsText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        flex: 1,
    },
    noUnitsText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    retryButton: {
        backgroundColor: '#1E90FF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 10,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default UnitsScreen;
