import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Platform, UIManager } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../utils/constants';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const RankingScreen = () => {
    const navigation = useNavigation();
    const [rankingData, setRankingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);

    // Dummy images for top 1, 2, 3 badges (keep these for the rank icons)
    const top1BadgeImage = require('../images/top1.png');
    const top2BadgeImage = require('../images/top2.png');
    const top3BadgeImage = require('../images/top3.png');

    // **NEW: Separate images for each rank's avatar frame**
    const frameImageRank1 = require('../images/gold_frame.png');   // <-- ĐƯỜNG DẪN KHUNG HẠNG 1
    const frameImageRank2 = require('../images/silver_frame.png'); // <-- ĐƯỜNG DẪN KHUNG HẠNG 2
    const frameImageRank3 = require('../images/bronze_frame.png'); // <-- ĐƯỜNG DẪN KHUNG HẠNG 3

    const getFullAvatarUrl = (avatarFileName) => {
        if (!avatarFileName) {
            return 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=No+Avatar';
        }
        if (avatarFileName.startsWith('http://') || avatarFileName.startsWith('https://')) {
            return avatarFileName;
        }
        return `${BASE_URL}/avatars/${avatarFileName}`;
    };

    // Refactored data fetching function
    const fetchRankingData = async () => {
        setLoading(true);
        setError(null);
        try {
            const storedUserId = await AsyncStorage.getItem('userId');
            if (storedUserId) {
                setCurrentUserId(parseInt(storedUserId, 10));
            }

            const response = await fetch(`${BASE_URL}/api/ranking`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            const sortedData = data.sort((a, b) => b.total_score - a.total_score);
            setRankingData(sortedData);
        } catch (err) {
            console.error("Failed to fetch ranking data or user ID:", err);
            setError("Không thể tải bảng xếp hạng. Vui lòng thử lại sau sau.");
        } finally {
            setLoading(false);
        }
    };

    // Use useFocusEffect to re-fetch data whenever the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchRankingData();
            // Optional: You can return a cleanup function here if needed
            return () => {
                // For example, if you have listeners that need to be removed
            };
        }, []) // Empty dependency array means this effect runs once when mounted and every time it focuses
    );

    if (loading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#1E90FF" />
                <Text style={styles.loadingText}>Đang tải bảng xếp hạng...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centeredContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchRankingData}>
                    <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Helper function to render a top user card
    const renderTopUserCard = (user, rank) => {
        if (!user) return null;

        let frameSource, frameStyle, avatarStyle, cardStyle;
        let badgeImage;

        switch (rank) {
            case 1:
                frameSource = frameImageRank1;
                frameStyle = styles.frame_rank1;
                avatarStyle = styles.avatar_rank1;
                cardStyle = styles.rank1Card;
                badgeImage = top1BadgeImage;
                break;
            case 2:
                frameSource = frameImageRank2;
                frameStyle = styles.frame_rank2;
                avatarStyle = styles.avatar_rank2;
                badgeImage = top2BadgeImage;
                break;
            case 3:
                frameSource = frameImageRank3;
                frameStyle = styles.frame_rank3;
                avatarStyle = styles.avatar_rank3;
                badgeImage = top3BadgeImage;
                break;
            default:
                // Fallback for ranks beyond top 3 if needed, or error
                return null;
        }

        return (
            <View style={[styles.topUserCard, cardStyle]}>
                <Image source={badgeImage} style={styles.topBadge} />
                <View style={[styles.avatarFrameWrapper, frameStyle]}>
                    <Image source={frameSource} style={[styles.woodenFrame, frameStyle]} />
                    <Image
                        source={{ uri: getFullAvatarUrl(user.avatar_url) }}
                        style={[styles.avatarInsideFrame, avatarStyle]}
                        onError={() => console.log(`Error loading avatar for rank ${rank}`)}
                    />
                </View>
                <Text style={[styles.topUsername, rank === 1 && styles.rank1Username]}>{user.username}</Text>
                <Text style={[styles.topScore, rank === 1 && styles.rank1Score]}>{user.total_score} điểm</Text>
            </View>
        );
    };


    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Image source={require('../images/login_signup/back.png')} style={styles.backIcon} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Bảng Xếp Hạng</Text>
                <View style={{ width: 30 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {rankingData.length > 0 ? (
                    <>
                        <View style={styles.top3Container}>
                            {renderTopUserCard(rankingData[1], 2)}
                            {renderTopUserCard(rankingData[0], 1)}
                            {renderTopUserCard(rankingData[2], 3)}
                        </View>

                        <View style={styles.rankingListContainer}>
                            <View style={styles.rankingHeaderRow}>
                                <Text style={styles.rankingHeaderRank}>Hạng</Text>
                                <Text style={styles.rankingHeaderName}>Người dùng</Text>
                                <Text style={styles.rankingHeaderScore}>Điểm</Text>
                            </View>
                            {rankingData.map((user, index) => (
                                <View
                                    key={user.user_id}
                                    style={[
                                        styles.rankingItem,
                                        index % 2 === 0 ? styles.rankingItemEven : styles.rankingItemOdd,
                                        user.user_id === currentUserId && styles.currentUserHighlight
                                    ]}
                                >
                                    <Text style={styles.rankingItemRank}>{index + 1}</Text>
                                    <View style={styles.rankingItemUser}>
                                        <Image
                                            source={{ uri: getFullAvatarUrl(user.avatar_url) }}
                                            style={styles.rankingItemAvatar}
                                            onError={() => console.log(`Error loading avatar for user ${user.username}`)}
                                        />
                                        <Text style={styles.rankingItemUsername} numberOfLines={1}>{user.username}</Text>
                                    </View>
                                    <Text style={styles.rankingItemScore}>{user.total_score}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                ) : (
                    <Text style={styles.noDataText}>Chưa có dữ liệu xếp hạng nào.</Text>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E0E5FF',
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F7F7F7',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    errorText: {
        fontSize: 18,
        color: 'red',
        textAlign: 'center',
        marginHorizontal: 20,
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: '#1E90FF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 50,
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        zIndex: 1,
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
    scrollContent: {
        paddingVertical: 20,
        paddingHorizontal: 15,
    },
    top3Container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        marginBottom: 30,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        paddingVertical: 20,
        paddingHorizontal: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    topUserCard: {
        alignItems: 'center',
        width: '30%',
        paddingVertical: 10,
        borderRadius: 10,
    },
    rank1Card: {
        transform: [{ translateY: -20 }],
        zIndex: 2,
    },
    topBadge: {
        width: 100,
        height: 100,
        resizeMode: 'contain',

    },
    // Common wrapper for avatar and frame
    avatarFrameWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        position: 'relative', // Allows absolute positioning of children
    },
    // Common style for the wooden frame image itself
    woodenFrame: {
        resizeMode: 'contain', // Adjust as needed
        position: 'absolute',
        zIndex: 1, // Frame is above avatar
    },
    // Common style for the avatar image inside the frame
    avatarInsideFrame: {
        borderRadius: 999, // Large enough to ensure a perfect circle
        backgroundColor: '#E0E0E0', // Placeholder background
        position: 'absolute',
        zIndex: 0, // Avatar is below frame
    },

    // **SPECIFIC STYLES FOR EACH RANK'S FRAME AND AVATAR**
    // Rank 1
    frame_rank1: {
        width: 130, // Larger frame
        height: 130,
    },
    avatar_rank1: {
        width: 90, // Larger avatar to fit inside
        height: 90,
    },

    // Rank 2
    frame_rank2: {
        width: 110, // Medium frame
        height: 110,
    },
    avatar_rank2: {
        width: 75, // Medium avatar
        height: 75,
    },

    // Rank 3
    frame_rank3: {
        width: 95, // Smaller frame
        height: 95,
    },
    avatar_rank3: {
        width: 65, // Smaller avatar
        height: 65,
    },
    // END SPECIFIC STYLES

    topUsername: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 3,
    },
    rank1Username: {
        fontSize: 18,
        color: '#1E90FF',
    },
    topScore: {
        fontSize: 15,
        color: '#666',
        fontWeight: '600',
    },
    rank1Score: {
        fontSize: 16,
        color: '#333',
        fontWeight: 'bold',
    },
    rankingListContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    rankingHeaderRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        marginBottom: 10,
    },
    rankingHeaderRank: {
        width: 50,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    rankingHeaderName: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 10,
    },
    rankingHeaderScore: {
        width: 70,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'right',
        marginRight: 5,
    },
    rankingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 5,
        paddingHorizontal: 5,
    },
    rankingItemEven: {
        backgroundColor: '#F0F8FF',
    },
    rankingItemOdd: {
        backgroundColor: '#E6F3FF',
    },
    currentUserHighlight: {
        backgroundColor: '#D1FFC8',
        borderWidth: 2,
        borderColor: '#28A745',
    },
    rankingItemRank: {
        width: 50,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E90FF',
        textAlign: 'center',
    },
    rankingItemUser: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    rankingItemAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#D0D0D0',
    },
    rankingItemUsername: {
        fontSize: 16,
        color: '#444',
        flexShrink: 1,
    },
    rankingItemScore: {
        width: 70,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#555',
        textAlign: 'right',
        marginRight: 5,
    },
    noDataText: {
        fontSize: 18,
        color: '#777',
        textAlign: 'center',
        marginTop: 50,
    },
});

export default RankingScreen;