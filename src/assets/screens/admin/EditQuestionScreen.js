import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import axios from 'axios';

const EditQuestionScreen = ({ route, navigation }) => {
  const { question_id, currentContent, currentAnswer } = route.params;

  const [content, setContent] = useState(currentContent);
  const [correctAnswer, setCorrectAnswer] = useState(currentAnswer);

  const handleUpdate = async () => {
    try {
      await axios.put(`http://192.168.1.18:3000/questions/${question_id}`, {
        content,
        correct_answer: correctAnswer,
      });
      Alert.alert('✅ Thành công', 'Cập nhật câu hỏi và đáp án đúng thành công');
      navigation.goBack();
    } catch (err) {
      Alert.alert('❌ Lỗi', 'Không thể cập nhật câu hỏi');
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nội dung câu hỏi</Text>
      <TextInput
        style={styles.input}
        value={content}
        onChangeText={setContent}
        multiline
      />

      <Text style={styles.label}>Đáp án đúng</Text>
      <TextInput
        style={styles.input}
        value={correctAnswer}
        onChangeText={setCorrectAnswer}
      />

      <Button title="Cập nhật" onPress={handleUpdate} />
    </View>
  );
};

export default EditQuestionScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { marginBottom: 8, fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 20,
  },
});