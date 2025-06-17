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
    Platform,
    ActivityIndicator
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { BASE_URL } from '../../utils/constants';
import { useNavigation } from '@react-navigation/native';

// Removed the old BackIcon = require('../../assets/icons/back-icon.png');
// We will now use the path directly in the Image component, consistent with UnitsScreen

const API_URL = `${BASE_URL}/levels`;

const LevelSceen = () => {
    const navigation = useNavigation();

    const [levelName, setLevelName] = useState('');
    const [imageName, setImageName] = useState('');
    const [selectedImageUri, setSelectedImageUri] = useState(null);
    const [levels, setLevels] = useState([]);
    const [editingLevel, setEditingLevel] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchLevels = async () => {
        setLoading(true);
        try {
            const res = await fetch(API_URL);
            const data = await res.json();
            if (res.ok) {
                setLevels(data);
            } else {
                throw new Error('Không thể lấy danh sách cấp độ');
            }
        } catch (err) {
            console.error('Lỗi lấy level:', err);
            Alert.alert('Lỗi', 'Không thể lấy danh sách cấp độ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLevels();
    }, []);

    const handleImagePick = async () => {
        const options = {
            title: 'Chọn ảnh cấp độ',
            storageOptions: {
                skipBackup: true,
                path: 'images',
            },
            mediaType: 'photo',
            quality: 0.8,
            maxWidth: 800,
            maxHeight: 800,
        };

        launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.error('ImagePicker Error: ', response.error);
                Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
            } else {
                setSelectedImageUri(response.assets[0].uri);
            }
        });
    };

    const uploadImageToServer = async (uri, oldImagePath = null) => {
        const formData = new FormData();
        formData.append('image', {
            uri: uri,
            type: 'image/png',
            name: `level_${Date.now()}.png`,
        });

        if (oldImagePath) {
            formData.append('oldImagePath', oldImagePath);
        }

        try {
            const response = await fetch(`${BASE_URL}/api/upload-level-image`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const responseText = await response.text();
            console.log('Raw response from level image upload:', responseText);

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (jsonError) {
                console.error('JSON Parse Error for level image upload:', jsonError.message);
                throw new Error(`Phản hồi từ server không hợp lệ khi tải ảnh: ${responseText}`);
            }

            if (response.ok && result.imageUrl) {
                return result.imageUrl;
            } else {
                throw new Error(result.error || 'Không thể tải ảnh cấp độ lên.');
            }
        } catch (error) {
            console.error('Error uploading level image:', error);
            throw error;
        }
    };

    const handleAddLevel = async () => {
        if (!levelName.trim()) {
            return Alert.alert('Lỗi', 'Vui lòng nhập tên cấp độ.');
        }
        if (!selectedImageUri) {
            return Alert.alert('Lỗi', 'Vui lòng chọn ảnh cho cấp độ.');
        }

        setLoading(true);
        try {
            const uploadedImageUrl = await uploadImageToServer(selectedImageUri);

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: levelName, image: uploadedImageUrl }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Thành công', `Đã thêm cấp độ: ${data.name}`);
                setLevelName('');
                setImageName('');
                setSelectedImageUri(null);
                fetchLevels();
            } else {
                Alert.alert('Lỗi', data.error || 'Không thêm được cấp độ.');
            }
        } catch (err) {
            console.error('Lỗi khi thêm cấp độ:', err);
            Alert.alert('Lỗi', err.message || 'Không thể kết nối đến server.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLevel = async (levelId, imageUrl) => {
        if (!levelId) {
            return Alert.alert('Lỗi', 'ID cấp độ không hợp lệ');
        }

        setLoading(true);
        try {
            const response = await fetch(API_URL, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: levelId, imageUrl: imageUrl }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Thành công', `Đã xóa cấp độ: ${data.deletedLevel.name}`);
                fetchLevels();
            } else {
                Alert.alert('Lỗi', data.error || 'Không xóa được cấp độ.');
            }
        } catch (err) {
            console.error('Lỗi khi xóa cấp độ:', err);
            Alert.alert('Lỗi', 'Không thể kết nối đến server.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateLevel = async () => {
        if (!levelName.trim()) {
            return Alert.alert('Lỗi', 'Vui lòng nhập tên cấp độ.');
        }
        if (!editingLevel) {
            return Alert.alert('Lỗi', 'Không có cấp độ nào đang được chỉnh sửa.');
        }

        setLoading(true);
        let finalImageUrl = imageName;

        try {
            if (selectedImageUri) {
                finalImageUrl = await uploadImageToServer(selectedImageUri, imageName);
            }

            const response = await fetch(API_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    level_id: editingLevel,
                    name: levelName,
                    image: finalImageUrl,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Thành công', `Đã cập nhật cấp độ: ${data.name}`);
                setEditingLevel(null);
                setLevelName('');
                setImageName('');
                setSelectedImageUri(null);
                fetchLevels();
            } else {
                Alert.alert('Lỗi', data.error || 'Không cập nhật được cấp độ.');
            }
        } catch (err) {
            console.error('Lỗi khi cập nhật cấp độ:', err);
            Alert.alert('Lỗi', err.message || 'Không thể kết nối đến server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* NEW: Header adapted from UnitsScreen */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        {/* Ensure this path is correct relative to your LevelScreen.js */}
                        <Image source={require('../../images/login_signup/back.png')} style={styles.backIcon} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Quản lý Cấp Độ (Level)</Text>
                    {/* Placeholder for consistent spacing with UnitsScreen header */}
                    <View style={{ width: 30 }} />
                </View>
            </View>

            {/* Content starts below the fixed header */}
            <View style={styles.contentWrapper}>
                <View style={styles.card}>
                    <Text style={styles.label}>Tên cấp độ</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="VD: Đồng, Bạc, Vàng..."
                        value={levelName}
                        onChangeText={setLevelName}
                    />

                    <Text style={styles.label}>Ảnh cấp độ</Text>
                    <TouchableOpacity style={styles.imagePickerButton} onPress={handleImagePick}>
                        <Text style={styles.imagePickerButtonText}>Chọn ảnh từ thư viện</Text>
                    </TouchableOpacity>

                    {(selectedImageUri || imageName) ? (
                        <Image
                            source={{ uri: selectedImageUri || `${BASE_URL}${imageName}` }}
                            style={styles.previewImage}
                        />
                    ) : (
                        <Text style={styles.noImageText}>Chưa có ảnh được chọn.</Text>
                    )}

                    {loading ? (
                        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
                    ) : (
                        editingLevel ? (
                            <TouchableOpacity style={[styles.button, styles.updateButton]} onPress={handleUpdateLevel}>
                                <Text style={styles.buttonText}>Cập nhật cấp độ</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.button} onPress={handleAddLevel}>
                                <Text style={styles.buttonText}>Thêm cấp độ</Text>
                            </TouchableOpacity>
                        )
                    )}
                       {editingLevel && (
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={() => {
                                setEditingLevel(null);
                                setLevelName('');
                                setImageName('');
                                setSelectedImageUri(null);
                            }}
                        >
                            <Text style={styles.buttonText}>Hủy chỉnh sửa</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={[styles.sectionHeader, { fontSize: 22, marginTop: 30 }]}>Danh sách cấp độ</Text>

                {loading ? (
                    <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
                ) : (
                    levels.map((level, index) => (
                        <View key={level.level_id} style={styles.levelCard}>
                            <Text style={styles.levelText}>
                                {index + 1}. {level.name}
                            </Text>

                            {level.image_url && (
                                <Image
                                    source={{ uri: `${BASE_URL}${level.image_url}` }}
                                    style={styles.levelImage}
                                />
                            )}

                            <View style={styles.levelActions}>
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: '#f0ad4e' }]}
                                    onPress={() => {
                                        setEditingLevel(level.level_id);
                                        setLevelName(level.name);
                                        setImageName(level.image_url);
                                        setSelectedImageUri(null);
                                    }}
                                >
                                    <Text style={styles.actionButtonText}>Sửa</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: '#d9534f' }]}
                                    onPress={() =>
                                        Alert.alert(
                                            'Xác nhận',
                                            `Bạn có chắc muốn xóa cấp độ ${level.name}?`,
                                            [
                                                { text: 'Hủy', style: 'cancel' },
                                                { text: 'Xóa', onPress: () => handleDeleteLevel(level.level_id, level.image_url) },
                                            ]
                                        )
                                    }
                                >
                                    <Text style={styles.actionButtonText}>Xóa</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1, // Use flexGrow for ScrollView contentContainerStyle
        backgroundColor: '#E0E5FF',
        paddingBottom: 50,
    },
    // NEW: Header styles from UnitsScreen
    header: {
        backgroundColor: '#FFFFFF',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        paddingTop: 40, // Consistent with UnitsScreen
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1,
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
        tintColor: '#333', // Consistent with UnitsScreen
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    // NEW: Wrapper for content below the fixed header
    contentWrapper: {
        padding: 20,
        marginTop: 90, // Adjusted margin-top to clear the fixed header (40 padding + ~50 header height)
    },
    sectionHeader: { // Renamed from header to avoid conflict and better describe
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
        marginBottom: 10,
    },
    imagePickerButton: {
        backgroundColor: '#6c757d',
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
    previewImage: {
        width: '100%',
        height: 150,
        resizeMode: 'contain',
        borderRadius: 10,
        marginTop: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    noImageText: {
        textAlign: 'center',
        color: '#888',
        marginTop: 10,
        marginBottom: 20,
    },
    button: {
        marginTop: 10,
        backgroundColor: '#007bff',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    updateButton: {
        backgroundColor: '#28a745',
    },
    cancelButton: {
        backgroundColor: '#dc3545',
        marginTop: 10,
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