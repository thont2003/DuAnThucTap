import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Alert,
    Dimensions,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect
import { apiCall } from '../utils/api';
import { BASE_URL } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import Sound library
import Sound from 'react-native-sound';

// Ensure Sound is ready for playback (optional, but good practice)
Sound.setCategory('Playback');

const { width } = Dimensions.get('window');

const QuestionsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { testId, testTitle, levelId, levelName } = route.params;

    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswerId, setSelectedAnswerId] = useState(null);
    const [userTextInput, setUserTextInput] = useState('');
    const [isAnswered, setIsAnswered] = useState(false);
    const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userAnswersHistory, setUserAnswersHistory] = useState([]);

    // State for audio
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const soundRef = useRef(null); // Ref to hold the Sound object

    const scrollViewRef = useRef(null);

    const getFullImageUrl = (imageFileName) => {
        if (!imageFileName) return '';
        if (imageFileName.startsWith('http://') || imageFileName.startsWith('https://')) {
            return imageFileName;
        }
        return `${BASE_URL}/images/${imageFileName}`;
    };

    // Helper to get full audio URL
    const getFullAudioUrl = (audioFileName) => {
        if (!audioFileName) return '';
        if (audioFileName.startsWith('http://') || audioFileName.startsWith('https://')) {
            return audioFileName;
        }
        // Assuming audio files are in a similar /audio/ directory
        return `${BASE_URL}/audio/${audioFileName}`;
    };

    // Function to stop and release the current sound
    const stopAndReleaseSound = useCallback(() => {
        const sound = soundRef.current;
        if (sound) {
            sound.stop(() => {
                if (soundRef.current === sound) {
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
        // Stop any currently playing audio
        stopAndReleaseSound();

        if (!audioPath) {
            console.warn('No audio path provided.');
            return;
        }

        const audioUrl = getFullAudioUrl(audioPath);
        console.log('Attempting to load audio from:', audioUrl);

        soundRef.current = new Sound(audioUrl, null, (error) => {
            if (error) {
                console.error('Failed to load the sound:', error);
                Alert.alert('Lỗi tải âm thanh', 'Không thể tải tệp âm thanh. Vui lòng thử lại.');
                stopAndReleaseSound(); // Ensure release on error
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
                stopAndReleaseSound(); // Release resource after playback
            });
            setIsPlayingAudio(true);
        });
    }, [stopAndReleaseSound]);

    const toggleAudioPlayback = () => {
        if (isPlayingAudio) {
            stopAndReleaseSound();
        } else {
            // Only play if there's an audio_path for the current question
            if (currentQuestion && currentQuestion.audio_path) {
                playAudio(currentQuestion.audio_path);
            } else {
                Alert.alert('Thông báo', 'Không có âm thanh cho câu hỏi này.');
            }
        }
    };

    const fetchQuestions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log(`QuestionsScreen: Đang fetch questions cho test ID: ${testId}`);
            const response = await apiCall('GET', `/tests/${testId}/questions`);

            if (response.ok && response.data) {
                const shuffledQuestions = response.data.map(q => {
                    if (q.type_id === 1) { // Only shuffle answers for multiple-choice questions
                        return {
                            ...q,
                            answers: q.answers.sort(() => Math.random() - 0.5)
                        };
                    }
                    return q; // Don't shuffle answers for type_id 2
                });
                setQuestions(shuffledQuestions);
                setCurrentQuestionIndex(0);
                setSelectedAnswerId(null);
                setUserTextInput('');
                setIsAnswered(false);
                setCorrectAnswersCount(0);
                setUserAnswersHistory([]);
                stopAndReleaseSound(); // Stop and release any playing audio when new questions are fetched
            } else {
                const message = response.data?.error || response.data?.message || 'Không thể tải câu hỏi.';
                setError(message);
                Alert.alert('Lỗi', message);
                console.error('QuestionsScreen: Lỗi từ server khi fetch questions:', response.status, response.data);
            }
        } catch (err) {
            console.error('QuestionsScreen: Lỗi khi fetch questions:', err);
            setError('Không thể kết nối đến server để tải câu hỏi.');
            Alert.alert('Lỗi', 'Không thể kết nối đến server để tải câu hỏi.');
        } finally {
            setLoading(false);
        }
    }, [testId, stopAndReleaseSound]); // Add stopAndReleaseSound to dependencies

    useEffect(() => {
        if (testId) {
            fetchQuestions();
        }
    }, [testId, fetchQuestions]);

    // Cleanup when component unmounts or navigates away
    useEffect(() => {
        return () => {
            stopAndReleaseSound();
        };
    }, [stopAndReleaseSound]);

    // Use useFocusEffect to stop audio when screen loses focus (e.g., navigating back)
    useFocusEffect(
        useCallback(() => {
            // When the screen gains focus
            // console.log('QuestionsScreen focused');
            return () => {
                // When the screen loses focus
                console.log('QuestionsScreen blurred - stopping audio.');
                stopAndReleaseSound();
            };
        }, [stopAndReleaseSound])
    );

    // Stop audio when changing question
    useEffect(() => {
        stopAndReleaseSound();
        // You might want to automatically play the audio for the new question here
        // if (currentQuestion && currentQuestion.audio_path) {
        //     playAudio(currentQuestion.audio_path);
        // }
    }, [currentQuestionIndex, questions, stopAndReleaseSound]); // Dependencies include currentQuestionIndex and questions

    const handleAnswerPress = (answer) => {
        if (isAnswered) {
            return;
        }
        setSelectedAnswerId(answer.answer_id);
        setIsAnswered(true);

        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = answer.is_correct;

        if (isCorrect) {
            setCorrectAnswersCount(prev => prev + 1);
        }

        setUserAnswersHistory(prev => [
            ...prev,
            {
                questionId: currentQuestion.question_id,
                selectedAnswerId: answer.answer_id,
                answerText: answer.answer_text,
                isCorrect: isCorrect,
                questionType: currentQuestion.type_id,
            }
        ]);
    };

    const handleTextInputSubmit = () => {
        if (userTextInput.trim() === '') {
            Alert.alert('Chưa nhập câu trả lời', 'Bạn phải nhập câu trả lời.');
            return;
        }

        if (!isAnswered) {
            setIsAnswered(true);

            const currentQuestion = questions[currentQuestionIndex];
            const isCorrect = currentQuestion.correct_answer.trim().toLowerCase() === userTextInput.trim().toLowerCase();

            if (isCorrect) {
                setCorrectAnswersCount(prev => prev + 1);
            }

            setUserAnswersHistory(prev => [
                ...prev,
                {
                    questionId: currentQuestion.question_id,
                    selectedAnswerId: null,
                    answerText: userTextInput.trim(),
                    isCorrect: isCorrect,
                    correctAnswerContent: currentQuestion.correct_answer,
                    questionType: currentQuestion.type_id,
                }
            ]);
        }
    };

    const handleNextQuestion = async () => {
        const currentQuestion = questions[currentQuestionIndex];

        if (currentQuestion.type_id === 2 && userTextInput.trim() !== '' && !isAnswered) {
            const isCorrect = currentQuestion.correct_answer.trim().toLowerCase() === userTextInput.trim().toLowerCase();
            if (isCorrect) {
                setCorrectAnswersCount(prev => prev + 1);
            }
            setUserAnswersHistory(prev => [
                ...prev,
                {
                    questionId: currentQuestion.question_id,
                    selectedAnswerId: null,
                    answerText: userTextInput.trim(),
                    isCorrect: isCorrect,
                    correctAnswerContent: currentQuestion.correct_answer,
                    questionType: currentQuestion.type_id,
                }
            ]);
            setIsAnswered(true);
        }

        let canProceed = false;
        if (currentQuestion.type_id === 1) {
            canProceed = isAnswered;
        } else if (currentQuestion.type_id === 2) {
            canProceed = userTextInput.trim() !== '';
        }

        if (!canProceed) {
            Alert.alert('Chưa hoàn thành', 'Vui lòng hoàn thành câu trả lời trước khi chuyển câu hỏi.');
            return;
        }

        stopAndReleaseSound(); // Stop sound before moving to next question or finishing test

        if (currentQuestionIndex === questions.length - 1) {
            await finishTest();
        } else {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswerId(null);
            setUserTextInput('');
            setIsAnswered(false);
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }
    };

    const finishTest = async () => {
        setLoading(true);
        let retrievedUserId = null;
        try {
            console.log('QuestionsScreen: Attempting to retrieve userId from AsyncStorage...');
            retrievedUserId = await AsyncStorage.getItem('userId');
            console.log('QuestionsScreen: userId retrieved from AsyncStorage:', retrievedUserId);

            if (!retrievedUserId) {
                Alert.alert(
                    'Lỗi thông tin người dùng',
                    'Không tìm thấy thông tin người dùng. Vui lòng đảm bảo bạn đã đăng nhập và thử lại. Nếu vấn đề tiếp diễn, hãy liên hệ hỗ trợ.',
                    [
                        {
                            text: 'Đăng nhập lại',
                            onPress: () => navigation.replace('Login')
                        },
                        {
                            text: 'Hủy',
                            style: 'cancel',
                            onPress: () => {
                                setLoading(false);
                            }
                        }
                    ]
                );
                return;
            }

            const userIdInt = parseInt(retrievedUserId, 10);
            if (isNaN(userIdInt)) {
                Alert.alert('Lỗi', 'Thông tin người dùng không hợp lệ. Vui lòng đăng nhập lại.');
                navigation.replace('Login');
                return;
            }

            const totalQuestions = questions.length;
            const totalScore = Math.round((correctAnswersCount / totalQuestions) * 100);

            const payload = {
                userId: userIdInt,
                testId: testId,
                score: totalScore,
                totalQuestions: totalQuestions,
                correctAnswers: correctAnswersCount,
                userAnswers: userAnswersHistory,
            };

            console.log('QuestionsScreen: Đang gửi kết quả bài làm:', payload);
            const response = await apiCall('POST', '/history', payload);

            if (response.ok) {
                console.log('QuestionsScreen: Kết quả bài làm đã được lưu thành công.');
                Alert.alert(
                    'Hoàn thành bài kiểm tra!',
                    `Bạn đã hoàn thành bài ${testTitle}.\nSố câu đúng: ${correctAnswersCount}/${totalQuestions}\nĐiểm của bạn: ${totalScore}`,
                    [
                        {
                            text: 'Xem lại kết quả',
                            onPress: () => {
                                navigation.navigate('Result', {
                                    testId: testId,
                                    testTitle: testTitle,
                                    totalQuestions: totalQuestions,
                                    correctAnswers: correctAnswersCount,
                                    totalScore: totalScore,
                                    userAnswersHistory: userAnswersHistory,
                                    allQuestions: questions,
                                });
                            }
                        },
                        {
                            text: 'Quay về danh sách bài tập',
                            onPress: () => navigation.pop(2),
                            style: 'cancel'
                        }
                    ]
                );
            } else {
                const message = response.data?.error || response.data?.message || 'Không thể lưu kết quả bài làm.';
                Alert.alert('Lỗi', message);
                console.error('QuestionsScreen: Lỗi từ server khi lưu kết quả:', response.status, response.data);
            }
        } catch (err) {
            console.error('QuestionsScreen: Lỗi khi lưu kết quả bài làm:', err);
            Alert.alert('Lỗi', 'Không thể kết nối đến server để lưu kết quả bài làm.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={questionsStyles.loadingContainer}>
                <ActivityIndicator size="large" color="#1E90FF" />
                <Text style={questionsStyles.loadingText}>Đang tải câu hỏi...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={questionsStyles.errorContainer}>
                <Text style={questionsStyles.errorText}>{error}</Text>
                <TouchableOpacity onPress={fetchQuestions} style={questionsStyles.retryButton}>
                    <Text style={questionsStyles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (questions.length === 0) {
        return (
            <View style={questionsStyles.noDataContainer}>
                <Text style={questionsStyles.noDataText}>Không có câu hỏi nào cho bài test này.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={questionsStyles.backToTestsButton}>
                    <Text style={questionsStyles.backToTestsButtonText}>Quay lại danh sách bài tập</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <KeyboardAvoidingView
            style={questionsStyles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Header */}
            <View style={questionsStyles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={questionsStyles.backButton}>
                    <Image source={require('../images/login_signup/back.png')} style={questionsStyles.backIcon} />
                </TouchableOpacity>
                <Text style={questionsStyles.headerTitle}>
                    {testTitle} ({currentQuestionIndex + 1}/{questions.length})
                </Text>
                <View style={{ width: 30 }} />
            </View>

            <ScrollView ref={scrollViewRef} style={questionsStyles.questionContentContainer}>
                {/* Question Content */}
                <Text style={questionsStyles.questionText}>{currentQuestion.content}</Text>

                {currentQuestion.image_path && (
                    <Image
                        source={{ uri: getFullImageUrl(currentQuestion.image_path) }}
                        style={questionsStyles.questionImage}
                        onError={(e) => console.log('Lỗi tải ảnh câu hỏi:', e.nativeEvent.error, 'URL:', getFullImageUrl(currentQuestion.image_path))}
                    />
                )}

                {/* Audio Player */}
                {currentQuestion.audio_path && (
                    <View style={questionsStyles.audioPlayerContainer}>
                        <TouchableOpacity onPress={toggleAudioPlayback} style={questionsStyles.playPauseButton}>
                            <Image
                                source={isPlayingAudio ? require('../images/pause.png') : require('../images/play.png')}
                                style={questionsStyles.playPauseIcon}
                            />
                        </TouchableOpacity>
                        <Text style={questionsStyles.audioFileName}>
                            {currentQuestion.audio_path.split('/').pop()} {/* Show only file name */}
                        </Text>
                    </View>
                )}

                {/* Answers or Text Input based on type_id */}
                <View style={questionsStyles.answersContainer}>
                    {currentQuestion.type_id === 1 ? ( // Multiple Choice
                        currentQuestion.answers.map((answer) => {
                            const isSelected = selectedAnswerId === answer.answer_id;
                            const isCorrectAnswer = answer.is_correct;

                            let answerButtonColor = '#F0F0F0';
                            let answerTextColor = '#333';
                            if (isAnswered) {
                                if (isCorrectAnswer) {
                                    answerButtonColor = '#4CAF50';
                                    answerTextColor = '#FFFFFF';
                                } else if (isSelected && !isCorrectAnswer) {
                                    answerButtonColor = '#F44336';
                                    answerTextColor = '#FFFFFF';
                                }
                            } else if (isSelected) {
                                answerButtonColor = '#BBDEFB';
                                answerTextColor = '#1E90FF';
                            }

                            return (
                                <TouchableOpacity
                                    key={answer.answer_id.toString()}
                                    style={[
                                        questionsStyles.answerButton,
                                        { backgroundColor: answerButtonColor }
                                    ]}
                                    onPress={() => handleAnswerPress(answer)}
                                    disabled={isAnswered}
                                >
                                    <Text style={[questionsStyles.answerText, { color: answerTextColor }]}>
                                        {answer.answer_text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })
                    ) : ( // Fill-in-the-blank (type_id = 2)
                        <View style={questionsStyles.textInputContainer}>
                            <TextInput
                                style={questionsStyles.textInputField}
                                placeholder="Nhập câu trả lời của bạn..."
                                value={userTextInput}
                                onChangeText={setUserTextInput}
                                editable={!isAnswered}
                                autoCapitalize="none"
                                autoCorrect={false}
                                onSubmitEditing={handleTextInputSubmit}
                                returnKeyType="done"
                            />
                            {isAnswered && (
                                <View style={questionsStyles.feedbackContainer}>
                                    <Text style={[
                                        questionsStyles.feedbackText,
                                        userAnswersHistory[userAnswersHistory.length - 1]?.isCorrect ? questionsStyles.correctFeedback : questionsStyles.incorrectFeedback
                                    ]}>
                                        {userAnswersHistory[userAnswersHistory.length - 1]?.isCorrect ? 'Đúng!' : `Sai! Đáp án đúng: ${currentQuestion.correct_answer}`}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Navigation Button */}
            <View style={questionsStyles.navigationButtonContainer}>
                <TouchableOpacity
                    style={[
                        questionsStyles.nextButton,
                        (currentQuestion.type_id === 1 && !isAnswered) ||
                        (currentQuestion.type_id === 2 && userTextInput.trim() === '')
                            ? questionsStyles.nextButtonDisabled
                            : null
                    ]}
                    onPress={handleNextQuestion}
                    disabled={
                        (currentQuestion.type_id === 1 && !isAnswered) ||
                        (currentQuestion.type_id === 2 && userTextInput.trim() === '')
                    }
                >
                    <Text style={questionsStyles.nextButtonText}>
                        {currentQuestionIndex === questions.length - 1 ? 'Hoàn thành' : 'Câu hỏi tiếp theo'}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const questionsStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
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
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
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
    questionContentContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
        marginTop: 110,
    },
    questionText: {
        fontSize: 22,
        fontWeight: '600',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 30,
    },
    questionImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        resizeMode: 'contain',
        marginBottom: 20,
        backgroundColor: '#EAEAEA',
        borderColor: '#DDD',
        borderWidth: 1,
    },
    // New styles for audio player
    audioPlayerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EAEAEA',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    playPauseButton: {
        padding: 10,
        borderRadius: 25,
        backgroundColor: '#1E90FF',
        marginRight: 15,
        shadowColor: '#1E90FF',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    playPauseIcon: {
        width: 30,
        height: 30,
        tintColor: '#FFFFFF',
    },
    audioFileName: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    answersContainer: {
        marginBottom: 20,
    },
    answerButton: {
        backgroundColor: '#F0F0F0',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    answerText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#333',
        textAlign: 'center',
    },
    textInputContainer: {
        marginBottom: 10,
    },
    textInputField: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        fontSize: 18,
        color: '#333',
        minHeight: 50,
    },
    feedbackContainer: {
        marginTop: 10,
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    feedbackText: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    correctFeedback: {
        color: '#28A745',
    },
    incorrectFeedback: {
        color: '#DC3545',
    },
    navigationButtonContainer: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextButton: {
        backgroundColor: '#1E90FF',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        minWidth: '70%',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#1E90FF',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    nextButtonDisabled: {
        backgroundColor: '#A0D8FF',
        opacity: 0.7,
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingContainer: {
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F7F7F7',
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
        backgroundColor: '#F7F7F7',
    },
    noDataText: {
        fontSize: 16,
        color: '#777',
        marginBottom: 20,
    },
    backToTestsButton: {
        backgroundColor: '#6C757D',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    backToTestsButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
});

export default QuestionsScreen;