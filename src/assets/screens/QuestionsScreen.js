// screens/QuestionsScreen.js
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
    Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiCall } from '../utils/api';
import { BASE_URL } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const QuestionsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { testId, testTitle, levelId, levelName } = route.params;

    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswerId, setSelectedAnswerId] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userAnswersHistory, setUserAnswersHistory] = useState([]);

    const scrollViewRef = useRef(null);

    const getFullImageUrl = (imageFileName) => {
        if (!imageFileName) return '';
        if (imageFileName.startsWith('http://') || imageFileName.startsWith('https://')) {
            return imageFileName;
        }
        return `${BASE_URL}/images/${imageFileName}`;
    };

    const fetchQuestions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log(`QuestionsScreen: Đang fetch questions cho test ID: ${testId}`);
            const response = await apiCall('GET', `/tests/${testId}/questions`);

            if (response.ok && response.data) {
                const shuffledQuestions = response.data.map(q => ({
                    ...q,
                    answers: q.answers.sort(() => Math.random() - 0.5)
                }));
                setQuestions(shuffledQuestions);
                setCurrentQuestionIndex(0);
                setSelectedAnswerId(null);
                setIsAnswered(false);
                setCorrectAnswersCount(0);
                setUserAnswersHistory([]);
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
    }, [testId]);

    useEffect(() => {
        if (testId) {
            fetchQuestions();
        }
    }, [testId, fetchQuestions]);

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
                selectedAnswerId: answer.answer_id, // Lưu ID đáp án đã chọn
                answerText: answer.answer_text,     // Lưu nội dung đáp án đã chọn
                isCorrect: isCorrect,
            }
        ]);
    };

    const handleNextQuestion = async () => {
        if (!isAnswered) {
            Alert.alert('Chưa trả lời', 'Bạn phải chọn một đáp án trước khi chuyển câu hỏi.');
            return;
        }

        if (currentQuestionIndex === questions.length - 1) {
            await finishTest();
        } else {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswerId(null);
            setIsAnswered(false);
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }
    };

    const finishTest = async () => {
        setLoading(true);
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) {
                Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
                // Có thể navigate về màn hình đăng nhập hoặc giới thiệu tùy luồng ứng dụng
                navigation.replace('Login'); 
                return;
            }

            const totalScore = correctAnswersCount * 10;
            const totalQuestions = questions.length;

            const payload = {
                userId: parseInt(userId),
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
                                // ***** DÒNG ĐÃ SỬA ĐỔI *****
                                // Thay từ navigation.replace sang navigation.navigate
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
        <View style={questionsStyles.container}>
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
                {/* TODO: Add audio player if audio_path exists */}

                {/* Answers */}
                <View style={questionsStyles.answersContainer}>
                    {currentQuestion.answers.map((answer) => {
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
                    })}
                </View>
            </ScrollView>

            {/* Navigation Button */}
            <View style={questionsStyles.navigationButtonContainer}>
                <TouchableOpacity
                    style={[questionsStyles.nextButton, !isAnswered && questionsStyles.nextButtonDisabled]}
                    onPress={handleNextQuestion}
                    disabled={!isAnswered}
                >
                    <Text style={questionsStyles.nextButtonText}>
                        {currentQuestionIndex === questions.length - 1 ? 'Hoàn thành' : 'Câu hỏi tiếp theo'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
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
        marginTop: 80, 
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