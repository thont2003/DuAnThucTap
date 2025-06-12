import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  FlatList
} from 'react-native';

const API_URL = 'http://192.168.1.18:3000/units'; // Thay IP nếu cần
const LEVEL_API_URL = 'http://192.168.1.18:3000/levels'; // API lấy danh sách levels

const UnitScreen = () => {
  const [unitName, setUnitName] = useState('');
  const [imageName, setImageName] = useState('');
  const [units, setUnits] = useState([]);
  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [editingUnit, setEditingUnit] = useState(null);

  // Lấy danh sách units
  const fetchUnits = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (res.ok) setUnits(data);
      else throw new Error('Không thể lấy danh sách unit');
    } catch (err) {
      console.error('Lỗi fetch units:', err);
      Alert.alert('Lỗi', 'Không thể lấy danh sách unit');
    }
  };

  // Lấy danh sách levels (có thể thay bằng dữ liệu mẫu nếu chưa có API)
  const fetchLevels = async () => {
    try {
      const res = await fetch(LEVEL_API_URL);
      const data = await res.json();
      if (res.ok) setLevels(data);
      else throw new Error('Không thể lấy danh sách level');
    } catch (err) {
      console.error('Lỗi fetch levels:', err);
      // Nếu không có API, ta có thể dùng dữ liệu mẫu
      setLevels([
        { level_id: 1, name: 'Cấp Đồng' },
        { level_id: 2, name: 'Cấp Bạc' },
        { level_id: 3, name: 'Cấp Vàng' },
      ]);
    }
  };

  useEffect(() => {
    fetchUnits();
    fetchLevels();
  }, []);

  // Khi edit unit, cũng lấy level hiện tại để chọn
  const startEditingUnit = (unit) => {
  setEditingUnit(unit.unit_id);
  setUnitName(unit.title);
  setImageName(unit.image_url || '');
  setSelectedLevel(unit.level_id || null);
};

  // Xử lý thêm mới unit
const handleAddUnit = async () => {
  if (!unitName.trim()) {
    return Alert.alert('Lỗi', 'Vui lòng nhập tên unit');
  }
  if (!selectedLevel) {
    return Alert.alert('Lỗi', 'Vui lòng chọn cấp độ Level');
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title: unitName, 
        image_url: imageName,
        level_id: selectedLevel,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      Alert.alert('Thành công', `Đã thêm unit: ${data.title}`);
      setUnitName('');
      setImageName('');
      setSelectedLevel(null);
      fetchUnits();
    } else {
      Alert.alert('Lỗi', data.error || 'Không thêm được unit');
    }
  } catch (err) {
    console.error('Lỗi:', err);
    Alert.alert('Lỗi', 'Không thể kết nối đến server');
  }
};

  // Cập nhật unit
const handleUpdateUnit = async () => {
  if (!editingUnit) {
    return Alert.alert('Lỗi', 'Không có unit nào để cập nhật');
  }

  try {
    const response = await fetch(`${API_URL}/${editingUnit}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        level_id: selectedLevel,
        title: unitName,
        image_url: imageName,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Lỗi server:', text);
      Alert.alert('Lỗi', 'Không thể cập nhật unit.');
      return;
    }

    const data = await response.json();
    console.log('Cập nhật thành công:', data);
    Alert.alert('Thành công', 'Unit đã được cập nhật.');
    // Reset lại form
    setEditingUnit(null);
    setUnitName('');
    setImageName('');
    setSelectedLevel(null);
    fetchUnits();
  } catch (err) {
    console.error('Lỗi:', err);
    Alert.alert('Lỗi', 'Không thể kết nối đến server.');
  }
};

  const handleDeleteUnit = async (unitId) => {
  try {
    const response = await fetch(API_URL, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: unitId }),
    });

    const data = await response.json();

    if (response.ok) {
      Alert.alert('Đã xóa', `Đã xóa unit: ${data.deletedUnit.title}`);
      fetchUnits();
    } else {
      Alert.alert('Lỗi', data.error || 'Không xóa được unit');
    }
  } catch (err) {
    console.error('Lỗi:', err);
    Alert.alert('Lỗi', 'Không thể kết nối đến server');
  }
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>📘 Quản lý Unit</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Tên Unit</Text>
        <TextInput
          style={styles.input}
          placeholder="VD: Unit 1, Unit 2..."
          value={unitName}
          onChangeText={setUnitName}
        />

        <Text style={styles.label}>Tên ảnh (PNG)</Text>
        <TextInput
          style={styles.input}
          placeholder="VD: unit1.png"
          value={imageName}
          onChangeText={setImageName}
        />

        <Text style={[styles.label, { marginTop: 15 }]}>Chọn Level</Text>
        <View style={styles.levelList}>
          {levels.map(level => (
            <TouchableOpacity
              key={level.level_id}
              style={[
                styles.levelItem,
                selectedLevel === level.level_id && styles.levelItemSelected,
              ]}
              onPress={() => setSelectedLevel(level.level_id)}
            >
              <Text
                style={[
                  styles.levelItemText,
                  selectedLevel === level.level_id && styles.levelItemTextSelected,
                ]}
              >
                {level.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {editingUnit ? (
          <TouchableOpacity
            style={[styles.button, styles.updateButton]}
            onPress={handleUpdateUnit}
          >
            <Text style={styles.buttonText}>✅ Cập nhật Unit</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleAddUnit}>
            <Text style={styles.buttonText}>➕ Thêm Unit</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.header, { fontSize: 22, marginTop: 30 }]}>📋 Danh sách Unit</Text>

      {units.map((unit, index) => {
  const unitLevel = levels.find(l => l.level_id === unit.level_id);
  return (
    <View key={unit.unit_id || index} style={styles.levelCard}>
      <Text style={styles.levelText}>
        {index + 1}. {unit.title} {unitLevel ? `- Level: ${unitLevel.name}` : ''}
      </Text>

      {unit.image_url && (
        <Image
          source={{ uri: `http://192.168.1.8:3000/images/${unit.image_url}` }}
          style={styles.levelImage}
        />
      )}

      <View style={styles.levelActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#f0ad4e' }]}
          onPress={() => startEditingUnit(unit)}
        >
          <Text style={styles.actionButtonText}>✏️ Sửa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#d9534f' }]}
          onPress={() =>
            Alert.alert('Xác nhận', `Bạn có chắc muốn xoá unit ${unit.title}?`, [
              { text: 'Huỷ', style: 'cancel' },
              { text: 'Xoá', onPress: () => handleDeleteUnit(unit.unit_id) },
            ])
          }
        >
          <Text style={styles.actionButtonText}>🗑️ Xoá</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
})}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    marginTop: 5,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  updateButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  levelList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  levelItem: {
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 10,
  },
  levelItemSelected: {
    backgroundColor: '#007bff',
  },
  levelItemText: {
    color: '#007bff',
    fontWeight: '600',
  },
  levelItemTextSelected: {
    color: '#fff',
  },
  levelCard: {
    backgroundColor: '#fff',
    marginVertical: 10,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  levelText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 10,
  },
  levelImage: {
    width: '100%',
    height: 160,
    resizeMode: 'contain',
    borderRadius: 10,
    marginBottom: 10,
  },
  levelActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
}); 

export default UnitScreen;
