// HistoryScreen
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    RefreshControl, // For pull-to-refresh
    Platform, // Import Platform for OS-specific styling
    StatusBar, // Import StatusBar
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCall } from '../utils/api'; // Ensure correct path

const HistoryScreen = () => {
    const navigation = useNavigation();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false); // State for RefreshControl
    const [currentUserId, setCurrentUserId] = useState(null); // Store userId from AsyncStorage

    // Function to format timestamp for display
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        // Format to a more readable string, e.g., "DD/MM/YYYY HH:MM"
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    };

    const fetchUserHistory = useCallback(async () => {
        setLoading(true);
        setError(null);
        let userId = null;
        try {
            // Get JSON string of 'userInfo' from AsyncStorage
            const userInfoString = await AsyncStorage.getItem('userInfo');
            console.log('HistoryScreen: Fetched userInfoString from AsyncStorage:', userInfoString);

            if (userInfoString) {
                const userInfo = JSON.parse(userInfoString);
                userId = userInfo.userId; // Extract userId from userInfo object
                console.log('HistoryScreen: Extracted userId from userInfo:', userId);
            }

            if (!userId) {
                setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
                // Optional: navigate to login screen if userId is missing
                // navigation.replace('Login');
                return;
            }
            setCurrentUserId(userId); // Save userId to state

            const response = await apiCall('GET', `/history/user/${userId}`);
            console.log('HistoryScreen: API response for history:', response);

            if (response.ok && response.data) {
                setHistory(response.data);
            } else {
                const errorMessage = response.data?.error || 'Không thể tải lịch sử làm bài.';
                setError(errorMessage);
                Alert.alert('Lỗi', errorMessage);
            }
        } catch (err) {
            console.error('HistoryScreen: Error fetching history:', err);
            setError('Không thể kết nối đến server để tải lịch sử làm bài.');
            Alert.alert('Lỗi', 'Không thể kết nối đến server để tải lịch sử làm bài.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Use useFocusEffect to refetch data whenever the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchUserHistory();
            return () => {
                // Optional cleanup
            };
        }, [fetchUserHistory])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchUserHistory();
    }, [fetchUserHistory]);

    const handleViewResult = async (historyItem) => {
        setLoading(true);
        try {
            // Fetch ALL questions for the specific test_id
            const questionsResponse = await apiCall('GET', `/tests/${historyItem.test_id}/questions`);

            if (questionsResponse.ok && questionsResponse.data) {
                const allQuestionsForTest = questionsResponse.data;

                // Navigate to ResultScreen with all necessary data
                navigation.navigate('Result', {
                    testId: historyItem.test_id,
                    testTitle: historyItem.test_title,
                    totalQuestions: historyItem.total_questions,
                    correctAnswers: historyItem.correct_answers,
                    userAnswersHistory: historyItem.user_answers, // This is the JSONB parsed array
                    allQuestions: allQuestionsForTest, // Pass the fetched detailed questions
                });
            } else {
                const errorMessage = questionsResponse.data?.error || 'Không thể tải chi tiết câu hỏi cho bài kiểm tra này.';
                Alert.alert('Lỗi', errorMessage);
            }
        } catch (err) {
            console.error('HistoryScreen: Error fetching questions for ResultScreen:', err);
            Alert.alert('Lỗi', 'Không thể kết nối đến server để xem chi tiết kết quả.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1E90FF" />
                <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={fetchUserHistory} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.fullScreenContainer}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="white" // Set status bar background color to white
                translucent={false} // Important for Android to apply background color correctly
            />
            <View style={styles.headerWrapper}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Lịch sử bài làm</Text>
                    <View style={{ width: 30 }} />
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollViewContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {history.length === 0 ? (
                    <View style={styles.noHistoryContainer}>
                        <Image
                            source={require('../images/research.png')} // You need to add this icon
                            style={styles.emptyHistoryIcon}
                        />
                        <Text style={styles.noHistoryText}>Chưa có lịch sử làm bài nào.</Text>
                        <Text style={styles.noHistorySubText}>Hãy bắt đầu làm các bài kiểm tra nhé!</Text>
                    </View>
                ) : (
                    <>
                        {history.map((item) => (
                            <TouchableOpacity
                                key={item.history_id}
                                style={styles.historyItem}
                                onPress={() => handleViewResult(item)}
                            >
                                <View style={styles.itemHeader}>
                                    <Text style={styles.testTitle}>{item.test_title}</Text>
                                    <Text style={styles.scoreText}>Điểm: {item.score}</Text>
                                </View>
                                <View style={styles.itemDetails}>
                                    <Text style={styles.detailText}>Số câu đúng: {item.correct_answers}/{item.total_questions}</Text>
                                    <Text style={styles.detailText}>Thời gian: {formatTimestamp(item.taken_at)}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        backgroundColor: '#E0E5FF', // Light blue background for the entire screen below header
    },
    /*headerWrapper: { // New View to ensure white background behind status bar and header
        backgroundColor: 'white', // This will cover the status bar area
        // Add padding for Android's status bar height to prevent content overlap
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, 
        elevation: 4, // Add elevation for shadow effect
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        zIndex: 1, // Ensure header is above other content
    },*/
    header: {
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
    scrollViewContent: {
        flexGrow: 1,
        padding: 20,
        paddingTop: 10,
        backgroundColor: '#E0E5FF', // Background color for scrollable content area
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E0E5FF', // Updated to match content background
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
        backgroundColor: '#E0E5FF', // Updated to match content background
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
    noHistoryContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50, // Center better for empty state
    },
    emptyHistoryIcon: {
        width: 150,
        height: 150,
        resizeMode: 'contain',
        marginBottom: 20,
        tintColor: '#b0b0b0',
    },
    noHistoryText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#777',
        marginBottom: 10,
    },
    noHistorySubText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        lineHeight: 22,
    },
    loggedInUserText: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginBottom: 15,
        fontWeight: '500',
    },
    loggedInUsername: {
        fontWeight: 'bold',
        color: '#1E90FF',
    },
    historyItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        overflow: 'hidden', // Ensures shadow is clipped
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    testTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flexShrink: 1, // Allow text to shrink if long
    },
    scoreText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E90FF', // Blue color for score
        marginLeft: 10,
    },
    itemDetails: {
        marginTop: 5,
    },
    detailText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 3,
    },
});

export default HistoryScreen;
