import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TextInput, TouchableOpacity, Alert, StyleSheet, Image,
    KeyboardAvoidingView, Platform, ActivityIndicator, RefreshControl
} from 'react-native';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation

// Import your back icon (ensure this path is correct relative to this file)
// Giả định đường dẫn này là đúng, ví dụ: nằm ở cùng cấp với components hoặc trong thư mục assets
const BackIcon = require('../../images/login_signup/back.png'); // Điều chỉnh đường dẫn nếu cần

const API = 'http://192.168.1.53:3000'; // THAY THẾ BẰNG IP VÀ PORT CỦA SERVER BACKEND CỦA BẠN

const QUESTION_IMAGE_UPLOAD_URL = `${API}/api/upload-question-image`;

const QuestionListScreen = ({ route }) => {
    const navigation = useNavigation(); // Initialize navigation
    const { testId, questionTypeId, testTitle, questionTypeName } = route.params;

    const [questions, setQuestions] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [editForm, setEditForm] = useState({
        content: '',
        image_path: null,
        selectedImageUri: null,
        correct_answer: '',
        answers: [
            { answer_text: '', is_correct: false },
            { answer_text: '', is_correct: false },
            { answer_text: '', is_correct: false },
            { answer_text: '', is_correct: false },
        ]
    });

    const [addForm, setAddForm] = useState({
        content: '',
        image_path: null,
        selectedImageUri: null,
        correct_answer: '',
        answers: [
            { answer_text: '', is_correct: false },
            { answer_text: '', is_correct: false },
            { answer_text: '', is_correct: false },
            { answer_text: '', is_correct: false },
        ]
    });

    // Hàm reset form
    const resetForm = () => {
        setEditingId(null);
        setEditForm({
            content: '',
            image_path: null,
            selectedImageUri: null,
            correct_answer: '',
            answers: [
                { answer_text: '', is_correct: false },
                { answer_text: '', is_correct: false },
                { answer_text: '', is_correct: false },
                { answer_text: '', is_correct: false },
            ]
        });
        setAddForm({
            content: '',
            image_path: null,
            selectedImageUri: null,
            correct_answer: '',
            answers: [
                { answer_text: '', is_correct: false },
                { answer_text: '', is_correct: false },
                { answer_text: '', is_correct: false },
                { answer_text: '', is_correct: false },
            ]
        });
    };

    // Hàm lấy danh sách câu hỏi
    const fetchQuestions = useCallback(async () => {
        if (!testId || !questionTypeId) return;
        setIsLoading(true);
        setRefreshing(true); // Bắt đầu làm mới
        try {
            const { data } = await axios.get(`${API}/questions`, {
                params: { test_id: testId, type_id: questionTypeId }
            });
            setQuestions(data);
        } catch (e) {
            console.error('Lỗi khi tải câu hỏi:', e.response?.data || e.message);
            Alert.alert('Lỗi', 'Không thể tải câu hỏi. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
            setRefreshing(false); // Kết thúc làm mới
        }
    }, [testId, questionTypeId]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    // Hàm chọn ảnh từ thư viện
    const handleImagePick = (formType) => { // formType: 'add' or 'edit'
        const options = {
            mediaType: 'photo',
            quality: 0.7,
            maxWidth: 1024,
            maxHeight: 1024,
            includeBase64: false,
        };

        launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                console.log('Người dùng đã hủy chọn ảnh.');
            } else if (response.error) {
                console.error('Lỗi ImagePicker: ', response.error);
                Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
            } else if (response.assets && response.assets.length > 0) {
                const asset = response.assets[0];
                if (formType === 'add') {
                    setAddForm(prev => ({ ...prev, selectedImageUri: asset.uri, image_path: null }));
                } else if (formType === 'edit') {
                    setEditForm(prev => ({ ...prev, selectedImageUri: asset.uri, image_path: null }));
                }
            } else {
                Alert.alert('Lỗi', 'Không có ảnh nào được chọn hoặc phản hồi không hợp lệ.');
            }
        });
    };

    // Hàm tải ảnh lên backend
    const uploadImageToServer = async (uri, oldImagePath = null) => {
        if (!uri && !oldImagePath) return null; // Không có ảnh mới và không có ảnh cũ để xóa

        const formData = new FormData();
        if (uri) {
            const fileExtension = uri.split('.').pop();
            const mimeType = `image/${fileExtension.toLowerCase()}`;
            const filename = `question_image_${Date.now()}.${fileExtension.toLowerCase()}`;
            formData.append('questionImage', { // Tên field phải khớp với Multer trên server ('questionImage')
                uri: uri,
                type: mimeType,
                name: filename,
            });
        }
        if (oldImagePath) {
            formData.append('oldImagePath', oldImagePath); // Gửi đường dẫn ảnh cũ để server biết mà xóa
        }

        try {
            const response = await fetch(QUESTION_IMAGE_UPLOAD_URL, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            const result = await response.json();

            if (response.ok) {
                return result.imageUrl || null; // Trả về đường dẫn ảnh trên server hoặc null nếu ảnh bị xóa
            } else {
                throw new Error(result.error || 'Không thể tải ảnh lên.');
            }
        } catch (error) {
            console.error('Lỗi tải ảnh:', error);
            Alert.alert('Lỗi', `Tải ảnh lên thất bại: ${error.message || 'Lỗi không xác định.'}`);
            throw error;
        }
    };

    // Hàm bắt đầu chỉnh sửa câu hỏi
    const startEdit = q => {
        setEditingId(q.question_id);
        const currentForm = {
            content: q.content || '',
            image_path: q.image_path || null,
            selectedImageUri: null, // Luôn reset khi bắt đầu chỉnh sửa
            correct_answer: '',
            answers: [
                { answer_text: '', is_correct: false },
                { answer_text: '', is_correct: false },
                { answer_text: '', is_correct: false },
                { answer_text: '', is_correct: false },
            ]
        };

        if (questionTypeId === 2) { // Câu hỏi điền đáp án
            currentForm.correct_answer = q.correct_answer || '';
        } else { // Câu hỏi trắc nghiệm
            // Gán đáp án hiện có vào form
            q.answers.forEach((ans, index) => {
                if (index < 4) { // Đảm bảo chỉ lấy 4 đáp án
                    currentForm.answers[index] = {
                        answer_text: ans.answer_text || '',
                        is_correct: ans.is_correct || false
                    };
                }
            });
            // Nếu ít hơn 4 đáp án, điền phần còn lại bằng giá trị mặc định
            for (let i = q.answers.length; i < 4; i++) {
                currentForm.answers[i] = { answer_text: '', is_correct: false };
            }
        }
        setEditForm(currentForm);
    };

    // Hàm lưu chỉnh sửa câu hỏi
    const saveEdit = async () => {
        if (!editingId || !editForm.content.trim()) {
            return Alert.alert('Lỗi', 'Nội dung câu hỏi không được trống.');
        }
        setIsSubmitting(true);
        let finalImagePath = editForm.image_path; // Mặc định giữ ảnh cũ từ server

        try {
            if (editForm.selectedImageUri) {
                // Có ảnh mới được chọn từ thiết bị, tải lên server và xóa ảnh cũ (nếu có)
                finalImagePath = await uploadImageToServer(editForm.selectedImageUri, editForm.image_path);
            } else if (editForm.image_path && finalImagePath === null) {
                // Trường hợp người dùng đã có ảnh cũ, đã bấm nút "X" để xóa ảnh,
                // và không chọn ảnh mới. Lúc này editForm.image_path vẫn là ảnh cũ ban đầu,
                // nhưng chúng ta muốn nó thành null. Cần gọi uploadImageToServer với null để backend xóa ảnh cũ.
                finalImagePath = await uploadImageToServer(null, editForm.image_path);
            } else if (!editForm.image_path && !editForm.selectedImageUri) {
                // Không có ảnh cũ và không chọn ảnh mới (hoặc đã xóa ảnh cũ)
                finalImagePath = null;
            }
            // else: Không có ảnh mới được chọn và editForm.image_path đã có giá trị (người dùng muốn giữ ảnh cũ)
            // thì finalImagePath vẫn giữ giá trị của editForm.image_path

            const payload = {
                content: editForm.content,
                image_path: finalImagePath,
                type_id: questionTypeId,
                test_id: testId,
                audio_path: null, // Nếu có audio, bạn cần thêm logic vào đây
            };

            if (questionTypeId === 2) {
                if (!editForm.correct_answer.trim()) {
                    return Alert.alert('Lỗi', 'Đáp án đúng không được trống cho loại tự luận.');
                }
                payload.correct_answer = editForm.correct_answer;
            } else { // Trắc nghiệm
                const filledAnswers = editForm.answers.filter(a => a.answer_text.trim() !== '');
                if (filledAnswers.length !== 4) {
                    return Alert.alert('Lỗi', 'Câu hỏi trắc nghiệm phải có đúng 4 đáp án.');
                }
                const correctCount = editForm.answers.filter(a => a.is_correct).length;
                if (correctCount !== 1) {
                    return Alert.alert('Lỗi', 'Câu hỏi trắc nghiệm phải có đúng 1 đáp án đúng.');
                }
                payload.answers = editForm.answers;
            }

            await axios.put(`${API}/questions/${editingId}`, payload);
            Alert.alert('Thành công', 'Câu hỏi đã được cập nhật.');
            resetForm();
            fetchQuestions();
        } catch (e) {
            console.error('Lỗi khi lưu sửa:', e.response?.data || e.message);
            Alert.alert('Lỗi', e.response?.data?.error || e.message || 'Không thể lưu chỉnh sửa.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Hàm xác nhận xóa câu hỏi
    const confirmDelete = (id) => {
        Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa câu hỏi này?', [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Xóa', style: 'destructive', onPress: () => deleteQuestion(id) }
        ]);
    };

    // Hàm xóa câu hỏi
    const deleteQuestion = async (id) => {
        setIsLoading(true);
        try {
            await axios.delete(`${API}/questions/${id}`);
            Alert.alert('Thành công', 'Câu hỏi đã được xóa.');
            fetchQuestions();
        } catch (e) {
            console.error('Lỗi khi xóa:', e.response?.data || e.message);
            Alert.alert('Lỗi', e.response?.data?.error || e.message || 'Không thể xóa câu hỏi.');
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm thêm câu hỏi mới
    const addQuestion = async () => {
        if (!addForm.content.trim()) {
            return Alert.alert('Lỗi', 'Nội dung câu hỏi không được trống.');
        }
        setIsSubmitting(true);
        let finalImagePath = null;

        try {
            if (addForm.selectedImageUri) {
                // Tải ảnh mới lên server
                finalImagePath = await uploadImageToServer(addForm.selectedImageUri);
            }

            const payload = {
                content: addForm.content,
                image_path: finalImagePath, // Sử dụng đường dẫn ảnh từ server
                type_id: questionTypeId,
                test_id: testId,
                audio_path: null, // Nếu có audio, bạn cần thêm logic vào đây
            };

            if (questionTypeId === 2) {
                if (!addForm.correct_answer.trim()) {
                    return Alert.alert('Lỗi', 'Đáp án đúng không được trống cho loại tự luận.');
                }
                payload.correct_answer = addForm.correct_answer;
            } else { // Trắc nghiệm
                const filledAnswers = addForm.answers.filter(a => a.answer_text.trim() !== '');
                if (filledAnswers.length !== 4) {
                    return Alert.alert('Lỗi', 'Câu hỏi trắc nghiệm phải có đúng 4 đáp án.');
                }
                const correctCount = addForm.answers.filter(a => a.is_correct).length;
                if (correctCount !== 1) {
                    return Alert.alert('Lỗi', 'Câu hỏi trắc nghiệm phải có đúng 1 đáp án đúng.');
                }
                payload.answers = addForm.answers;
            }

            await axios.post(`${API}/questions`, payload);
            Alert.alert('Thành công', 'Câu hỏi đã được thêm.');
            resetForm();
            fetchQuestions();
        } catch (e) {
            console.error('Lỗi khi thêm:', e.response?.data || e.message);
            Alert.alert('Lỗi', e.response?.data?.error || e.message || 'Không thể thêm câu hỏi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Cập nhật text đáp án trắc nghiệm
    const handleAnswerChange = (text, index, formType) => {
        const formSetter = formType === 'add' ? setAddForm : setEditForm;
        formSetter(prev => {
            const newAnswers = [...prev.answers];
            newAnswers[index] = { ...newAnswers[index], answer_text: text };
            return { ...prev, answers: newAnswers };
        });
    };

    // Xử lý chọn đáp án đúng cho trắc nghiệm
    const handleCorrectAnswerToggle = (index, formType) => {
        const formSetter = formType === 'add' ? setAddForm : setEditForm;
        formSetter(prev => {
            const newAnswers = prev.answers.map((ans, i) => ({
                ...ans,
                is_correct: i === index // Đặt chỉ đáp án hiện tại là đúng, các cái khác là sai
            }));
            return { ...prev, answers: newAnswers };
        });
    };

    // Hàm hiển thị một thẻ câu hỏi (trong FlatList)
    const renderCard = ({ item }) => {
        const isEditing = editingId === item.question_id;
        const currentForm = isEditing ? editForm : null; // Dùng editForm khi đang sửa

        return (
            <View style={[styles.card, isEditing && styles.editingCard]}>
                {isEditing ? (
                    <>
                        <TextInput
                            value={currentForm.content}
                            onChangeText={t => setEditForm({ ...currentForm, content: t })}
                            style={styles.input}
                            multiline
                            placeholder="Nội dung câu hỏi"
                        />
                        {/* Chọn ảnh */}
                        <TouchableOpacity style={styles.imagePickerButton} onPress={() => handleImagePick('edit')}>
                            <Text style={styles.imagePickerButtonText}>Chọn ảnh</Text>
                        </TouchableOpacity>
                        {(currentForm.selectedImageUri || currentForm.image_path) ? (
                            <View style={styles.previewImageContainer}>
                                <Image
                                    source={{ uri: currentForm.selectedImageUri ? currentForm.selectedImageUri : `${API}${currentForm.image_path}` }}
                                    style={styles.previewImage}
                                    onError={(e) => console.log('Error loading image for edit form:', e.nativeEvent.error)}
                                />
                                <TouchableOpacity
                                    style={styles.removeImageButton}
                                    onPress={() => {
                                        Alert.alert(
                                            "Xác nhận xóa ảnh",
                                            "Bạn có muốn xóa ảnh này?",
                                            [{ text: "Hủy", style: "cancel" }, {
                                                text: "Xóa", onPress: () => setEditForm(prev => ({
                                                    ...prev, selectedImageUri: null, image_path: null
                                                }))
                                            }]
                                        );
                                    }}
                                >
                                    <Text style={styles.removeImageButtonText}>X</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Text style={styles.noImageText}>Chưa có ảnh nào được chọn.</Text>
                        )}

                        {questionTypeId === 1 ? ( // Trắc nghiệm
                            currentForm.answers.map((answer, idx) => (
                                <View key={idx} style={styles.answerInputRow}>
                                    <TextInput
                                        placeholder={`Đáp án ${idx + 1}`}
                                        value={answer.answer_text}
                                        onChangeText={t => handleAnswerChange(t, idx, 'edit')}
                                        style={[styles.input, styles.answerTextInput]}
                                    />
                                    <TouchableOpacity
                                        style={[styles.checkbox, answer.is_correct && styles.checkboxChecked]}
                                        onPress={() => handleCorrectAnswerToggle(idx, 'edit')}
                                    >
                                        {answer.is_correct && <Text style={styles.checkboxText}>✓</Text>}
                                    </TouchableOpacity>
                                </View>
                            ))
                        ) : ( // Điền đáp án
                            <TextInput
                                placeholder="Đáp án đúng"
                                value={currentForm.correct_answer}
                                onChangeText={t => setEditForm({ ...currentForm, correct_answer: t })}
                                style={styles.input}
                            />
                        )}
                        <View style={styles.row}>
                            <TouchableOpacity style={[styles.btn, styles.save]} onPress={saveEdit} disabled={isSubmitting}>
                                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Lưu</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={() => resetForm()} disabled={isSubmitting}>
                                <Text style={styles.btnText}>Hủy</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : ( // Hiển thị thông tin câu hỏi
                    <>
                        <Text style={styles.content}>{item.content}</Text>
                        {item.image_path ? <Image source={{ uri: `${API}${item.image_path}` }} style={styles.thumb} onError={(e) => console.log('Error loading image for display:', item.image_path, e.nativeEvent.error)} /> : null}
                        {questionTypeId === 2 ? (
                            <Text style={styles.correctAnswerDisplay}>Đúng: {item.correct_answer}</Text>
                        ) : (
                            item.answers.map((a, i) => (
                                <Text key={i} style={[styles.answerDisplay, a.is_correct && styles.correctAnswerDisplay]}>
                                    {a.answer_text} {a.is_correct ? '(Đúng)' : ''}
                                </Text>
                            ))
                        )}
                        <View style={styles.row}>
                            <TouchableOpacity style={[styles.btn, styles.edit]} onPress={() => startEdit(item)}>
                                <Text style={styles.btnText}>Sửa</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.delete]} onPress={() => confirmDelete(item.question_id)}>
                                <Text style={styles.btnText}>Xóa</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        );
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {/* NEW: Header adapted from LevelScreen/UserManagementScreen */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    >
                        <Image source={BackIcon} style={styles.backIcon} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{questionTypeName} - {testTitle}</Text>
                    <View style={styles.placeholder} />
                </View>
            </View>

            <FlatList
                data={questions}
                keyExtractor={item => item.question_id.toString()}
                renderItem={renderCard}
                contentContainerStyle={styles.flatListContentContainer} // Adjusted for header
                ListHeaderComponent={
                    <View style={styles.card}>
                        <Text style={styles.addQuestionHeader}>Thêm Câu Hỏi Mới</Text>

                        <TextInput
                            value={addForm.content}
                            onChangeText={t => setAddForm({ ...addForm, content: t })}
                            placeholder="Nội dung câu hỏi"
                            style={styles.input}
                            multiline
                        />

                        {/* Chọn ảnh cho form thêm mới */}
                        <TouchableOpacity style={styles.imagePickerButton} onPress={() => handleImagePick('add')}>
                            <Text style={styles.imagePickerButtonText}>Chọn ảnh minh họa (Tùy chọn)</Text>
                        </TouchableOpacity>
                        {addForm.selectedImageUri ? (
                            <View style={styles.previewImageContainer}>
                                <Image source={{ uri: addForm.selectedImageUri }} style={styles.previewImage} />
                                <TouchableOpacity
                                    style={styles.removeImageButton}
                                    onPress={() => {
                                        Alert.alert(
                                            "Xác nhận xóa ảnh",
                                            "Bạn có muốn xóa ảnh này?",
                                            [{ text: "Hủy", style: "cancel" }, {
                                                text: "Xóa", onPress: () => setAddForm(prev => ({
                                                    ...prev, selectedImageUri: null, image_path: null
                                                }))
                                            }]
                                        );
                                    }}
                                >
                                    <Text style={styles.removeImageButtonText}>X</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Text style={styles.noImageText}>Chưa có ảnh nào được chọn.</Text>
                        )}


                        {questionTypeId === 1 ? ( // Trắc nghiệm
                            addForm.answers.map((answer, idx) => (
                                <View key={idx} style={styles.answerInputRow}>
                                    <TextInput
                                        placeholder={`Đáp án ${idx + 1}`}
                                        value={answer.answer_text}
                                        onChangeText={t => handleAnswerChange(t, idx, 'add')}
                                        style={[styles.input, styles.answerTextInput]}
                                    />
                                    <TouchableOpacity
                                        style={[styles.checkbox, answer.is_correct && styles.checkboxChecked]}
                                        onPress={() => handleCorrectAnswerToggle(idx, 'add')}
                                    >
                                        {answer.is_correct && <Text style={styles.checkboxText}>✓</Text>}
                                    </TouchableOpacity>
                                </View>
                            ))
                        ) : ( // Điền đáp án
                            <TextInput
                                placeholder="Đáp án đúng"
                                value={addForm.correct_answer}
                                onChangeText={t => setAddForm({ ...addForm, correct_answer: t })}
                                style={styles.input}
                            />
                        )}

                        <TouchableOpacity
                            style={[styles.btn, styles.save, isSubmitting && { backgroundColor: '#a5d6a7' }]} // Lighter green when disabled
                            disabled={isSubmitting}
                            onPress={addQuestion}
                        >
                            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Thêm Câu Hỏi</Text>}
                        </TouchableOpacity>
                    </View>
                }
                ListEmptyComponent={
                    isLoading ? (
                        <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 50 }} />
                    ) : (
                        <Text style={styles.emptyListText}>Chưa có câu hỏi nào cho bài kiểm tra này.</Text>
                    )
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchQuestions} tintColor="#4CAF50" />
                }
            />
        </KeyboardAvoidingView>
    );
};

export default QuestionListScreen;

const styles = StyleSheet.create({
    // Main container should not have padding if FlatList's contentContainerStyle handles it
    // We put padding inside flatListContentContainer now.
    container: {
        flex: 1, // This is for KeyboardAvoidingView.
        backgroundColor: '#FFFFFF', // Đã đổi sang màu trắng
    },
    // START: Header styles consistent with LevelScreen and UserManagementScreen
    header: {
        backgroundColor: '#FFFFFF',
        elevation: 4, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 2 }, // iOS shadow
        shadowOpacity: 0.1, // iOS shadow
        shadowRadius: 3, // iOS shadow
        paddingTop: Platform.OS === 'ios' ? 40 : 20, // Adjust for iOS notch/safe area
        position: 'absolute', // Make header fixed
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10, // Ensure header is above content
        height: Platform.OS === 'ios' ? 90 : 100, // Consistent height for the header
        justifyContent: 'flex-end', // Align content to the bottom of the header
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingBottom: 10,
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
        fontSize: 24, // Slightly smaller for long titles
        fontWeight: 'bold',
        color: '#333',
    },
    placeholder: {
        width: 30, // Occupy space for centering
    },
    // END: Header styles

    flatListContentContainer: {
        padding: 16,
        paddingTop: 130, // Space for fixed header + padding
        backgroundColor: '#E0E5FF', // Đã đổi sang màu trắng
        flexGrow: 1, // Ensure it fills available space
    },
    card: {
        backgroundColor: '#fff', // Vẫn là trắng, phù hợp
        padding: 16,
        marginBottom: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    editingCard: {
        borderColor: '#2196F3',
        borderWidth: 2,
    },
    addQuestionHeader: { // Specific style for the "Add New Question" section
        fontWeight: 'bold',
        fontSize: 20,
        marginBottom: 15,
        color: '#2e7d32', // Green for "Add" section
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 12,
        marginVertical: 8,
        borderRadius: 10,
        backgroundColor: '#fdfdfd',
        fontSize: 16,
    },
    content: { fontSize: 17, fontWeight: '500', marginBottom: 8, color: '#333' },
    answerDisplay: {
        fontSize: 15,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#f2f2f2',
        borderRadius: 8,
        marginVertical: 3,
        color: '#555',
    },
    correctAnswerDisplay: {
        backgroundColor: '#d0f0c0',
        color: '#2e7d32',
        fontWeight: 'bold',
        fontSize: 16,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginVertical: 3,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
    btn: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 4,
        minWidth: 100,
    },
    save: { backgroundColor: '#4CAF50' },
    cancel: { backgroundColor: '#9E9E9E' },
    edit: { backgroundColor: '#2196F3' },
    delete: { backgroundColor: '#F44336' },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
    thumb: {
        width: '100%',
        height: 200,
        marginTop: 10,
        borderRadius: 10,
        resizeMode: 'contain',
        borderColor: '#e0e0e0',
        borderWidth: 1,
    },

    imagePickerButton: {
        backgroundColor: '#007bff',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    imagePickerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    previewImageContainer: {
        position: 'relative',
        marginBottom: 20,
        marginTop: 10,
        borderRadius: 10,
        overflow: 'hidden',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    previewImage: {
        width: '100%',
        height: 200,
        resizeMode: 'contain',
        borderRadius: 10,
    },
    removeImageButton: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(220, 53, 69, 0.8)',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    removeImageButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    noImageText: {
        textAlign: 'center',
        color: '#888',
        marginTop: 10,
        marginBottom: 20,
        fontStyle: 'italic',
        fontSize: 14,
    },
    emptyListText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#777',
    },
    answerInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    answerTextInput: {
        flex: 1,
        marginVertical: 0,
        marginRight: 10,
    },
    checkbox: {
        width: 25,
        height: 25,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#555',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    checkboxChecked: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    checkboxText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});