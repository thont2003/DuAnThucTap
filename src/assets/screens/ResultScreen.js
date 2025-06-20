import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    LayoutAnimation,
    Platform,
    UIManager,
    Alert
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { BASE_URL } from '../utils/constants';

// Import Sound library
import Sound from 'react-native-sound';

// Ensure Sound is ready for playback (optional, but good practice)
Sound.setCategory('Playback');

// Cần cho LayoutAnimation trên Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ResultScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const {
        testId,
        testTitle,
        totalQuestions,
        correctAnswers,
        totalScore = Math.round((correctAnswers / totalQuestions) * 100), // Sử dụng giá trị mặc định nếu không có từ params
        userAnswersHistory, // Lịch sử câu trả lời của người dùng
        allQuestions // Tất cả câu hỏi gốc
    } = route.params;

    const [showIncorrectOnly, setShowIncorrectOnly] = useState(false);
    const [incorrectQuestions, setIncorrectQuestions] = useState([]);

    // State for audio
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const soundRef = useRef(null); // Ref to hold the Sound object

    useEffect(() => {
        // Lọc ra các câu hỏi mà người dùng trả lời sai
        const filteredIncorrect = allQuestions.filter(question => {
            const userAnswer = userAnswersHistory.find(ans => ans.questionId === question.question_id);
            // Một câu hỏi là sai nếu nó không được trả lời (userAnswer là undefined) hoặc isCorrect là false
            return !userAnswer || !userAnswer.isCorrect;
        });
        setIncorrectQuestions(filteredIncorrect);
    }, [allQuestions, userAnswersHistory]);

    // Helper to get full image URL
    const getFullImageUrl = (imageFileName) => {
        if (!imageFileName) return '';
        if (imageFileName.startsWith('http://') || imageFileName.startsWith('https://')) {
            return imageFileName;
        }
        return `${BASE_URL}${imageFileName}`; // Assuming images are in /images directory
    };

    // Helper to get full audio URL
    const getFullAudioUrl = (audioFileName) => {
        if (!audioFileName) return '';
        if (audioFileName.startsWith('http://') || audioFileName.startsWith('https://')) {
            return audioFileName;
        }
        // Assuming audio files are in a /audio/ directory relative to BASE_URL
        return `${BASE_URL}/audio/${audioFileName}`;
    };

    // Function to stop and release the current sound
    const stopAndReleaseSound = useCallback(() => {
        const sound = soundRef.current;
        if (sound) {
            sound.stop(() => {
                if (soundRef.current === sound) { // Ensure we are releasing the sound we intended to stop
                    sound.release();
                    soundRef.current = null;
                    setIsPlayingAudio(false);
                    console.log('Audio stopped and released');
                }
            });
        }
    }, []);

    // Function to load and play audio
    const playAudio = useCallback((audioPath) => {
        // Stop any currently playing audio before starting a new one
        stopAndReleaseSound();

        if (!audioPath) {
            console.warn('No audio path provided to play.');
            return;
        }

        const audioUrl = getFullAudioUrl(audioPath);
        console.log('Attempting to load audio from:', audioUrl);

        soundRef.current = new Sound(audioUrl, null, (error) => {
            if (error) {
                console.error('Failed to load the sound:', error);
                Alert.alert('Lỗi tải âm thanh', 'Không thể tải tệp âm thanh. Vui lòng thử lại.');
                stopAndReleaseSound(); // Ensure resource is released even on load error
                return;
            }
            console.log('Sound loaded successfully. Duration:', soundRef.current.getDuration(), 'seconds');

            // Play the sound
            soundRef.current.play((success) => {
                if (success) {
                    console.log('Successfully finished playing!');
                } else {
                    console.error('Playback failed due to audio decoding errors.');
                    Alert.alert('Lỗi phát âm thanh', 'Không thể phát tệp âm thanh.');
                }
                setIsPlayingAudio(false); // Reset play state when finished
                stopAndReleaseSound(); // Release resource after playback completes
            });
            setIsPlayingAudio(true); // Set playing state to true
        });
    }, [stopAndReleaseSound]);

    const toggleAudioPlayback = (audioPath) => {
        // If the current audio is playing AND it's the same audio file being requested, then pause it.
        // Otherwise, stop the current and play the new one.
        if (isPlayingAudio && soundRef.current && soundRef.current._url === getFullAudioUrl(audioPath)) {
            stopAndReleaseSound();
        } else {
            playAudio(audioPath);
        }
    };

    // Cleanup when component unmounts
    useEffect(() => {
        return () => {
            stopAndReleaseSound();
        };
    }, [stopAndReleaseSound]);

    // Use useFocusEffect to stop audio when screen loses focus (e.g., navigating back or to another tab)
    useFocusEffect(
        useCallback(() => {
            // This callback is called when the screen is focused
            // The return function is called when the screen is unfocused
            return () => {
                console.log('ResultScreen blurred - stopping audio.');
                stopAndReleaseSound();
            };
        }, [stopAndReleaseSound])
    );

    // Modified to handle both question types for display
    const getCorrectAnswerDisplay = (question) => {
        if (question.type_id === 1) { // Multiple Choice
            const correctAnswerObj = question.answers.find(a => a.is_correct);
            return correctAnswerObj ? correctAnswerObj.answer_text : 'Không tìm thấy đáp án đúng';
        } else if (question.type_id === 2) { // Fill-in-the-blank
            return question.correct_answer || 'Không tìm thấy đáp án đúng';
        }
        return 'Không tìm thấy đáp án đúng';
    };

    const getUserAnswerDisplay = (questionId) => {
        const userAnswer = userAnswersHistory.find(ans => ans.questionId === questionId);
        if (!userAnswer) return 'Chưa trả lời';

        // For type_id 1 (multiple choice), answerText is the text of the selected option
        // For type_id 2 (fill-in-the-blank), answerText is the user's typed input
        return userAnswer.answerText;
    };

    const toggleShowIncorrectOnly = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowIncorrectOnly(prev => {
            if (prev === false) { // If changing to show incorrect only
                stopAndReleaseSound(); // Stop currently playing audio
            }
            return !prev;
        });
    };

    const questionsToDisplay = showIncorrectOnly ? incorrectQuestions : allQuestions;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.pop(2)} style={styles.backButton}>
                    <Image source={require('../images/login_signup/back.png')} style={styles.backIcon} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Kết quả bài làm</Text>
                <View style={{ width: 30 }} />{/* Spacer */}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.testTitle}>{testTitle}</Text>
                <Text style={styles.summaryText}>Số câu đúng: {correctAnswers}/{totalQuestions}</Text>
                <Text style={styles.summaryText}>Điểm của bạn: {totalScore}/100</Text>

                <View style={styles.divider} />

                <View style={styles.toggleButtonContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, !showIncorrectOnly && styles.toggleButtonActive]}
                        onPress={() => toggleShowIncorrectOnly(false)} // Pass false to explicitly show all
                    >
                        <Text style={[styles.toggleButtonText, !showIncorrectOnly && styles.toggleButtonTextActive]}>Tất cả câu hỏi</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleButton, showIncorrectOnly && styles.toggleButtonActive]}
                        onPress={() => toggleShowIncorrectOnly(true)} // Pass true to explicitly show incorrect
                    >
                        <Text style={[styles.toggleButtonText, showIncorrectOnly && styles.toggleButtonTextActive]}>Xem câu sai ({incorrectQuestions.length})</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.reviewSectionTitle}>Chi tiết các câu trả lời:</Text>
                {questionsToDisplay.length > 0 ? (
                    questionsToDisplay.map((question, index) => {
                        const userAnswer = userAnswersHistory.find(ans => ans.questionId === question.question_id);
                        const isUserCorrect = userAnswer ? userAnswer.isCorrect : false;
                        const userSelectedAnswerText = getUserAnswerDisplay(question.question_id);
                        const correctAnswerDisplay = getCorrectAnswerDisplay(question);

                        return (
                            <View key={question.question_id} style={styles.questionItem}>
                                <Text style={styles.questionNumber}>Câu {allQuestions.findIndex(q => q.question_id === question.question_id) + 1}:</Text>
                                <Text style={styles.questionContent}>{question.content}</Text>
                                {question.image_path && (
                                    <Image
                                        source={{ uri: getFullImageUrl(question.image_path) }}
                                        style={styles.questionImage}
                                        onError={(e) => console.log('Lỗi tải ảnh câu hỏi:', e.nativeEvent.error, 'URL:', getFullImageUrl(question.image_path))}
                                    />
                                )}
                                {/* NEW: Audio Player in ResultScreen */}
                                {question.audio_path && (
                                    <View style={styles.audioPlayerContainer}>
                                        <TouchableOpacity
                                            onPress={() => toggleAudioPlayback(question.audio_path)}
                                            style={styles.playPauseButton}
                                        >
                                            <Image
                                                source={
                                                    isPlayingAudio && soundRef.current && soundRef.current._url === getFullAudioUrl(question.audio_path)
                                                        ? require('../images/pause.png')
                                                        : require('../images/play.png')
                                                }
                                                style={styles.playPauseIcon}
                                            />
                                        </TouchableOpacity>
                                        <Text style={styles.audioFileName}>
                                            {question.audio_path.split('/').pop()}
                                        </Text>
                                    </View>
                                )}

                                {/* Display User's Answer */}
                                <Text style={styles.answerStatusText(isUserCorrect)}>
                                    Bạn đã trả lời: {userSelectedAnswerText} {isUserCorrect ? '✔️' : '❌'}
                                </Text>

                                {/* Display Correct Answer if User was Incorrect */}
                                {!isUserCorrect && (
                                    <Text style={styles.correctAnswerText}>Đáp án đúng: {correctAnswerDisplay}</Text>
                                )}

                                {/* Conditionally render answer options only for multiple-choice */}
                                {question.type_id === 1 && (
                                    <View style={styles.optionsContainer}>
                                        {question.answers.map(answer => {
                                            const isThisSelectedByUser = userAnswer && userAnswer.selectedAnswerId === answer.answer_id;
                                            return (
                                                <Text
                                                    key={answer.answer_id}
                                                    style={[
                                                        styles.optionText,
                                                        answer.is_correct && styles.correctOption,
                                                        isThisSelectedByUser && !answer.is_correct && styles.wrongOption,
                                                    ]}
                                                >
                                                    {answer.answer_text}
                                                </Text>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        );
                    })
                ) : (
                    <Text style={styles.noIncorrectQuestions}>Không có câu hỏi sai nào. Tuyệt vời!</Text>
                )}
            </ScrollView>

            <TouchableOpacity
                style={styles.backToTestsButton}
                onPress={() => navigation.pop(2)}
            >
                <Text style={styles.backToTestsButtonText}>Quay lại danh sách bài tập</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E0E5FF',
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100, // Để chừa chỗ cho nút cuối màn hình
    },
    testTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E90FF',
        textAlign: 'center',
        marginBottom: 15,
    },
    summaryText: {
        fontSize: 18,
        color: '#555',
        textAlign: 'center',
        marginBottom: 5,
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 20,
    },
    toggleButtonContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: '#E0E0E0',
        borderRadius: 8,
        overflow: 'hidden',
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    toggleButtonActive: {
        backgroundColor: '#1E90FF', // Màu chủ đạo khi active
    },
    toggleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
    },
    toggleButtonTextActive: {
        color: '#FFFFFF',
    },
    reviewSectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    questionItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    questionNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E90FF',
        marginBottom: 5,
    },
    questionContent: {
        fontSize: 18,
        marginBottom: 10,
        color: '#333',
        lineHeight: 25,
    },
    questionImage: {
        width: '100%',
        height: 180,
        borderRadius: 8,
        resizeMode: 'contain',
        marginBottom: 10,
        backgroundColor: '#EAEAEA',
    },
    // NEW: Styles for audio player in ResultScreen
    audioPlayerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F0F0', // Slightly different background for audio
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    playPauseButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#1E90FF',
        marginRight: 10,
        shadowColor: '#1E90FF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    playPauseIcon: {
        width: 24,
        height: 24,
        tintColor: '#FFFFFF',
    },
    audioFileName: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
        flexShrink: 1, // Allow text to wrap/shrink
    },
    answerStatusText: (isCorrect) => ({
        fontSize: 16,
        fontWeight: 'bold',
        color: isCorrect ? '#28A745' : '#DC3545', // Green for correct, Red for incorrect
        marginBottom: 5,
    }),
    correctAnswerText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#28A745', // Green for correct answer
        marginBottom: 10,
    },
    optionsContainer: {
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: 10,
    },
    optionText: {
        fontSize: 15,
        color: '#666',
        marginBottom: 5,
        padding: 5,
        borderRadius: 5,
    },
    correctOption: {
        backgroundColor: '#D4EDDA', // Light green
        fontWeight: 'bold',
        color: '#155724', // Dark green text
    },
    wrongOption: {
        backgroundColor: '#F8D7DA', // Light red
        fontWeight: 'bold',
        color: '#721C24', // Dark red text
    },
    backToTestsButton: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: '#6C757D', // Gray color
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
    },
    backToTestsButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    noIncorrectQuestions: {
        fontSize: 18,
        color: '#555',
        textAlign: 'center',
        marginTop: 30,
        fontStyle: 'italic',
    }
});

export default ResultScreen;