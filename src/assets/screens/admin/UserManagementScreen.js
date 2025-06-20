import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Platform,
} from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';

const BackIcon = require('../../images/login_signup/back.png');

const API = 'http://192.168.1.53:3000';

const UserManagementScreen = () => {
  const [users, setUsers] = useState([]);
  const [editedRoles, setEditedRoles] = useState({});
  const navigation = useNavigation();

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/api/users`);
      setUsers(res.data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách người dùng:', err);
      Alert.alert('Lỗi', 'Không thể tải danh sách người dùng. Vui lòng thử lại.');
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
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API}/api/users/${userId}`);
              fetchUsers();
              Alert.alert('Thành công', 'Người dùng đã được xoá.');
            } catch (err) {
              console.error('Lỗi khi xoá người dùng:', err);
              Alert.alert('Lỗi', 'Không thể xoá người dùng. Vui lòng thử lại.');
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
    const currentUser = users.find(user => user.id === userId);
    if (!newRole || newRole === currentUser?.role) {
      Alert.alert('Thông báo', 'Vai trò chưa thay đổi hoặc không hợp lệ.');
      return;
    }

    try {
      await axios.put(`${API}/api/users/${userId}/role`, {
        role: newRole,
      });
      fetchUsers();
      setEditedRoles((prev) => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
      Alert.alert('Thành công', 'Vai trò người dùng đã được cập nhật.');
    } catch (err) {
      console.error('Lỗi khi cập nhật vai trò:', err);
      Alert.alert('Lỗi', 'Không thể cập nhật vai trò. Vui lòng thử lại.');
    }
  };

  const renderItem = ({ item }) => {
    const currentRole = item.role;
    const selectedRole = editedRoles[item.id] ?? currentRole;
    const isEdited = selectedRole !== currentRole;

    return (
      <View style={styles.userItem}>
        <View style={styles.userInfo}>
          <Text style={styles.username}>👤 {item.username}</Text>
          <Text style={styles.currentRoleText}>🛡 Vai trò hiện tại: <Text style={{ fontWeight: 'bold' }}>{currentRole.toUpperCase()}</Text></Text>

          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedRole}
              onValueChange={(itemValue) => handleRoleChange(item.id, itemValue)}
              style={styles.picker}
              mode="dropdown"
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="Người dùng (User)" value="user" />
              <Picker.Item label="Quản trị viên (Admin)" value="admin" />
            </Picker>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton, !isEdited && styles.buttonDisabled]}
            onPress={() => handleUpdateRole(item.id)}
            disabled={!isEdited}
          >
            <Text style={styles.buttonText}>Lưu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
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
      {/* Updated Header structure */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Image source={BackIcon} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quản lý người dùng</Text>
          <View style={styles.placeholder} /> 
        </View>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContentContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>Không có người dùng nào để hiển thị.</Text>
          </View>
        )}
      />
    </View>
  );
};

export default UserManagementScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0E5FF',
  },
  // START: Updated Header styles to match LevelScreen
  header: { // Renamed from headerWrapper
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    paddingTop: 40, // Consistent with LevelScreen
    
  },
  headerRow: { // Renamed from headerContainer
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15, // Consistent with LevelScreen
    paddingBottom: 10,     // Consistent with LevelScreen
  },
  backButton: {
    padding: 5, // Consistent with LevelScreen
  },
  backIcon: { // Renamed from backIconImage
    width: 24,
    height: 24,
    tintColor: '#333', // Consistent with LevelScreen
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,      // Consistent with LevelScreen
    fontWeight: 'bold', // Consistent with LevelScreen
    color: '#333',     // Consistent with LevelScreen
    // Removed marginLeft: -44 as the placeholder will handle spacing
  },
  placeholder: {
    width: 30, // Consistent with LevelScreen
  },
  // END: Updated Header styles

  listContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    marginTop: 30, // Adjusted margin-top to clear the fixed header (40 padding + ~50 header height)
  },
  userItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginRight: 10,
  },
  username: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34495e',
    marginBottom: 4,
  },
  currentRoleText: {
    fontSize: 15,
    color: '#555',
    marginBottom: 10,
  },
  pickerWrapper: {
    backgroundColor: '#ECF0F1',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BDC3C7',
    overflow: 'hidden',
    marginTop: 5,
    height: 54,
    justifyContent: 'center',
  },
  picker: {
    height: '100%',
    width: '100%',
    color: '#34495e',
  },
  pickerItem: {
    fontSize: 16,
    height: 48,
    textAlign: 'left',
  },
  actions: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#2ECC71',
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
  },
  buttonDisabled: {
    backgroundColor: '#AAB7B8',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyListText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});