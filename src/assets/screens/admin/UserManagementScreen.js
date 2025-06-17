import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';

const API = 'http://192.168.1.25:3000';

const UserManagementScreen = () => {
  const [users, setUsers] = useState([]);
  const [editedRoles, setEditedRoles] = useState({});

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/api/users`);
      setUsers(res.data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách người dùng:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (userId) => {
    Alert.alert(
      'Xác nhận xoá',
      'Bạn có chắc chắn muốn xoá người dùng này?',
      [
        { text: 'Huỷ' },
        {
          text: 'Xoá',
          onPress: async () => {
            try {
              await axios.delete(`${API}/api/users/${userId}`);
              fetchUsers();
            } catch (err) {
              console.error('Lỗi khi xoá người dùng:', err);
            }
          },
        },
      ]
    );
  };

  const handleRoleChange = (userId, newRole) => {
    setEditedRoles((prev) => ({
      ...prev,
      [userId]: newRole,
    }));
  };

  const handleUpdateRole = async (userId) => {
    const newRole = editedRoles[userId];
    if (!newRole) return;

    try {
      await axios.put(`${API}/api/users/${userId}/role`, {
        role: newRole,
      });
      fetchUsers();
    } catch (err) {
      console.error('Lỗi khi cập nhật vai trò:', err);
    }
  };

  const renderItem = ({ item }) => {
    const currentRole = item.role;
    const selectedRole = editedRoles[item.id] ?? currentRole;

    return (
      <View style={styles.userItem}>
        <View style={{ flex: 1 }}>
          <Text style={styles.username}>👤 {item.username}</Text>
          <Text style={styles.roleText}>🛡 Vai trò hiện tại: {currentRole}</Text>

          <Picker
            selectedValue={selectedRole}
            onValueChange={(itemValue) => handleRoleChange(item.id, itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="user" value="user" />
            <Picker.Item label="admin" value="admin" />
          </Picker>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#28a745' }]}
            onPress={() => handleUpdateRole(item.id)}
          >
            <Text style={styles.buttonText}>Lưu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#dc3545' }]}
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.buttonText}>Xoá</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👥 Quản lý người dùng</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 50 }}
      />
    </View>
  );
};

export default UserManagementScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f1f3f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#343a40',
  },
  userItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    flexDirection: 'row',
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  roleText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#495057',
  },
  picker: {
    height: 40,
    width: '100%',
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    marginBottom: 10,
  },
  actions: {
    justifyContent: 'space-between',
    marginLeft: 10,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});