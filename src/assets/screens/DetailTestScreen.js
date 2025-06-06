import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BASE_URL } from '../utils/constants';

const { width, height } = Dimensions.get('window');

const DetailTestScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();

    const { testId, testTitle, imageUrl, levelName } = route.params;

    const getFullImageUrl = (imageFileName) => {
        if (!imageFileName) return '';
        if (imageFileName.startsWith('http')) return imageFileName;
        return `${BASE_URL}/images/${imageFileName}`;
    };

    const handleStartTest = () => {
        alert(`Bắt đầu làm bài kiểm tra: ${testTitle}`);
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
            </View>

            {/* Start Button */}
            <TouchableOpacity style={styles.startButton} onPress={handleStartTest}>
                <Text style={styles.startButtonText}>Start</Text>
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
        width: 410,
        height: 230,
    },
    headerImage: {
        width: '100%',
        height: 230,
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
        top: 15,
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
        width: '90%',
        backgroundColor: '#DDE5FF',
        paddingVertical: 30,
    },
    title: {
        fontSize: 18,
        color: '#000',
        marginBottom: 5,
    },
    startButton: {
        width: '100%',
        paddingVertical: 15,
        backgroundColor: '#5A65EA',
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        borderBottomRightRadius: 15,
        borderBottomLeftRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    startButtonText: {
        fontSize: 18,
        color: '#FFF',
        fontWeight: 'bold',
    },
});

export default DetailTestScreen;
