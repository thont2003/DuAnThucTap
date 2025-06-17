import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BASE_URL } from '../utils/constants';
import { apiCall } from '../utils/api'; // Import apiCall

const { width, height } = Dimensions.get('window');

const DetailTestScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();

    const { testId, testTitle, description, questionCount, playCount, imageUrl, levelName, onGoBack } = route.params;
    const [currentPlayCount, setCurrentPlayCount] = useState(playCount || 0); // State to manage play_count

    const getFullImageUrl = (imageFileName) => {
        if (!imageFileName) return '';
        if (imageFileName.startsWith('http')) return imageFileName;
        return `${BASE_URL}/images/${imageFileName}`;
    };

    const handleStartTest = async () => {
        // Increment play_count on the backend
        try {
            const response = await apiCall('POST', `/tests/${testId}/start`);
            if (response.ok) {
                console.log(`Play count for test ${testId} incremented.`);
                // Update the local state for play_count
                setCurrentPlayCount(prevCount => prevCount + 1);
                // Call the callback to refresh tests in TestScreen if available
                if (onGoBack) {
                    onGoBack();
                }
            } else {
                const message = response.data?.error || response.data?.message || 'Không thể cập nhật số lần làm.';
                console.error('Failed to increment play count:', message);
                Alert.alert('Lỗi', `Không thể cập nhật số lần làm: ${message}`);
            }
        } catch (error) {
            console.error('Error incrementing play count:', error);
            Alert.alert('Lỗi', 'Không thể kết nối đến server để cập nhật số lần làm.');
        }

        // Navigate to QuestionsScreen
        navigation.navigate('Questions', {
            testId: testId,
            testTitle: testTitle,
            levelName: levelName,
        });
    };

    return (
        <View style={styles.container}>
            {/* Header Image Section */}
            <View style={styles.headerImageContainer}>
                {imageUrl ? (
                    <Image
                        source={{ uri: getFullImageUrl(imageUrl) }}
                        style={styles.headerImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.headerImagePlaceholder}>
                        <Text>Không có ảnh</Text>
                    </View>
                )}
                {/* Back button */}
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Image
                        source={require('../images/login_signup/back.png')}
                        style={styles.backIcon}
                    />
                </TouchableOpacity>
            </View>

            {/* Content Section */}
            <View style={styles.content}>
                <Text style={styles.title}>{testTitle || 'Title'}</Text>
                <Text style={styles.description}>{description}</Text>
                <Text style={styles.stats}>Số câu hỏi: {questionCount || 'Đang cập nhật'}</Text>
                <Text style={styles.stats}>Số lần làm: {currentPlayCount}</Text>
            </View>

            {/* Start Button */}
            <TouchableOpacity style={styles.startButton} onPress={handleStartTest}>
                <Text style={styles.startButtonText}>Bắt đầu</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#DDE5FF', // same background as image
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    headerImageContainer: {
        width: '100%', // Use 100% width for responsiveness
        height: 230,
    },
    headerImage: {
        width: '100%',
        height: '100%', // Take full height of its container
    },
    headerImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E0E0E0',
    },
    backButton: {
        position: 'absolute',
        top: 50, // Điều chỉnh top để tránh thanh trạng thái (status bar)
        left: 15,
        padding: 5,
        zIndex: 2,
    },
    backIcon: {
        width: 24,
        height: 24,
        tintColor: '#000', // Đảm bảo icon có màu sắc rõ ràng trên nền ảnh
    },
    content: {
        flex: 1,
        width: '90%',
        backgroundColor: '#DDE5FF',
        paddingVertical: 30,
        paddingHorizontal: 20, // Thêm padding ngang
    },
    title: {
        fontSize: 24, // Tăng kích thước chữ tiêu đề
        fontWeight: 'bold', // In đậm tiêu đề
        color: '#000',
        marginBottom: 10, // Tăng khoảng cách dưới tiêu đề
        textAlign: 'center', // Căn giữa tiêu đề
    },
    description: {
        fontSize: 18, // Tăng kích thước chữ tiêu đề
        color: '#000',
        marginBottom: 10, // Tăng khoảng cách dưới tiêu đề
    },
    stats: { // Thêm style cho phần thống kê số câu hỏi/lần làm
        fontSize: 16,
        color: '#555',
        marginBottom: 5,
        textAlign: 'center',
    },
    startButton: {
        width: '90%', // Chiếm 90% chiều rộng màn hình
        paddingVertical: 15,
        backgroundColor: '#5A65EA',
        borderRadius: 15, // Dùng một borderRadius duy nhất cho cả 4 góc
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20, // Thêm khoảng cách dưới nút
        elevation: 5, // Thêm hiệu ứng đổ bóng cho Android
        shadowColor: '#000', // Thêm hiệu ứng đổ bóng cho iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    startButtonText: {
        fontSize: 18,
        color: '#FFF',
        fontWeight: 'bold',
    },
});

export default DetailTestScreen;