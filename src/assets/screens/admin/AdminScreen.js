 import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const AdminScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>📋 Quản trị hệ thống</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('LevelScreen')}
      >
        <Text style={styles.buttonText}>🎯 Quản lý Cấp độ (Level)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#6f42c1' }]}
        onPress={() => navigation.navigate('UnitScreen')}
      >
        <Text style={styles.buttonText}>📚 Quản lý Đơn vị (Unit)</Text>
      </TouchableOpacity>
      <TouchableOpacity
  style={[styles.button, { backgroundColor: '#28a745' }]}
  onPress={() => navigation.navigate('QuestionTypeScreen')}
>
  <Text style={styles.buttonText}>🧩 Quản lý Thể loại câu hỏi</Text>
</TouchableOpacity>

<TouchableOpacity
  style={[styles.button, { backgroundColor: '#dc3545' }]}
  onPress={() => navigation.navigate('QuestionListScreen')}
>
  <Text style={styles.buttonText}>❓ Quản lý Câu hỏi</Text>
</TouchableOpacity>

    </View>
  );
};

export default AdminScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
    color: '#212529',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
