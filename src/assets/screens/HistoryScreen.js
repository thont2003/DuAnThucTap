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
    RefreshControl,
    Platform,
    StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCall } from '../utils/api';

const HistoryScreen = () => {
    const navigation = useNavigation();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
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
            const userInfoString = await AsyncStorage.getItem('userInfo');
            console.log('HistoryScreen: Fetched userInfoString from AsyncStorage:', userInfoString);

            if (userInfoString) {
                const userInfo = JSON.parse(userInfoString);
                userId = userInfo.userId;
                console.log('HistoryScreen: Extracted userId from userInfo:', userId);
            }

            if (!userId) {
                setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
                return;
            }
            setCurrentUserId(userId);

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

    useFocusEffect(
        useCallback(() => {
            fetchUserHistory();
            return () => {};
        }, [fetchUserHistory])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchUserHistory();
    }, [fetchUserHistory]);

    const handleViewResult = async (historyItem) => {
        setLoading(true);
        try {
            const questionsResponse = await apiCall('GET', `/tests/${historyItem.test_id}/questions`);

            if (questionsResponse.ok && questionsResponse.data) {
                const allQuestionsForTest = questionsResponse.data;

                navigation.navigate('Result', {
                    testId: historyItem.test_id,
                    testTitle: historyItem.test_title,
                    totalQuestions: historyItem.total_questions,
                    correctAnswers: historyItem.correct_answers,
                    userAnswersHistory: historyItem.user_answers,
                    allQuestions: allQuestionsForTest,
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
                backgroundColor="white"
                translucent={false}
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
                            source={require('../images/research.png')}
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
                                    {/* Hiển thị tên Level */}
                                    {item.level_name && (
                                        <Text style={styles.detailText}>Cấp độ: {item.level_name}</Text>
                                    )}
                                    {/* Hiển thị tên Unit (chỉ nếu có) */}
                                    {item.unit_name && (
                                        <Text style={styles.detailText}>Đơn vị: {item.unit_name}</Text>
                                    )}
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
        backgroundColor: '#E0E5FF',
    },
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
        backgroundColor: '#E0E5FF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E0E5FF',
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
        backgroundColor: '#E0E5FF',
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
        marginTop: 50,
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
        overflow: 'hidden',
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
        flexShrink: 1,
    },
    scoreText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E90FF',
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