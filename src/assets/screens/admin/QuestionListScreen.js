import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Image } from 'react-native';
import axios from 'axios';

const QuestionListScreen = ({ route }) => {
  const { type_id, type_name } = route.params;
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get(`http://192.168.1.18:3000/questions/${Number(type_id)}`);
        setQuestions(res.data);
      } catch (error) {
        console.error('Lỗi khi tải câu hỏi:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [type_id]);

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.title}>📝 Câu hỏi #{item.question_id}</Text>
      <Text style={styles.content}>{item.content}</Text>
      {item.image_path && (
        <Image
          source={{ uri: item.image_path }}
          style={styles.image}
        />
      )}
      {item.correct_answer ? (
        <Text style={styles.answer}>✅ Đáp án đúng: {item.correct_answer}</Text>
      ) : null}
    </View>
  );

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📋 Danh sách câu hỏi - {type_name}</Text>
      <FlatList
        data={questions}
        keyExtractor={(item) => item.question_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </View>
  );
};

export default QuestionListScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  item: {
    backgroundColor: '#f1f8e9',
    padding: 16,
    marginVertical: 8,
    borderRadius: 10,
    borderColor: '#c5e1a5',
    borderWidth: 1,
  },
  title: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  content: { fontSize: 15, color: '#444', marginBottom: 8 },
  image: { width: '100%', height: 180, resizeMode: 'contain', marginTop: 10, borderRadius: 10 },
  answer: { color: '#2e7d32', fontStyle: 'italic', marginTop: 8 },
});
