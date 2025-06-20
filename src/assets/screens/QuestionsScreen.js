import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Alert, // Import Alert for the confirmation dialog
    Dimensions,
    TextInput,
    Platform,
    StatusBar,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { apiCall } from '../utils/api';
import { BASE_URL } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import Sound library
import Sound from 'react-native-sound';

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
    const soundRef = useRef(null);

    const scrollViewRef = useRef(null);

    const getFullImageUrl = (imageFileName) => {
        if (!imageFileName) return '';
        if (imageFileName.startsWith('http://') || imageFileName.startsWith('https://')) {
            return imageFileName;
        }
        return `${BASE_URL}${imageFileName}`;
    };

    const getFullAudioUrl = (audioFileName) => {
        if (!audioFileName) return '';
        if (audioFileName.startsWith('http://') || audioFileName.startsWith('https://')) {
            return audioFileName;
        }
        return `${BASE_URL}/audio/${audioFileName}`;
    };

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

    const playAudio = useCallback((audioPath) => {
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
                stopAndReleaseSound();
                return;
            }
            console.log('Sound loaded successfully. Duration:', soundRef.current.getDuration(), 'seconds');

            soundRef.current.play((success) => {
                if (success) {
                    console.log('Successfully finished playing!');
                } else {
                    console.error('Playback failed due to audio decoding errors.');
                    Alert.alert('Lỗi phát âm thanh', 'Không thể phát tệp âm thanh.');
                }
                setIsPlayingAudio(false);
                stopAndReleaseSound();
            });
            setIsPlayingAudio(true);
        });
    }, [stopAndReleaseSound]);

    const toggleAudioPlayback = () => {
        if (isPlayingAudio) {
            stopAndReleaseSound();
        } else {
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
                const shuffledQuestionsOrder = response.data.sort(() => Math.random() - 0.5);

                const shuffledQuestions = shuffledQuestionsOrder.map(q => {
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
                stopAndReleaseSound();
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
    }, [testId, stopAndReleaseSound]);

    useEffect(() => {
        if (testId) {
            fetchQuestions();
        }
    }, [testId, fetchQuestions]);

    useEffect(() => {
        return () => {
            stopAndReleaseSound();
        };
    }, [stopAndReleaseSound]);

    useFocusEffect(
        useCallback(() => {
            return () => {
                console.log('QuestionsScreen blurred - stopping audio.');
                stopAndReleaseSound();
            };
        }, [stopAndReleaseSound])
    );

    useEffect(() => {
        stopAndReleaseSound();
    }, [currentQuestionIndex, questions, stopAndReleaseSound]);

    useEffect(() => {
        if (questions.length > 0) {
            const historyEntry = userAnswersHistory.find(
                (entry) => entry.questionId === questions[currentQuestionIndex]?.question_id
            );

            if (historyEntry) {
                if (questions[currentQuestionIndex]?.type_id === 1) { // Multiple Choice
                    setSelectedAnswerId(historyEntry.selectedAnswerId);
                    setUserTextInput('');
                } else if (questions[currentQuestionIndex]?.type_id === 2) { // Fill-in-the-blank
                    setUserTextInput(historyEntry.answerText || '');
                    setSelectedAnswerId(null);
                }
                setIsAnswered(true);
            } else {
                setSelectedAnswerId(null);
                setUserTextInput('');
                setIsAnswered(false);
            }
        }
    }, [currentQuestionIndex, questions, userAnswersHistory]);

    // Add navigation listener to prompt before leaving
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            // Prevent default behavior of leaving the screen
            e.preventDefault();

            // Prompt the user before leaving the screen
            Alert.alert(
                'Thoát khỏi bài làm?',
                'Bạn có chắc muốn thoát khỏi bài làm không? Tiến độ hiện tại sẽ không được lưu.',
                [
                    { text: 'Không', style: 'cancel', onPress: () => {} },
                    {
                        text: 'Có',
                        style: 'destructive',
                        onPress: () => {
                            stopAndReleaseSound(); // Stop audio if exiting
                            navigation.dispatch(e.data.action); // Allow the navigation to proceed
                        },
                    },
                ]
            );
        });

        return unsubscribe;
    }, [navigation, stopAndReleaseSound]);


    const handleAnswerPress = (answer) => {
        setSelectedAnswerId(answer.answer_id);
        setIsAnswered(true);
    };

    const handleTextInputChange = (text) => {
        setUserTextInput(text);
        setIsAnswered(text.trim() !== '');
    };

    const handleNextQuestion = async () => {
        const currentQuestion = questions[currentQuestionIndex];

        let canProceed = false;
        let finalSelectedAnswerId = null;
        let finalUserTextInput = '';

        if (currentQuestion.type_id === 1) { // Multiple Choice
            canProceed = selectedAnswerId !== null;
            finalSelectedAnswerId = selectedAnswerId;
        } else if (currentQuestion.type_id === 2) { // Fill-in-the-blank
            canProceed = userTextInput.trim() !== '';
            finalUserTextInput = userTextInput.trim();
        }

        if (!canProceed) {
            Alert.alert('Chưa hoàn thành', 'Vui lòng hoàn thành câu trả lời trước khi chuyển câu hỏi.');
            return;
        }

        let isCorrect = false;
        if (currentQuestion.type_id === 1) {
            const selectedAns = currentQuestion.answers.find(ans => ans.answer_id === finalSelectedAnswerId);
            isCorrect = selectedAns?.is_correct || false;
        } else if (currentQuestion.type_id === 2) {
            isCorrect = currentQuestion.correct_answer.trim().toLowerCase() === finalUserTextInput.toLowerCase();
        }

        // Prepare the new entry for the current question
        const newCurrentQuestionAnswerEntry = {
            questionId: currentQuestion.question_id,
            selectedAnswerId: finalSelectedAnswerId,
            answerText: finalUserTextInput,
            isCorrect: isCorrect,
            questionType: currentQuestion.type_id,
            correctAnswerContent: currentQuestion.type_id === 2 ? currentQuestion.correct_answer : null,
        };

        // Determine the final user answers history to be used for submission
        let finalUserAnswersForSubmission;
        const existingIndexInHistory = userAnswersHistory.findIndex(item => item.questionId === currentQuestion.question_id);

        if (existingIndexInHistory > -1) {
            // If the current question's answer already exists in history, update it
            finalUserAnswersForSubmission = [...userAnswersHistory];
            finalUserAnswersForSubmission[existingIndexInHistory] = newCurrentQuestionAnswerEntry;
        } else {
            // Otherwise, add it to the history
            finalUserAnswersForSubmission = [...userAnswersHistory, newCurrentQuestionAnswerEntry];
        }

        // Update the userAnswersHistory state (this will trigger a re-render later, but not immediately for score calculation)
        setUserAnswersHistory(finalUserAnswersForSubmission);

        stopAndReleaseSound();

        if (currentQuestionIndex === questions.length - 1) {
            // For the last question, use the immediately prepared finalUserAnswersForSubmission
            const finalCorrectCount = finalUserAnswersForSubmission.filter(item => item.isCorrect).length;
            await finishTest(finalCorrectCount, finalUserAnswersForSubmission); // Pass final answers to finishTest
        } else {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswerId(null);
            setUserTextInput('');
            setIsAnswered(false);
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            stopAndReleaseSound();
            setCurrentQuestionIndex(prev => prev - 1);
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }
    };

    // Modified finishTest to accept userAnswersHistory directly
    const finishTest = async (finalCorrectAnswersCount, submittedUserAnswers) => {
        setLoading(true);
        let userId = null;
        try {
            console.log('QuestionsScreen: Attempting to retrieve userInfo from AsyncStorage...');
            const userInfoString = await AsyncStorage.getItem('userInfo');
            
            if (userInfoString) {
                const userInfo = JSON.parse(userInfoString);
                userId = userInfo.userId;
                console.log('QuestionsScreen: userId extracted from userInfo:', userId);
            } else {
                console.warn('QuestionsScreen: userInfoString is NULL or undefined. User not logged in or data missing.');
            }

            if (!userId) {
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

            const userIdInt = parseInt(userId, 10);
            if (isNaN(userIdInt)) {
                Alert.alert('Lỗi', 'Thông tin người dùng không hợp lệ. Vui lòng đăng nhập lại.');
                navigation.replace('Login');
                return;
            }

            const totalQuestions = questions.length;
            const totalScore = Math.round((finalCorrectAnswersCount / totalQuestions) * 100);

            const payload = {
                userId: userIdInt,
                testId: testId,
                score: totalScore,
                totalQuestions: totalQuestions,
                correctAnswers: finalCorrectAnswersCount,
                userAnswers: submittedUserAnswers, // Use the submittedUserAnswers
            };

            console.log('QuestionsScreen: Đang gửi kết quả bài làm:', payload);
            const response = await apiCall('POST', '/history', payload);

            if (response.ok) {
                console.log('QuestionsScreen: Kết quả bài làm đã được lưu thành công.');
                Alert.alert(
                    'Hoàn thành bài kiểm tra!',
                    `Bạn đã hoàn thành bài ${testTitle}.\nSố câu đúng: ${finalCorrectAnswersCount}/${totalQuestions}\nĐiểm của bạn: ${totalScore}`,
                    [
                        {
                            text: 'Xem lại kết quả',
                            onPress: () => {
                                navigation.navigate('Result', {
                                    testId: testId,
                                    testTitle: testTitle,
                                    totalQuestions: totalQuestions,
                                    correctAnswers: finalCorrectAnswersCount,
                                    totalScore: totalScore,
                                    userAnswersHistory: submittedUserAnswers, // Pass submittedUserAnswers
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

    // Determine if the "Next" button should be enabled
    const isNextButtonEnabled = 
        (currentQuestion.type_id === 1 && selectedAnswerId !== null) ||
        (currentQuestion.type_id === 2 && userTextInput.trim() !== '');

    // Determine background color for nav arrow buttons (for bottom navigation)
    const prevButtonBackgroundColor = currentQuestionIndex === 0 ? '#CCCCCC' : '#2196F3'; // Grey if at start, blue otherwise
    const nextButtonArrowBackgroundColor = isNextButtonEnabled ? '#2196F3' : '#CCCCCC'; // Blue if enabled, gray if disabled


    return (
        <View style={questionsStyles.container}>
            {/* Status Bar for notch area */}
            <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" translucent={false} />

            {/* Top Bar with Back Button and Progress Circles */}
            <View style={questionsStyles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={questionsStyles.backButton}>
                    <Image source={require('../images/login_signup/back.png')} style={questionsStyles.backIcon} />
                </TouchableOpacity>

                {/* Wrapper for progress circles to facilitate centering */}
                <View style={questionsStyles.progressCirclesWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={questionsStyles.progressCirclesContentContainer}
                    >
                        {questions.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    questionsStyles.progressCircle,
                                    index === currentQuestionIndex && questionsStyles.progressCircleActive,
                                    index < currentQuestionIndex && questionsStyles.progressCircleCompleted,
                                ]}
                            >
                                <Text style={[
                                    questionsStyles.progressCircleText,
                                    index === currentQuestionIndex && questionsStyles.progressCircleTextActive,
                                    index < currentQuestionIndex && questionsStyles.progressCircleTextCompleted,
                                ]}>
                                    {index + 1}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* Spacer to balance the back button for visual centering */}
                {/* It's important that this spacer has the exact same dimensions as the backButton */}
                <View style={questionsStyles.backButtonSpacer} />
            </View>

            <ScrollView ref={scrollViewRef} contentContainerStyle={questionsStyles.questionContentScroll}>
                {/* Question Card */}
                <View style={questionsStyles.questionCard}>
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
                                {currentQuestion.audio_path.split('/').pop()}
                            </Text>
                        </View>
                    )}

                    {/* Answers or Text Input based on type_id */}
                    <View style={questionsStyles.answersContainer}>
                        {currentQuestion.type_id === 1 ? ( // Multiple Choice
                            currentQuestion.answers.map((answer) => {
                                const isSelected = selectedAnswerId === answer.answer_id;
                                let answerButtonColor = '#FFFFFF'; // Default white
                                let answerBorderColor = '#D0D0D0'; // Default light gray border
                                let answerTextColor = '#333';

                                if (isSelected) {
                                    answerButtonColor = '#E3F2FD'; // Light blue for selected
                                    answerBorderColor = '#2196F3'; // Blue border
                                    answerTextColor = '#2196F3';
                                }

                                return (
                                    <TouchableOpacity
                                        key={answer.answer_id.toString()}
                                        style={[
                                            questionsStyles.answerButton,
                                            { backgroundColor: answerButtonColor, borderColor: answerBorderColor }
                                        ]}
                                        onPress={() => handleAnswerPress(answer)}
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
                                    onChangeText={handleTextInputChange}
                                    editable={true}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    onSubmitEditing={handleNextQuestion}
                                    returnKeyType="done"
                                />
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Navigation Buttons Container at the bottom */}
            <View style={questionsStyles.bottomNavigation}>
                <TouchableOpacity
                    onPress={handlePreviousQuestion}
                    style={[
                        questionsStyles.navArrowButton,
                        { backgroundColor: prevButtonBackgroundColor }, // Dynamic background color
                        currentQuestionIndex === 0 && questionsStyles.navArrowButtonDisabled, // Apply disabled opacity and no shadow
                    ]}
                    disabled={currentQuestionIndex === 0}
                >
                    <Image source={require('../images/left-arrow.png')} style={questionsStyles.navArrowIcon} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        questionsStyles.nextButton,
                        !isNextButtonEnabled && questionsStyles.nextButtonDisabled
                    ]}
                    onPress={handleNextQuestion}
                    disabled={!isNextButtonEnabled}
                >
                    <Text style={questionsStyles.nextButtonText}>
                        {currentQuestionIndex === questions.length - 1 ? 'Submit Quiz' : 'Next'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleNextQuestion}
                    style={[
                        questionsStyles.navArrowButton,
                        { backgroundColor: nextButtonArrowBackgroundColor }, // Apply dynamic background color
                        (!isNextButtonEnabled || currentQuestionIndex === questions.length - 1) && questionsStyles.navArrowButtonDisabled, // Apply disabled opacity and no shadow
                        currentQuestionIndex === questions.length - 1 && questionsStyles.navArrowButtonHidden
                    ]}
                    disabled={!isNextButtonEnabled || currentQuestionIndex === questions.length - 1}
                >
                    <Image source={require('../images/right-arrow.png')} style={questionsStyles.navArrowIcon} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const questionsStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E6EEF9', // Light blue-gray background for the entire screen
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
        paddingBottom: 20,
        backgroundColor: '#F7F7F7',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        zIndex: 2,
        position: 'relative',
    },
    backButton: {
        padding: 5,
    },
    backIcon: {
        width: 24,
        height: 24,
        tintColor: '#333',
    },
    progressCirclesWrapper: { // New wrapper style
        flex: 1, // Takes up remaining space in the row
        flexDirection: 'row', // Ensure children (ScrollView) are laid out in a row within this wrapper
        justifyContent: 'center', // Centers the ScrollView horizontally if its content is smaller than wrapper
        alignItems: 'center', // Centers the ScrollView vertically (though it's usually single line)
        overflow: 'hidden', // Hide overflow content if ScrollView extends beyond its bounds
    },
    backButtonSpacer: { // New spacer style
        width: 34, // Approximate width of the back button (icon 24 + padding 5*2 = 34)
    },
    progressCirclesContentContainer: { // Renamed for clarity, applies to contentContainerStyle
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Crucial for centering content within the scrollable area
        minWidth: '100%', // Makes content container stretch to at least 100% of ScrollView's visible width for centering
    },
    progressCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#BBDEFB',
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5,
    },
    progressCircleActive: {
        borderColor: '#2196F3',
        backgroundColor: '#2196F3',
    },
    progressCircleCompleted: {
        borderColor: '#4CAF50',
        backgroundColor: '#4CAF50',
    },
    progressCircleText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#757575',
    },
    progressCircleTextActive: {
        color: 'white',
    },
    progressCircleTextCompleted: {
        color: 'white',
    },
    questionContentScroll: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    questionCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 5,
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
        marginBottom: 10,
    },
    answerButton: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#D0D0D0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
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
    bottomNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    nextButton: {
        backgroundColor: '#2196F3', // Blue color when enabled
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 30,
        minWidth: width * 0.4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextButtonDisabled: {
        backgroundColor: '#CCCCCC', // Gray color when disabled
        shadowColor: 'transparent',
        opacity: 0.7,
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    navArrowButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0', // Default border for arrow buttons
    },
    navArrowButtonDisabled: {
        opacity: 0.5,
        borderColor: '#F0F0F0',
        shadowOpacity: 0,
        elevation: 0,
        shadowColor: 'transparent',
    },
    navArrowButtonHidden: {
        opacity: 0,
    },
    navArrowIcon: {
        width: 24,
        height: 24,
        // Removed tintColor to use original image color (white/black from your provided images)
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E6EEF9',
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
        backgroundColor: '#E6EEF9',
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
        backgroundColor: '#E6EEF9',
        padding: 20,
    },
    noDataText: {
        fontSize: 18,
        color: '#777',
        marginBottom: 20,
        textAlign: 'center',
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
