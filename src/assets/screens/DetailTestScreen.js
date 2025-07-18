import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BASE_URL } from '../utils/constants';
import { apiCall } from '../utils/api'; // Import apiCall

const { width, height } = Dimensions.get('window');

const DetailTestScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();

    // Destructure route.params to get test details and the onGoBack callback
    const { testId, testTitle, description, questionCount, playCount, imageUrl, levelName, onGoBack } = route.params;
    // State to manage currentPlayCount, initialized with playCount from route.params or 0
    const [currentPlayCount, setCurrentPlayCount] = useState(playCount || 0);

    // Function to construct the full image URL
    const getFullImageUrl = (imageFileName) => {
        if (!imageFileName) return '';
        if (imageFileName.startsWith('http')) return imageFileName;
        return `${BASE_URL}${imageFileName}`;
    };

    // Handler for starting the test
    const handleStartTest = async () => {
        try {
            // Call API to increment play_count for the current test
            const response = await apiCall('POST', `/tests/${testId}/start`);
            if (response.ok) {
                console.log(`Play count for test ${testId} incremented.`);
                // Update the local state for play_count
                setCurrentPlayCount(prevCount => prevCount + 1);
                // If a callback is provided, call it to refresh data in the previous screen
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

        // Navigate to the Questions screen after attempting to update play count
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

                {/* Question Count Section */}
                <View style={styles.infoRow}>
                    <Image source={require('../images/question.png')} style={styles.infoIcon} />
                    <View>
                        <Text style={styles.infoMainText}>{questionCount || 'Đang cập nhật'} Câu hỏi</Text>
                        <Text style={styles.infoSubText}>Bạn sẽ được 10 điểm cho mỗi câu hỏi</Text>
                    </View>
                </View>

                {/* Play Count Section */}
                <View style={styles.infoRow}>
                    <Image source={require('../images/group.png')} style={styles.infoIcon} />
                    <View>
                        <Text style={styles.infoMainText}>Bạn đã làm {currentPlayCount} lần</Text>
                        <Text style={styles.infoSubText}>Tổng số lần đã làm</Text>
                    </View>
                </View>
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
        backgroundColor: '#DDE5FF',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    headerImageContainer: {
        width: '100%',
        height: 230,
    },
    headerImage: {
        width: '100%',
        height: '100%',
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
        top: 20,
        left: 15,
        padding: 5,
        zIndex: 2,
    },
    backIcon: {
        width: 24,
        height: 24,
        tintColor: '#000',
    },
    content: {
        flex: 1,
        width: '100%',
        backgroundColor: '#DDE5FF',
        paddingVertical: 30,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 10,
        textAlign: 'left',
    },
    description: {
        fontSize: 18,
        color: '#000',
        marginBottom: 10,
    },
    startButton: {
        width: '90%',
        paddingVertical: 15,
        backgroundColor: '#5A65EA',
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    startButtonText: {
        fontSize: 18,
        color: '#FFF',
        fontWeight: 'bold',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    infoIcon: {
        width: 40,
        height: 40,
        marginRight: 15,
        resizeMode: 'contain',
        tintColor: '#5A65EA',
    },
    infoMainText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    infoSubText: {
        fontSize: 14,
        color: '#777',
    },
});

export default DetailTestScreen;