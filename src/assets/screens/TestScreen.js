import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet, Dimensions, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiCall } from '../utils/api';
import { BASE_URL } from '../utils/constants';

const { width } = Dimensions.get('window');

const TestScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const scrollViewRef = useRef(null);

    // levelId, initialUnitId, và levelName được truyền từ màn hình trước
    const { levelId, unitId: initialUnitId, levelName } = route.params;

    const [units, setUnits] = useState([]);
    const [selectedUnitId, setSelectedUnitId] = useState(initialUnitId);
    const [tests, setTests] = useState([]);
    const [loadingUnits, setLoadingUnits] = useState(true);
    const [loadingTests, setLoadingTests] = useState(false);
    const [errorUnits, setErrorUnits] = useState(null);
    const [errorTests, setErrorTests] = useState(null);

    const getFullImageUrl = (imageFileName) => {
        if (!imageFileName) {
            return '';
        }
        if (imageFileName.startsWith('http://') || imageFileName.startsWith('https://')) {
            return imageFileName;
        }
        return `${BASE_URL}/images/${imageFileName}`;
    };

    // Define fetchTests as a useCallback hook to make it accessible and stable
    const fetchTests = useCallback(async () => {
        if (!selectedUnitId) {
            setTests([]);
            setLoadingTests(false); // Ensure loading is false if no unit is selected
            return;
        }

        setLoadingTests(true);
        setErrorTests(null);
        try {
            console.log(`TestScreen: Đang fetch tests cho unit ID: ${selectedUnitId}`);
            // Gọi API đến route /tests/:unit_id đã được thêm vào server.js
            const response = await apiCall('GET', `/tests/${selectedUnitId}`);
            console.log('TestScreen: Phản hồi API tests:', response);

            if (response.ok && response.data) {
                setTests(response.data);
            } else {
                const message = response.data?.error || response.data?.message || 'Không thể tải các bài tập.';
                setErrorTests(message);
                Alert.alert('Lỗi', message);
                console.error('TestScreen: Lỗi từ server khi fetch tests:', response.status, response.data);
            }
        } catch (err) {
            console.error('TestScreen: Lỗi khi fetch tests:', err);
            setErrorTests('Không thể kết nối đến server để tải bài tập.');
            Alert.alert('Lỗi', 'Không thể kết nối đến server để tải bài tập.');
        } finally {
            setLoadingTests(false);
        }
    }, [selectedUnitId]); // Recreate if selectedUnitId changes

    // Fetch units for the current level
    const fetchUnits = useCallback(async () => { // Thêm useCallback để đảm bảo stable
        setLoadingUnits(true);
        setErrorUnits(null);
        try {
            console.log(`TestScreen: Đang fetch units cho level ID: ${levelId}`);
            const response = await apiCall('GET', `/levels/${levelId}/units`);
            console.log('TestScreen: Phản hồi API units:', response);

            if (response.ok && response.data) {
                setUnits(response.data);
                if (initialUnitId && response.data.length > 0) {
                    const index = response.data.findIndex(unit => unit.unit_id === initialUnitId);
                    if (index !== -1) {
                        const UNIT_CARD_WIDTH = width / 3.5; // This might be needed for scrolling logic, but not for styling directly
                        const UNIT_CARD_MARGIN_HORIZONTAL = 5; // Same here
                        setTimeout(() => {
                            scrollViewRef.current?.scrollTo({
                                x: index * (UNIT_CARD_WIDTH + UNIT_CARD_MARGIN_HORIZONTAL * 2) - width / 2 + (UNIT_CARD_WIDTH / 2),
                                animated: true,
                            });
                        }, 100);
                    }
                } else if (!initialUnitId && response.data.length > 0) {
                    // Nếu không có initialUnitId, chọn unit đầu tiên làm mặc định
                    setSelectedUnitId(response.data[0].unit_id);
                }
            } else {
                const message = response.data?.error || response.data?.message || 'Không thể tải các unit.';
                setErrorUnits(message);
                Alert.alert('Lỗi', message);
                console.error('TestScreen: Lỗi từ server khi fetch units:', response.status, response.data);
            }
        } catch (err) {
            console.error('TestScreen: Lỗi khi fetch units:', err);
            setErrorUnits('Không thể kết nối đến server để tải units.');
            Alert.alert('Lỗi', 'Không thể kết nối đến server để tải units.');
        } finally {
            setLoadingUnits(false);
        }
    }, [levelId, initialUnitId]); // Dependencies cho fetchUnits

    // Effect để gọi fetchUnits khi levelId thay đổi
    useEffect(() => {
        if (levelId) {
            fetchUnits();
        }
    }, [levelId, fetchUnits]); // Thêm fetchUnits vào dependencies

    // Effect để gọi fetchTests khi selectedUnitId thay đổi
    useEffect(() => {
        // Chỉ fetch tests nếu có selectedUnitId và units đã được tải thành công
        if (selectedUnitId) {
            fetchTests();
        }
    }, [selectedUnitId, fetchTests]);

    const handleUnitPress = (unitId) => {
        setSelectedUnitId(unitId);
    };

    const handleTestPress = async (test) => {
        // Increment play_count on the backend
        try {
            const response = await apiCall('POST', `/tests/${test.test_id}/start`);
            if (response.ok) {
                console.log(`Play count for test ${test.test_id} incremented.`);
                // Optionally refetch tests to update the play_count immediately in the UI
                fetchTests();
            } else {
                console.error('Failed to increment play count:', response.data?.error || response.data?.message);
            }
        } catch (error) {
            console.error('Error incrementing play count:', error);
        }

        // NEW: Navigate to DetailTestScreen, passing all necessary test data as parameters
        navigation.navigate('DetailTest', {
            testId: test.test_id,
            testTitle: test.title,
            description: test.description,
            questionCount: test.question_count,
            playCount: test.play_count,
            imageUrl: test.image_url,
            levelId: levelId,      // Pass current levelId for context in DetailTestScreen
            levelName: levelName,  // Pass current levelName for context in DetailTestScreen
        });
    };

    return (
        <View style={testStyles.container}>
            {/* Header */}
            <View style={testStyles.header}>
                <View style={testStyles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={testStyles.backButton}>
                        {/* Đảm bảo đường dẫn ảnh avatar.png đúng */}
                        <Image source={require('../images/login_signup/back.png')} style={testStyles.backIcon} />
                    </TouchableOpacity>
                    <Text style={testStyles.headerTitle}>{levelName || 'Bài Tập'}</Text>
                    <View style={{ width: 30 }} />
                </View>
                {/* Horizontal Unit Navigation (now styled as tabs) */}
                {loadingUnits ? (
                    <View style={testStyles.tabLoaderContainer}>
                        <ActivityIndicator size="small" color="#1E90FF" />
                    </View>
                ) : errorUnits ? (
                    <View style={testStyles.tabErrorContainer}>
                        <Text style={testStyles.tabErrorText}>{errorUnits}</Text>
                        <TouchableOpacity onPress={fetchUnits} style={testStyles.retryButtonSmall}>
                            <Text style={testStyles.retryButtonTextSmall}>Thử lại tải Units</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView
                        ref={scrollViewRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={testStyles.tabContainer}
                    >
                        {units.map((unit) => (
                            <TouchableOpacity
                                key={unit.unit_id.toString()}
                                style={[
                                    testStyles.tab,
                                    selectedUnitId === unit.unit_id && testStyles.activeTab,
                                ]}
                                onPress={() => handleUnitPress(unit.unit_id)}
                            >
                                <Text style={[
                                    testStyles.tabText,
                                    selectedUnitId === unit.unit_id && testStyles.activeTabText,
                                ]}>
                                    {unit.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* Tests List */}
            <ScrollView style={testStyles.testsListContainer}>
                {loadingTests ? (
                    <View style={testStyles.loadingContainer}>
                        <ActivityIndicator size="large" color="#1E90FF" />
                        <Text style={testStyles.loadingText}>Đang tải bài tập...</Text>
                    </View>
                ) : errorTests ? (
                    <View style={testStyles.errorContainer}>
                        <Text style={testStyles.errorText}>{errorTests}</Text>
                        <TouchableOpacity onPress={fetchTests} style={testStyles.retryButton}>
                            <Text style={testStyles.retryButtonText}>Thử lại tải Bài tập</Text>
                        </TouchableOpacity>
                    </View>
                ) : tests.length === 0 ? (
                    <View style={testStyles.noDataContainer}>
                        <Text style={testStyles.noDataText}>Không có bài tập nào cho Unit này.</Text>
                    </View>
                ) : (
                    tests.map((test) => (
                        <TouchableOpacity
                            key={test.test_id.toString()}
                            style={testStyles.testCard}
                            onPress={() => handleTestPress(test)} // Đây là dòng đã được thay đổi để điều hướng
                        >
                            {test.image_url ? (
                                <Image
                                    source={{ uri: getFullImageUrl(test.image_url) }}
                                    style={testStyles.testImage}
                                    onError={(e) => console.log('Lỗi tải ảnh Test:', e.nativeEvent.error, 'URL:', getFullImageUrl(test.image_url))}
                                />
                            ) : (
                                <View style={testStyles.testImagePlaceholder}>
                                    <Text style={testStyles.testImagePlaceholderText}>No Image</Text>
                                </View>
                            )}
                            <View style={testStyles.testInfo}>
                                <Text style={testStyles.testStats}>
                                    Số câu hỏi: {test.question_count || 0}
                                </Text>
                                <Text style={testStyles.testStats}>
                                    Số lần làm: {test.play_count || 0}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

const testStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E0E5FF',
    },
    header: {
        backgroundColor: '#FFFFFF',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        paddingTop: 40, // Adjust for status bar/safe area
        position: 'absolute', // Make header sticky
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
        justifyContent: 'flex-start', // Align tabs to start
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        paddingHorizontal: 10,
        alignItems: 'center', // Vertically center items in scroll view
    },
    tab: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 10,
        marginHorizontal: 5,
        backgroundColor: '#F0F0F0',
        minWidth: width / 4, // Ensure reasonable width for tabs
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: '#1E90FF',
        shadowColor: '#1E90FF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    tabText: {
        fontSize: 15,
        color: '#555',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    tabLoaderContainer: {
        height: 40, // Match height of tab container
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    tabErrorContainer: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        minHeight: 40,
    },
    tabErrorText: {
        fontSize: 14,
        color: 'red',
        textAlign: 'center',
        marginBottom: 5,
    },
    retryButtonSmall: {
        backgroundColor: '#1E90FF',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 5,
    },
    retryButtonTextSmall: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    testsListContainer: {
        flex: 1,
        paddingHorizontal: 15,
        paddingTop: 5, // Add padding to push content below the fixed header
        marginTop: 155, // Adjust this based on the actual height of your header
    },
    testCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
    },
    testImage: {
        width: 180,
        height: 80,
        borderRadius: 8,
        borderColor: '#ccc',
        borderWidth: 1,
        marginRight: 15,
        resizeMode: 'cover',
        backgroundColor: '#f0f0f0',
    },
    testImagePlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 8,

        marginRight: 15,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    testImagePlaceholderText: {
        fontSize: 12,
        color: '#888',
    },
    testInfo: {
        flex: 1,
    },
    testStats: {
        marginLeft: 25,
        fontSize: 16,
        color: '#000000',
        marginTop: 2,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
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
        marginTop: 50,
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
        marginBottom: 15,
    },
    retryButton: {
        backgroundColor: '#1E90FF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    noDataText: {
        fontSize: 16,
        color: '#777',
    },
});

export default TestScreen;