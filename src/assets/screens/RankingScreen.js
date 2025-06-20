// RankingScreen
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Platform, UIManager, Dimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../utils/constants';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Define ITEM_HEIGHT and LIST_MAX_HEIGHT here, outside the component function
const ITEM_HEIGHT = 60; // Approximate height of each ranking item
const LIST_MAX_HEIGHT = ITEM_HEIGHT * 5; // Show 4 items at a time

const RankingScreen = () => {
    const navigation = useNavigation();
    const [rankingData, setRankingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);

    const top1BadgeImage = require('../images/top1.png');
    const top2BadgeImage = require('../images/top2.png');
    const top3BadgeImage = require('../images/top3.png');

    const frameImageRank1 = require('../images/gold_frame.png');
    const frameImageRank2 = require('../images/silver_frame.png');
    const frameImageRank3 = require('../images/bronze_frame.png');

    const getFullAvatarUrl = (relativePath) => {
        if (!relativePath) {
            return 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=No+Avatar';
        }
        if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
            return relativePath;
        }
        return `${BASE_URL}${relativePath}`;
    };

    const fetchRankingData = useCallback(async () => {
        setLoading(true);
        setError(null);
        let userIdFromStorage = null;

        try {
            const userInfoString = await AsyncStorage.getItem('userInfo');
            console.log('RankingScreen: Fetched userInfoString from AsyncStorage:', userInfoString);

            if (userInfoString) {
                const userInfo = JSON.parse(userInfoString);
                userIdFromStorage = userInfo.userId;
                console.log('RankingScreen: Extracted userId from userInfo:', userIdFromStorage);
            } else {
                console.warn('RankingScreen: Không tìm thấy userInfo trong AsyncStorage. Người dùng có thể chưa đăng nhập.');
            }
            setCurrentUserId(userIdFromStorage);

            const response = await fetch(`${BASE_URL}/api/ranking`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            const sortedData = data.sort((a, b) => b.total_score - a.total_score);
            setRankingData(sortedData);
        } catch (err) {
            console.error("Failed to fetch ranking data or user ID:", err);
            setError("Không thể tải bảng xếp hạng. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchRankingData();
            return () => {};
        }, [fetchRankingData])
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
                cardStyle = styles.rank2_3Card;
                badgeImage = top2BadgeImage;
                break;
            case 3:
                frameSource = frameImageRank3;
                frameStyle = styles.frame_rank3;
                avatarStyle = styles.avatar_rank3;
                cardStyle = styles.rank2_3Card;
                badgeImage = top3BadgeImage;
                break;
            default:
                return null;
        }

        return (
            <View key={user.user_id} style={[styles.topUserCard, cardStyle]}>
                <Image source={badgeImage} style={styles.topBadge} />
                <View style={[styles.avatarFrameWrapper, frameStyle]}>
                    <Image source={frameSource} style={[styles.woodenFrame, frameStyle]} />
                    <Image
                        source={{ uri: getFullAvatarUrl(user.profile_image_url) }}
                        style={[styles.avatarInsideFrame, avatarStyle]}
                        onError={() => console.log(`Error loading avatar for rank ${rank}`)}
                    />
                </View>
                <Text style={[styles.topUsername, rank === 1 && styles.rank1Username]}>{user.username}</Text>
                <Text style={[styles.topScore, rank === 1 && styles.rank1Score]}>{user.total_score} điểm</Text>
            </View>
        );
    };

    const remainingRankingData = rankingData.slice(3);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Bảng Xếp Hạng</Text>
                <View style={{ width: 30 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {rankingData.length > 0 ? (
                    <>
                        <View style={styles.top3Container}>
                            {rankingData[1] && renderTopUserCard(rankingData[1], 2)}
                            {rankingData[0] && renderTopUserCard(rankingData[0], 1)}
                            {rankingData[2] && renderTopUserCard(rankingData[2], 3)}
                        </View>

                        <View style={[styles.rankingListContainer, { maxHeight: LIST_MAX_HEIGHT }]}>
                            <View style={styles.rankingHeaderRow}>
                                <Text style={styles.rankingHeaderRank}>Hạng</Text>
                                <Text style={styles.rankingHeaderName}>Người dùng</Text>
                                <Text style={styles.rankingHeaderScore}>Điểm</Text>
                            </View>
                            <ScrollView nestedScrollEnabled={true}>
                                {remainingRankingData.length > 0 ? (
                                    remainingRankingData.map((user, index) => (
                                        <View
                                            key={user.user_id}
                                            style={[
                                                styles.rankingItem,
                                                (index + 3) % 2 === 0 ? styles.rankingItemEven : styles.rankingItemOdd,
                                                user.user_id === currentUserId && styles.currentUserHighlight
                                            ]}
                                        >
                                            <Text style={styles.rankingItemRank}>{index + 4}</Text>
                                            <View style={styles.rankingItemUser}>
                                                <Image
                                                    source={{ uri: getFullAvatarUrl(user.profile_image_url) }}
                                                    style={styles.rankingItemAvatar}
                                                    onError={() => console.log(`Error loading avatar for user ${user.username}`)}
                                                />
                                                <Text style={styles.rankingItemUsername} numberOfLines={1}>{user.username}</Text>
                                            </View>
                                            <Text style={styles.rankingItemScore}>{user.total_score}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.noMoreDataText}>Không còn người dùng nào trong bảng xếp hạng.</Text>
                                )}
                            </ScrollView>
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
    scrollContent: {
        paddingVertical: 20,
        paddingHorizontal: 15,
    },
    top3Container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
        width: '32%',
        paddingVertical: 10,
        borderRadius: 10,
    },
    rank1Card: {
        transform: [{ translateY: -30 }],
        zIndex: 2,
    },
    rank2_3Card: {
        // No specific transform needed here, aligned by parent's flex-end
    },
    topBadge: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
    },
    avatarFrameWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        position: 'relative',
    },
    woodenFrame: {
        resizeMode: 'contain',
        position: 'absolute',
        zIndex: 1,
    },
    avatarInsideFrame: {
        borderRadius: 999,
        backgroundColor: '#E0E0E0',
        position: 'absolute',
        zIndex: 0,
    },
    frame_rank1: {
        width: 130,
        height: 130,
    },
    avatar_rank1: {
        width: 90,
        height: 90,
    },
    frame_rank2: {
        width: 110,
        height: 110,
    },
    avatar_rank2: {
        width: 75,
        height: 75,
    },
    frame_rank3: {
        width: 95,
        height: 95,
    },
    avatar_rank3: {
        width: 65,
        height: 65,
    },
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
        // maxHeight: LIST_MAX_HEIGHT, // This is applied inline in the JSX
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
        height: ITEM_HEIGHT,
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
    noMoreDataText: {
        fontSize: 15,
        color: '#777',
        textAlign: 'center',
        marginTop: 20,
    },
});

export default RankingScreen;