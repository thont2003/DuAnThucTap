// screens/DragAndDropScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedGestureHandler,
    withSpring,
    runOnJS
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiCall } from '../utils/api'; // Giả sử apiCall của bạn
import { BASE_URL } from '../utils/constants'; // Giả sử BASE_URL của bạn

const { width, height } = Dimensions.get('window');

// Một component nhỏ cho từ có thể kéo
const DraggableWord = ({ word, id, onDragEnd, startPosition }) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const isDragging = useSharedValue(false);

    // Lưu vị trí ban đầu của từ để reset
    const initialX = useSharedValue(startPosition.x);
    const initialY = useSharedValue(startPosition.y);

    const gestureHandler = useAnimatedGestureHandler({
        onStart: (event, ctx) => {
            ctx.startX = translateX.value;
            ctx.startY = translateY.value;
            isDragging.value = true;
            // Di chuyển từ lên trên cùng để nó luôn hiển thị khi kéo
            // (Không cần thay đổi ZIndex trực tiếp ở đây,
            // mà có thể điều khiển thứ tự render hoặc Animated.View order)
        },
        onActive: (event, ctx) => {
            translateX.value = ctx.startX + event.translationX;
            translateY.value = ctx.startY + event.translationY;
        },
        onEnd: (event, ctx) => {
            isDragging.value = false;
            // Gọi hàm onDragEnd trên JS thread để xử lý logic thả
            runOnJS(onDragEnd)({
                wordId: id,
                wordText: word,
                x: event.absoluteX,
                y: event.absoluteY
            });

            // Reset vị trí của từ về vị trí ban đầu nếu không được thả vào chỗ trống hợp lệ
            // hoặc nếu đã được thả và dùng cho chỗ trống nào đó, bạn có thể ẩn nó đi.
            // Tạm thời reset về 0, hoặc có thể reset về vị trí gốc trên màn hình.
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
        },
    });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
            ],
            zIndex: isDragging.value ? 999 : 1, // Đưa lên trên khi kéo
        };
    });

    return (
        <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View style={[styles.draggableWordContainer, animatedStyle]}>
                <Text style={styles.draggableWordText}>{word}</Text>
            </Animated.View>
        </PanGestureHandler>
    );
};

// Component chính cho màn hình điền vào chỗ trống
const DragAndDropScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { testId, testTitle } = route.params;

    const [questions, setQuestions] = useState([]);
    const [dragOptions, setDragOptions] = useState([]); // Danh sách các từ có thể kéo
    const [answers, setAnswers] = useState({}); // Lưu trữ đáp án người dùng { questionId: selectedWordText }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showResults, setShowResults] = useState(false); // Để hiển thị kết quả cuối cùng

    // Refs để lấy vị trí của các chỗ trống (drop zones)
    const dropZoneRefs = useRef({});
    const dropZoneMeasurements = useRef({}); // { questionId: { x, y, width, height } }

    useEffect(() => {
        const fetchDragAndDropQuestions = async () => {
            setLoading(true);
            setError(null);
            try {
                // Giả sử API của bạn có thể trả về câu hỏi theo type_id = 2
                const response = await apiCall('GET', `/tests/${testId}/questions?type_id=2`);

                if (response.ok && response.data) {
                    const fetchedQuestions = response.data;
                    setQuestions(fetchedQuestions);

                    // Thu thập tất cả các từ trong 'drag_options' và 'correct_answer'
                    // Sau đó trộn chúng lên để tạo danh sách đáp án kéo thả
                    let allWords = [];
                    fetchedQuestions.forEach(q => {
                        if (q.drag_options && Array.isArray(q.drag_options)) {
                            allWords = allWords.concat(q.drag_options);
                        } else {
                            // Nếu drag_options không tồn tại hoặc không phải array,
                            // thì thêm correct_answer và 3 từ giả định khác.
                            allWords.push(q.correct_answer);
                            // Thêm các từ ngẫu nhiên để làm lựa chọn sai nếu cần
                            // (Ví dụ: "table", "chair", "picture")
                        }
                    });
                    // Loại bỏ các từ trùng lặp và trộn ngẫu nhiên
                    const uniqueWords = [...new Set(allWords)];
                    setDragOptions(uniqueWords.sort(() => Math.random() - 0.5));

                    // Khởi tạo answers
                    const initialAnswers = {};
                    fetchedQuestions.forEach(q => {
                        // Lưu từ đã chọn cho mỗi câu hỏi, ban đầu là rỗng hoặc null
                        initialAnswers[q.question_id] = { selectedWord: null, placeholderRef: null };
                    });
                    setAnswers(initialAnswers);

                } else {
                    const message = response.data?.error || response.data?.message || 'Không thể tải câu hỏi điền vào chỗ trống.';
                    setError(message);
                    Alert.alert('Lỗi', message);
                }
            } catch (err) {
                console.error('Lỗi khi tải câu hỏi kéo thả:', err);
                setError('Không thể kết nối đến server để tải câu hỏi.');
                Alert.alert('Lỗi', 'Không thể kết nối đến server để tải câu hỏi.');
            } finally {
                setLoading(false);
            }
        };

        if (testId) {
            fetchDragAndDropQuestions();
        }
    }, [testId]);

    // Hàm này được gọi sau khi một từ được kéo và thả
    const handleDragEnd = useCallback(({ wordId, wordText, x, y }) => {
        let droppedIntoQuestionId = null;

        // Duyệt qua tất cả các chỗ trống để xem từ được thả vào chỗ trống nào
        for (const qId in dropZoneMeasurements.current) {
            const { px, py, pwidth, pheight } = dropZoneMeasurements.current[qId];
            if (x >= px && x <= px + pwidth && y >= py && y <= py + pheight) {
                droppedIntoQuestionId = qId;
                break;
            }
        }

        if (droppedIntoQuestionId) {
            setAnswers(prevAnswers => {
                const updatedAnswers = { ...prevAnswers };

                // Xóa từ khỏi chỗ trống cũ nếu nó đã được kéo từ chỗ đó
                for (const qId in updatedAnswers) {
                    if (updatedAnswers[qId].selectedWord === wordText) {
                        updatedAnswers[qId] = { ...updatedAnswers[qId], selectedWord: null };
                        break;
                    }
                }

                // Cập nhật từ mới vào chỗ trống hiện tại
                return {
                    ...updatedAnswers,
                    [droppedIntoQuestionId]: {
                        ...updatedAnswers[droppedIntoQuestionId],
                        selectedWord: wordText // Lưu từ được thả vào
                    }
                };
            });
            // console.log(`Dropped ${wordText} (ID: ${wordId}) into question ID: ${droppedIntoQuestionId}`);
        } else {
            // console.log(`Dropped ${wordText} (ID: ${wordId}) outside any valid drop zone.`);
        }
    }, []);

    // Hàm để đo vị trí của các chỗ trống
    const onDropZoneLayout = useCallback((questionId, event) => {
        const { x, y, width, height } = event.nativeEvent.layout;
        // Sử dụng measure để lấy vị trí trên màn hình tuyệt đối
        // (Layout event's x,y là tương đối với parent, measure là tuyệt đối)
        dropZoneRefs.current[questionId].measure((fx, fy, width, height, px, py) => {
            dropZoneMeasurements.current[questionId] = { px, py, pwidth: width, pheight: height };
            // console.log(`Measured DropZone ${questionId}:`, { px, py, width, height });
        });
    }, []);

    const checkAnswers = () => {
        let correctCount = 0;
        const results = {};

        questions.forEach(q => {
            const userAnswer = answers[q.question_id]?.selectedWord;
            const isCorrect = userAnswer && userAnswer.toLowerCase() === q.correct_answer.toLowerCase();
            if (isCorrect) {
                correctCount++;
            }
            results[q.question_id] = {
                userAnswer: userAnswer,
                correctAnswer: q.correct_answer,
                isCorrect: isCorrect
            };
        });

        // Bạn có thể lưu kết quả này vào state hoặc hiển thị Alert
        // Để đơn giản, chúng ta sẽ chuyển sang màn hình kết quả hoặc hiển thị tại chỗ
        // For now, let's just show results in a basic way
        Alert.alert(
            "Kết Quả Bài Tập",
            `Bạn đã trả lời đúng ${correctCount} / ${questions.length} câu.`,
            [
                { text: "Xem chi tiết", onPress: () => setShowResults(true) },
                { text: "Làm lại", onPress: () => navigation.replace('DragAndDropScreen', { testId, testTitle }) }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1E90FF" />
                <Text style={styles.loadingText}>Đang tải câu hỏi...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{testTitle}</Text>

            {/* Khu vực chứa các từ có thể kéo */}
            <View style={styles.dragOptionsContainer}>
                {dragOptions.map((word, index) => (
                    <DraggableWord
                        key={word + index} // Đảm bảo key duy nhất
                        id={word + index}
                        word={word}
                        onDragEnd={handleDragEnd}
                        startPosition={{ x: 0, y: 0 }} // Vị trí ban đầu không quan trọng lắm vì nó nằm trong flexbox
                    />
                ))}
            </View>

            <ScrollView style={styles.questionsContainer}>
                {questions.map((q) => {
                    const userAnswerObj = answers[q.question_id];
                    const selectedWord = userAnswerObj?.selectedWord;
                    const isCorrect = showResults && selectedWord?.toLowerCase() === q.correct_answer?.toLowerCase();
                    const isIncorrect = showResults && selectedWord && !isCorrect;

                    // Xác định phần trước và sau chỗ trống
                    const parts = q.content.split('___'); // Giả sử chỗ trống là '___'
                    const beforeBlank = parts[0];
                    const afterBlank = parts[1] || '';

                    return (
                        <View key={q.question_id} style={styles.questionItem}>
                            <Text style={styles.questionText}>
                                {beforeBlank}
                                <View
                                    ref={el => dropZoneRefs.current[q.question_id] = el}
                                    onLayout={(event) => onDropZoneLayout(q.question_id, event)}
                                    style={[
                                        styles.blankSpace,
                                        selectedWord && styles.blankSpaceFilled,
                                        isCorrect && styles.blankSpaceCorrect,
                                        isIncorrect && styles.blankSpaceIncorrect
                                    ]}
                                >
                                    <Text style={[
                                        styles.blankText,
                                        isCorrect && { color: 'white' },
                                        isIncorrect && { color: 'white' }
                                    ]}>
                                        {selectedWord || '__________'}
                                    </Text>
                                </View>
                                {afterBlank}
                            </Text>
                            {showResults && isIncorrect && (
                                <Text style={styles.correctAnswerHint}>
                                    Đáp án đúng: {q.correct_answer}
                                </Text>
                            )}
                        </View>
                    );
                })}
            </ScrollView>

            <TouchableOpacity
                style={styles.checkButton}
                onPress={checkAnswers}
            >
                <Text style={styles.checkButtonText}>Hoàn thành</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
        paddingHorizontal: 15,
        backgroundColor: '#F0F4F8',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#2C3E50',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F4F8',
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
        backgroundColor: '#F0F4F8',
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
    dragOptionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 10,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    draggableWordContainer: {
        backgroundColor: '#66BB6A', // Màu xanh lá cây đẹp
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        margin: 5,
        borderWidth: 1,
        borderColor: '#4CAF50',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
    },
    draggableWordText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    questionsContainer: {
        flex: 1,
        marginBottom: 20,
    },
    questionItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    questionText: {
        fontSize: 18,
        color: '#333',
        lineHeight: 24,
    },
    blankSpace: {
        width: 100, // Chiều rộng cố định cho chỗ trống
        height: 25,
        borderBottomWidth: 2,
        borderBottomColor: '#BBDEFB',
        marginHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'center',
        display: 'flex', // Quan trọng để Text nằm trên một dòng
    },
    blankSpaceFilled: {
        borderBottomColor: '#2196F3',
        backgroundColor: '#E3F2FD',
    },
    blankSpaceCorrect: {
        backgroundColor: '#4CAF50',
        borderBottomColor: '#388E3C',
    },
    blankSpaceIncorrect: {
        backgroundColor: '#F44336',
        borderBottomColor: '#D32F2F',
    },
    blankText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E88E5',
    },
    correctAnswerHint: {
        marginTop: 5,
        fontSize: 14,
        color: '#D32F2F',
        fontWeight: '600',
    },
    checkButton: {
        backgroundColor: '#FF5722', // Màu cam nổi bật
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 20,
        elevation: 5,
        shadowColor: '#FF5722',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    checkButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default DragAndDropScreen;