import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    Image
} from 'react-native';

const API_URL = 'http://192.168.1.8:3000/levels';

const LevelSceen = () => {
    const [levelName, setLevelName] = useState('');
    const [imageName, setImageName] = useState('');
    const [levels, setLevels] = useState([]);
    const [editingLevel, setEditingLevel] = useState(null);

    const fetchLevels = async () => {
        try {
            const res = await fetch(API_URL);
            const data = await res.json();
            if (res.ok) setLevels(data);
            else throw new Error('Không thể lấy danh sách cấp độ');
        } catch (err) {
            console.error('Lỗi lấy level:', err);
            Alert.alert('Lỗi', 'Không thể lấy danh sách cấp độ');
        }
    };

    useEffect(() => {
        fetchLevels();
    }, []);

    const handleAddLevel = async () => {
        if (!levelName.trim()) {
            return Alert.alert('Lỗi', 'Vui lòng nhập tên cấp độ');
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: levelName, image: imageName }), // Backend mong đợi 'image' ở đây, điều này vẫn ổn
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Thành công', `Đã thêm cấp độ: ${data.name}`);
                setLevelName('');
                setImageName('');
                fetchLevels();
            } else {
                Alert.alert('Lỗi', data.error || 'Không thêm được cấp độ');
            }
        } catch (err) {
            console.error('Lỗi gọi API:', err);
            Alert.alert('Lỗi', 'Không thể kết nối đến server');
        }
    };

    const handleDeleteLevel = async (levelId) => {
        if (!levelId) {
            return Alert.alert('Lỗi', 'ID cấp độ không hợp lệ');
        }

        try {
            const response = await fetch(API_URL, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: levelId }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Thành công', `Đã xóa cấp độ: ${data.deletedLevel.name}`);
                fetchLevels();
            } else {
                Alert.alert('Lỗi', data.error || 'Không xóa được cấp độ');
            }
        } catch (err) {
            console.error('Lỗi gọi API:', err);
            Alert.alert('Lỗi', 'Không thể kết nối đến server');
        }
    };

    const handleUpdateLevel = async () => {
        if (!levelName.trim()) {
            return Alert.alert('Lỗi', 'Vui lòng nhập tên cấp độ');
        }

        try {
            const response = await fetch(API_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    level_id: editingLevel,
                    name: levelName,
                    image: imageName, // Backend mong đợi 'image' ở đây, điều này vẫn ổn
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Thành công', `Đã cập nhật cấp độ: ${data.name}`);
                setEditingLevel(null);
                setLevelName('');
                setImageName('');
                fetchLevels();
            } else {
                Alert.alert('Lỗi', data.error || 'Không cập nhật được cấp độ');
            }
        } catch (err) {
            console.error('Lỗi gọi API:', err);
            Alert.alert('Lỗi', 'Không thể kết nối đến server');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>🎯 Thêm Cấp Độ (Level)</Text>

            <View style={styles.card}>
                <Text style={styles.label}>Tên cấp độ</Text>
                <TextInput
                    style={styles.input}
                    placeholder="VD: Đồng, Bạc, Vàng..."
                    value={levelName}
                    onChangeText={setLevelName}
                />

                <Text style={styles.label}>Tên file ảnh (.png)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="VD: bronze.png"
                    value={imageName}
                    onChangeText={setImageName}
                />

                {editingLevel ? (
                    <TouchableOpacity style={[styles.button, styles.updateButton]} onPress={handleUpdateLevel}>
                        <Text style={styles.buttonText}>✅ Cập nhật cấp độ</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.button} onPress={handleAddLevel}>
                        <Text style={styles.buttonText}>➕ Thêm cấp độ</Text>
                    </TouchableOpacity>
                )}
            </View>

            <Text style={[styles.header, { fontSize: 22, marginTop: 30 }]}>📋 Danh sách cấp độ</Text>

            {levels.map((level, index) => (
                <View key={level.level_id || index} style={styles.levelCard}>
                    <Text style={styles.levelText}>
                        {index + 1}. {level.name}
                    </Text>

                    {/* ĐÃ SỬA: Sử dụng level.image_url thay vì level.image */}
                    {level.image_url && (
                        <Image
                            source={{ uri: `http://192.168.1.8:3000/images/${level.image_url}` }}
                            style={styles.levelImage}
                        />
                    )}

                    <View style={styles.levelActions}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#f0ad4e' }]}
                            onPress={() => {
                                setEditingLevel(level.level_id);
                                setLevelName(level.name);
                                setImageName(level.image_url); // ĐÃ SỬA: Sử dụng level.image_url ở đây
                            }}
                        >
                            <Text style={styles.actionButtonText}>✏️ Sửa</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#d9534f' }]}
                            onPress={() =>
                                Alert.alert(
                                    'Xác nhận',
                                    `Bạn có chắc muốn xóa cấp độ ${level.name}?`,
                                    [
                                        { text: 'Hủy', style: 'cancel' },
                                        { text: 'Xóa', onPress: () => handleDeleteLevel(level.level_id) },
                                    ]
                                )
                            }
                        >
                            <Text style={styles.actionButtonText}>🗑️ Xóa</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
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

export default LevelSceen;