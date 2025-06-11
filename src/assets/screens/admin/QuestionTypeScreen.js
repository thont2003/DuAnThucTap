import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import axios from 'axios';

const QuestionScreen = ({ navigation }) => {
  const [questionTypes, setQuestionTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestionTypes = async () => {
      try {
        const res = await axios.get('http://192.168.1.8:3000/questiontypes');
        setQuestionTypes(res.data);
      } catch (error) {
        console.error('Lỗi khi tải question types:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionTypes();
  }, []);

 const renderItem = ({ item }) => (
  <TouchableOpacity
    style={styles.item}
    onPress={() =>
     navigation.navigate('QuestionListScreen', {
  type_id: item.type_id,
  type_name: item.type_name,
})
    }
  >
    <Text style={styles.title}>🧩 {item.type_name}</Text>
  </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📂 Thể loại câu hỏi</Text>
      <FlatList
        data={questionTypes}
        keyExtractor={(item) => item.type_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </View>
  );
};

export default QuestionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  item: {
    backgroundColor: '#e0f7fa',
    padding: 16,
    marginVertical: 8,
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00796b',
  },
});
