import React, { useState, useEffect, useCallback } from 'react'; // Add useCallback
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, FlatList, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiCall } from '../utils/api';
import { BASE_URL } from '../utils/constants';

const UnitsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();

    const { levelId: initialLevelId, levelName: initialLevelName = 'Units' } = route.params || {};

    const [levels, setLevels] = useState([]);
    const [currentLevel, setCurrentLevel] = useState(null);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getFullImageUrl = (imageFileName) => {
        if (!imageFileName) {
            return '';
        }
        if (imageFileName.startsWith('http://') || imageFileName.startsWith('https://')) {
            return imageFileName;
        }
        return `${BASE_URL}/images/${imageFileName}`;
    };

    // Define fetchAllLevels using useCallback
    const fetchAllLevels = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiCall('GET', '/levels');
            if (response.ok && response.data) {
                setLevels(response.data);

                const foundLevel = response.data.find(l => l.level_id === initialLevelId);
                if (foundLevel) {
                    setCurrentLevel(foundLevel);
                } else if (response.data.length > 0) {
                    setCurrentLevel(response.data[0]);
                } else {
                    setError("Không tìm thấy cấp độ nào trong database.");
                }
            } else {
                const message = response.data?.error || response.data?.message || 'Không thể tải các cấp độ.';
                setError(message);
                Alert.alert('Lỗi', message);
                console.error('UnitsScreen: Lỗi từ server khi fetch levels:', response.status, response.data);
            }
        } catch (e) {
            console.error("Lỗi khi lấy cấp độ (từ UnitsScreen):", e);
            setError("Không thể kết nối đến server để tải cấp độ.");
            Alert.alert('Lỗi', 'Không thể kết nối đến server để tải cấp độ.');
        } finally {
            setLoading(false);
        }
    }, [initialLevelId]); // Add initialLevelId to dependencies for useCallback

    // Define fetchUnitsForCurrentLevel using useCallback
    const fetchUnitsForCurrentLevel = useCallback(async () => {
        if (!currentLevel) {
            setLoading(false);
            setUnits([]);
            return;
        }

        setLoading(true);
        setError(null);
        setUnits([]);

        try {
            const response = await apiCall('GET', `/levels/${currentLevel.level_id}/units`);
            if (response.ok && response.data) {
                setUnits(response.data);
            } else {
                const message = response.data?.error || response.data?.message || 'Không thể tải các bài tập.';
                setError(message);
                Alert.alert('Lỗi', message);
                console.error(`UnitsScreen: Lỗi từ server khi fetch units cho level ${currentLevel.level_id}:`, response.status, response.data);
            }
        } catch (e) {
            console.error(`UnitsScreen: Lỗi khi fetch units cho level ${currentLevel.name}:`, e);
            setError(`Không thể kết nối đến server để tải bài tập cho ${currentLevel.name}.`);
            Alert.alert('Lỗi', `Không thể kết nối đến server để tải bài tập cho ${currentLevel.name}.`);
            setUnits([]);
        } finally {
            setLoading(false);
        }
    }, [currentLevel]); // Add currentLevel to dependencies for useCallback

    // --- EFFECT 1: Fetch all levels when component mount lần đầu ---
    useEffect(() => {
        fetchAllLevels();
    }, [fetchAllLevels]); // Add fetchAllLevels to dependency array

    // --- EFFECT 2: Fetch units khi currentLevel thay đổi ---
    useEffect(() => {
        if (currentLevel) {
            fetchUnitsForCurrentLevel();
        }
    }, [currentLevel, fetchUnitsForCurrentLevel]); // Add fetchUnitsForCurrentLevel to dependency array

    // Xử lý khi người dùng nhấn vào một tab level
    const handleLevelPress = (level) => {
        setCurrentLevel(level);
    };

    // Xử lý khi người dùng nhấn vào một Unit
    const handleUnitPress = (unitId, unitTitle) => {
        if (!currentLevel) {
            Alert.alert("Lỗi", "Không thể xác định cấp độ hiện tại để chuyển hướng.");
            return;
        }
        console.log(`UnitsScreen: Điều hướng đến TestScreen cho Unit: ${unitTitle} (Unit ID: ${unitId}, Level ID: ${currentLevel.level_id}, Level Name: ${currentLevel.name})`);
        navigation.navigate('TestScreen', {
            levelId: currentLevel.level_id,
            unitId: unitId,
            levelName: currentLevel.name,
        });
    };

    if (loading && !currentLevel && !error) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#1E90FF" />
                <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
        );
    }

    if (error && !currentLevel) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                {/* Call the now accessible fetchAllLevels */}
                <TouchableOpacity onPress={fetchAllLevels} style={styles.retryButton}>
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
                        <Image source={require('../images/login_signup/back.png')} style={styles.backIcon} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{currentLevel ? currentLevel.name : 'Units'}</Text>
                    <View style={{ width: 30 }} />
                </View>
                {/* Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
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
                </ScrollView>
            </View>
            {/* Nội dung trang */}
            <ScrollView style={styles.content}>
                {loading && currentLevel ? (
                    <View style={styles.centeredContent}>
                        <ActivityIndicator size="large" color="#1E90FF" />
                        <Text style={styles.loadingText}>Đang tải bài tập...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.centeredContent}>
                        <Text style={styles.errorText}>{error}</Text>
                        {/* Call the now accessible fetchUnitsForCurrentLevel */}
                        <TouchableOpacity onPress={fetchUnitsForCurrentLevel} style={styles.retryButton}>
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
                                key={item.unit_id}
                                style={styles.imageContainer}
                                onPress={() => handleUnitPress(item.unit_id, item.title)}
                            >
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
                        scrollEnabled={false}
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
        paddingHorizontal: 15,
        paddingBottom: 10,
    },
    backButton: {
        padding: 5,
    },
    backIcon: {
        width: 24,
        height: 24,
        tintColor: '#333',
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
        paddingHorizontal: 10,
    },
    tab: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginHorizontal: 5,
        backgroundColor: '#F0F0F0',
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
        marginTop: 155,
        paddingHorizontal: 10,
    },
    imageGrid: {
        justifyContent: 'space-between',
        paddingBottom: 20,
    },
    imageContainer: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        alignItems: 'center',
        margin: 5,
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
        backgroundColor: '#F7F7F7',
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        minHeight: 200,
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
        width: '100%',
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