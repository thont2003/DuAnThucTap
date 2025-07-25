import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Dimensions,
    TextInput,
    Platform,
    StatusBar,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { apiCall } from '../utils/api';
import { BASE_URL } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sound from 'react-native-sound';
import CustomAlertDialog from '../components/CustomAlertDialog';

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
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const soundRef = useRef(null);
    const scrollViewRef = useRef(null);
    // NEW STATE: To track if the quiz has been submitted
    const [quizSubmitted, setQuizSubmitted] = useState(false); 

    // State for CustomAlertDialog
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogConfig, setDialogConfig] = useState({
        title: '',
        message: '',
        confirmText: 'OK',
        cancelText: 'Hủy',
        onConfirm: () => {},
        onCancel: null,
        showCancelButton: false,
    });

    const showCustomAlert = (title, message, confirmText = 'OK', onConfirm = () => {}, cancelText = 'Hủy', onCancel = null, showCancelButton = true) => {
        setDialogConfig({
            title,
            message,
            confirmText,
            cancelText,
            onConfirm: () => {
                onConfirm();
                setDialogVisible(false);
            },
            onCancel: onCancel ? () => {
                onCancel();
                setDialogVisible(false);
            } : null,
            showCancelButton,
        });
        setDialogVisible(true);
    };

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
                showCustomAlert('Lỗi tải âm thanh', 'Không thể tải tệp âm thanh. Vui lòng thử lại.', 'OK', () => {}, null, null, false);
                stopAndReleaseSound();
                return;
            }
            console.log('Sound loaded successfully. Duration:', soundRef.current.getDuration(), 'seconds');

            soundRef.current.play((success) => {
                if (success) {
                    console.log('Successfully finished playing!');
                } else {
                    console.error('Playback failed due to audio decoding errors.');
                    showCustomAlert('Lỗi phát âm thanh', 'Không thể phát tệp âm thanh.', 'OK', () => {}, null, null, false);
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
                showCustomAlert('Thông báo', 'Không có âm thanh cho câu hỏi này.', 'OK', () => {}, null, null, false);
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
                    if (q.type_id === 1) {
                        return {
                            ...q,
                            answers: q.answers.sort(() => Math.random() - 0.5)
                        };
                    }
                    return q;
                });
                setQuestions(shuffledQuestions);
                setCurrentQuestionIndex(0);
                setSelectedAnswerId(null);
                setUserTextInput('');
                setIsAnswered(false);
                setCorrectAnswersCount(0);
                setUserAnswersHistory([]);
                stopAndReleaseSound();
                // Reset quizSubmitted state when new questions are fetched
                setQuizSubmitted(false); 
            } else {
                const message = response.data?.error || response.data?.message || 'Không thể tải câu hỏi.';
                setError(message);
                showCustomAlert('Lỗi', message, 'OK', () => {}, null, null, false);
                console.error('QuestionsScreen: Lỗi từ server khi fetch questions:', response.status, response.data);
            }
        } catch (err) {
            console.error('QuestionsScreen: Lỗi khi fetch questions:', err);
            setError('Không thể kết nối đến server để tải câu hỏi.');
            showCustomAlert('Lỗi', 'Không thể kết nối đến server để tải câu hỏi.', 'OK', () => {}, null, null, false);
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
                if (questions[currentQuestionIndex]?.type_id === 1) {
                    setSelectedAnswerId(historyEntry.selectedAnswerId);
                    setUserTextInput('');
                } else if (questions[currentQuestionIndex]?.type_id === 2) {
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

    // MODIFIED useEffect: Conditionally attach the listener
    useEffect(() => {
        let unsubscribe;
        if (!quizSubmitted) { // Only attach if quiz hasn't been submitted
            unsubscribe = navigation.addListener('beforeRemove', (e) => {
                e.preventDefault();
                showCustomAlert(
                    'Thoát khỏi bài làm?',
                    'Bạn có chắc muốn thoát khỏi bài làm không? Tiến độ hiện tại sẽ không được lưu.',
                    'Có',
                    () => {
                        stopAndReleaseSound();
                        navigation.dispatch(e.data.action);
                    },
                    'Không',
                    () => {},
                    true
                );
            });
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [navigation, stopAndReleaseSound, quizSubmitted]); // Add quizSubmitted to dependency array

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

        if (currentQuestion.type_id === 1) {
            canProceed = selectedAnswerId !== null;
            finalSelectedAnswerId = selectedAnswerId;
        } else if (currentQuestion.type_id === 2) {
            canProceed = userTextInput.trim() !== '';
            finalUserTextInput = userTextInput.trim();
        }

        if (!canProceed) {
            showCustomAlert('Chưa hoàn thành', 'Vui lòng hoàn thành câu trả lời trước khi chuyển câu hỏi.', 'OK', () => {}, null, null, false);
            return;
        }

        let isCorrect = false;
        if (currentQuestion.type_id === 1) {
            const selectedAns = currentQuestion.answers.find(ans => ans.answer_id === finalSelectedAnswerId);
            isCorrect = selectedAns?.is_correct || false;
        } else if (currentQuestion.type_id === 2) {
            isCorrect = currentQuestion.correct_answer.trim().toLowerCase() === finalUserTextInput.toLowerCase();
        }

        const newCurrentQuestionAnswerEntry = {
            questionId: currentQuestion.question_id,
            selectedAnswerId: finalSelectedAnswerId,
            answerText: finalUserTextInput,
            isCorrect: isCorrect,
            questionType: currentQuestion.type_id,
            correctAnswerContent: currentQuestion.type_id === 2 ? currentQuestion.correct_answer : null,
        };

        let finalUserAnswersForSubmission;
        const existingIndexInHistory = userAnswersHistory.findIndex(item => item.questionId === currentQuestion.question_id);

        if (existingIndexInHistory > -1) {
            finalUserAnswersForSubmission = [...userAnswersHistory];
            finalUserAnswersForSubmission[existingIndexInHistory] = newCurrentQuestionAnswerEntry;
        } else {
            finalUserAnswersForSubmission = [...userAnswersHistory, newCurrentQuestionAnswerEntry];
        }

        setUserAnswersHistory(finalUserAnswersForSubmission);

        stopAndReleaseSound();

        if (currentQuestionIndex === questions.length - 1) {
            const finalCorrectCount = finalUserAnswersForSubmission.filter(item => item.isCorrect).length;
            await finishTest(finalCorrectCount, finalUserAnswersForSubmission);
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
                showCustomAlert(
                    'Lỗi thông tin người dùng',
                    'Không tìm thấy thông tin người dùng. Vui lòng đảm bảo bạn đã đăng nhập và thử lại. Nếu vấn đề tiếp diễn, hãy liên hệ hỗ trợ.',
                    'Đăng nhập lại',
                    () => navigation.replace('Login'),
                    'Hủy',
                    () => setLoading(false),
                    true
                );
                return;
            }

            const userIdInt = parseInt(userId, 10);
            if (isNaN(userIdInt)) {
                showCustomAlert('Lỗi', 'Thông tin người dùng không hợp lệ. Vui lòng đăng nhập lại.', 'OK', () => navigation.replace('Login'), null, null, false);
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
                userAnswers: submittedUserAnswers,
            };

            console.log('QuestionsScreen: Đang gửi kết quả bài làm:', payload);
            const response = await apiCall('POST', '/history', payload);

            if (response.ok) {
                console.log('QuestionsScreen: Kết quả bài làm đã được lưu thành công.');
                // SET NEW STATE TO TRUE: Quiz is now submitted
                setQuizSubmitted(true); 

                showCustomAlert(
                    'Hoàn thành bài kiểm tra!',
                    `Bạn đã hoàn thành bài ${testTitle}.\nSố câu đúng: ${finalCorrectAnswersCount}/${totalQuestions}\nĐiểm của bạn: ${totalScore}`,
                    'Xem lại kết quả',
                    () => {
                        // Ensure we navigate after the dialog closes
                        setTimeout(() => {
                            navigation.navigate('Result', {
                                testId: testId,
                                testTitle: testTitle,
                                totalQuestions: totalQuestions,
                                correctAnswers: finalCorrectAnswersCount,
                                totalScore: totalScore,
                                userAnswersHistory: submittedUserAnswers,
                                allQuestions: questions,
                            });
                        }, 100); // Small delay to allow dialog to fully close
                    },
                    'Về trang chủ',
                    () => {
                        setTimeout(() => {
                            navigation.navigate('MainTabs');
                        }, 100); // Small delay
                    },
                    true
                );
            } else {
                const message = response.data?.error || response.data?.message || 'Không thể lưu kết quả bài làm.';
                showCustomAlert('Lỗi', message, 'OK', () => {}, null, null, false);
                console.error('QuestionsScreen: Lỗi từ server khi lưu kết quả:', response.status, response.data);
            }
        } catch (err) {
            console.error('QuestionsScreen: Lỗi khi lưu kết quả bài làm:', err);
            showCustomAlert('Lỗi', 'Không thể kết nối đến server để lưu kết quả bài làm.', 'OK', () => {}, null, null, false);
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
                <TouchableOpacity onPress={() => navigation.navigate('MainTabs')} style={questionsStyles.backToTestsButton}>
                    <Text style={questionsStyles.backToTestsButtonText}>

Quay lại trang chủ</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    const isNextButtonEnabled = 
        (currentQuestion.type_id === 1 && selectedAnswerId !== null) ||
        (currentQuestion.type_id === 2 && userTextInput.trim() !== '');

    const prevButtonBackgroundColor = currentQuestionIndex === 0 ? '#CCCCCC' : '#2196F3';
    const nextButtonArrowBackgroundColor = isNextButtonEnabled ? '#2196F3' : '#CCCCCC';

    return (
        <View style={questionsStyles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" translucent={false} />
            <View style={questionsStyles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={questionsStyles.backButton}>
                    <Image source={require('../images/login_signup/back.png')} style={questionsStyles.backIcon} />
                </TouchableOpacity>
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
                <View style={questionsStyles.backButtonSpacer} />
            </View>

            <ScrollView 
                ref={scrollViewRef} 
                contentContainerStyle={questionsStyles.questionContentScroll}
                showsVerticalScrollIndicator={true}
                style={questionsStyles.scrollView}
            >
                <View style={questionsStyles.questionCard}>
                    <Text style={questionsStyles.questionText}>{currentQuestion.content}</Text>
                    {currentQuestion.image_path && (
                        <Image
                            source={{ uri: getFullImageUrl(currentQuestion.image_path) }}
                            style={questionsStyles.questionImage}
                            onError={(e) => console.log('Lỗi tải ảnh câu hỏi:', e.nativeEvent.error, 'URL:', getFullImageUrl(currentQuestion.image_path))}
                        />
                    )}
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
                    <View style={questionsStyles.answersContainer}>
                        {currentQuestion.type_id === 1 ? (
                            currentQuestion.answers.map((answer) => {
                                const isSelected = selectedAnswerId === answer.answer_id;
                                let answerButtonColor = '#FFFFFF';
                                let answerBorderColor = '#D0D0D0';
                                let answerTextColor = '#333';

                                if (isSelected) {
                                    answerButtonColor = '#E3F2FD';
                                    answerBorderColor = '#2196F3';
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
                        ) : (
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

            <View style={questionsStyles.bottomNavigation}>
                <TouchableOpacity
                    onPress={handlePreviousQuestion}
                    style={[
                        questionsStyles.navArrowButton,
                        { backgroundColor: prevButtonBackgroundColor },
                        currentQuestionIndex === 0 && questionsStyles.navArrowButtonDisabled,
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
                        {currentQuestionIndex === questions.length - 1 ? 'Hoàn thành' : 'Tiếp'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleNextQuestion}
                    style={[
                        questionsStyles.navArrowButton,
                        { backgroundColor: nextButtonArrowBackgroundColor },
                        (!isNextButtonEnabled || currentQuestionIndex === questions.length - 1) && questionsStyles.navArrowButtonDisabled,
                        currentQuestionIndex === questions.length - 1 && questionsStyles.navArrowButtonHidden
                    ]}
                    disabled={!isNextButtonEnabled || currentQuestionIndex === questions.length - 1}
                >
                    <Image source={require('../images/right-arrow.png')} style={questionsStyles.navArrowIcon} />
                </TouchableOpacity>
            </View>

            <CustomAlertDialog
                isVisible={dialogVisible}
                title={dialogConfig.title}
                message={dialogConfig.message}
                confirmText={dialogConfig.confirmText}
                cancelText={dialogConfig.cancelText}
                onConfirm={dialogConfig.onConfirm}
                onCancel={dialogConfig.onCancel}
                showCancelButton={dialogConfig.showCancelButton}
            />
        </View>
    );
};

const questionsStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
        fontSize: 18,
        color: '#D32F2F',
        textAlign: 'center',
        marginBottom: 15,
    },
    retryButton: {
        backgroundColor: '#2196F3',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F7F7F7',
    },
    noDataText: {
        fontSize: 18,
        color: '#555',
        textAlign: 'center',
        marginBottom: 20,
    },
    backToTestsButton: {
        backgroundColor: '#2196F3',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
    },
    backToTestsButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
    },
    backButton: {
        padding: 8,
    },
    backIcon: {
        width: 24,
        height: 24,
        tintColor: '#333',
    },
    progressCirclesWrapper: {
        flex: 1,
        marginHorizontal: 10,
        height: 40, 
    },
    progressCirclesContentContainer: {
        alignItems: 'center',
    },
    progressCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: '#B0B0B0',
    },
    progressCircleActive: {
        backgroundColor: '#2196F3',
        borderColor: '#1976D2',
    },
    progressCircleCompleted: {
        backgroundColor: '#4CAF50',
        borderColor: '#388E3C',
    },
    progressCircleText: {
        color: '#555',
        fontSize: 14,
        fontWeight: 'bold',
    },
    progressCircleTextActive: {
        color: '#FFFFFF',
    },
    progressCircleTextCompleted: {
        color: '#FFFFFF',
    },
    backButtonSpacer: {
        width: 40, // To balance the back button space
    },
    scrollView: {
        flex: 1,
    },
    questionContentScroll: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    questionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
        marginBottom: 20,
    },
    questionText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        lineHeight: 28,
    },
    questionImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 15,
        resizeMode: 'contain',
        backgroundColor: '#eee',
    },
    audioPlayerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    playPauseButton: {
        padding: 5,
    },
    playPauseIcon: {
        width: 30,
        height: 30,
        tintColor: '#2196F3',
    },
    audioFileName: {
        marginLeft: 10,
        fontSize: 16,
        color: '#555',
        flexShrink: 1,
    },
    answersContainer: {
        marginTop: 10,
    },
    answerButton: {
        padding: 15,
        borderRadius: 10,
        borderWidth: 1.5,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
    },
    answerText: {
        fontSize: 17,
        fontWeight: '500',
        textAlign: 'center',
        flexShrink: 1,
    },
    textInputContainer: {
        borderWidth: 1.5,
        borderColor: '#D0D0D0',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'ios' ? 15 : 5, 
        minHeight: 120,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },
    textInputField: {
        fontSize: 17,
        color: '#333',
        flex: 1,
        width: '100%',
        textAlignVertical: 'top',
        paddingTop: Platform.OS === 'android' ? 10 : 0, 
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
        zIndex: 1,
    },
    navArrowButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2196F3',
    },
    navArrowButtonDisabled: {
        opacity: 0.6,
        backgroundColor: '#CCCCCC',
    },
    navArrowButtonHidden: {
        opacity: 0,
    },
    navArrowIcon: {
        width: 24,
        height: 24,
        tintColor: '#FFFFFF',
    },
    nextButton: {
        flex: 1,
        backgroundColor: '#2196F3',
        paddingVertical: 15,
        borderRadius: 10,
        marginHorizontal: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextButtonDisabled: {
        backgroundColor: '#CCCCCC',
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default QuestionsScreen;