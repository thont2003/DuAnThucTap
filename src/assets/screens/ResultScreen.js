import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BASE_URL } from '../utils/constants';

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
        userAnswersHistory, // Lịch sử câu trả lời của người dùng
        allQuestions // Tất cả câu hỏi gốc
    } = route.params;

    // TÍNH TOÁN LẠI ĐIỂM SỐ TRÊN THANG 10 NGAY TẠI ĐÂY ĐỂ ĐẢM BẢO CHÍNH XÁC
    const calculatedScore = (correctAnswers / totalQuestions) * 10;
    const formattedScore = calculatedScore.toFixed(2); // Đảm bảo làm tròn 2 chữ số thập phân

    const [showIncorrectOnly, setShowIncorrectOnly] = useState(false);
    const [incorrectQuestions, setIncorrectQuestions] = useState([]);

    useEffect(() => {
        // Lọc ra các câu hỏi mà người dùng trả lời sai
        const filteredIncorrect = allQuestions.filter(question => {
            const userAnswer = userAnswersHistory.find(ans => ans.questionId === question.question_id);
            // Một câu hỏi là sai nếu nó không được trả lời (userAnswer là undefined) hoặc isCorrect là false
            return !userAnswer || !userAnswer.isCorrect;
        });
        setIncorrectQuestions(filteredIncorrect);
    }, [allQuestions, userAnswersHistory]);

    const getFullImageUrl = (imageFileName) => {
        if (!imageFileName) return '';
        if (imageFileName.startsWith('http://') || imageFileName.startsWith('https://')) {
            return imageFileName;
        }
        return `${BASE_URL}/images/${imageFileName}`;
    };

    // Modified to handle both question types
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
        setShowIncorrectOnly(prev => !prev);
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
                <Text style={styles.summaryText}>Điểm của bạn: {formattedScore}/10</Text>

                <View style={styles.divider} />

                <View style={styles.toggleButtonContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, !showIncorrectOnly && styles.toggleButtonActive]}
                        onPress={() => setShowIncorrectOnly(false)}
                    >
                        <Text style={[styles.toggleButtonText, !showIncorrectOnly && styles.toggleButtonTextActive]}>Tất cả câu hỏi</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleButton, showIncorrectOnly && styles.toggleButtonActive]}
                        onPress={() => setShowIncorrectOnly(true)}
                    >
                        <Text style={[styles.toggleButtonText, showIncorrectOnly && styles.toggleButtonTextActive]}>Xem câu sai ({incorrectQuestions.length})</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.reviewSectionTitle}>Chi tiết các câu trả lời:</Text>
                {questionsToDisplay.length > 0 ? (
                    questionsToDisplay.map((question, index) => {
                        const userAnswer = userAnswersHistory.find(ans => ans.questionId === question.question_id);
                        const isUserCorrect = userAnswer ? userAnswer.isCorrect : false;
                        const userSelectedAnswerText = getUserAnswerDisplay(question.question_id); // Get user's answer
                        const correctAnswerDisplay = getCorrectAnswerDisplay(question); // Get correct answer based on type

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