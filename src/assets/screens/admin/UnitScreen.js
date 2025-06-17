
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    Image,
    ActivityIndicator,
    Platform,
    RefreshControl
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { BASE_URL } from '../../utils/constants';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
// Kiểm tra các import trong mã
import { Picker } from '@react-native-picker/picker';


const BackIcon = require('../../images/login_signup/back.png');

const UNIT_API_URL = `${BASE_URL}/units`;
const LEVEL_API_URL = `${BASE_URL}/levels`;
const UNIT_IMAGE_UPLOAD_URL = `${BASE_URL}/api/upload-unit-image`;

const UnitScreen = () => {
    const navigation = useNavigation();

    const [unitTitle, setUnitTitle] = useState('');
    const [imageName, setImageName] = useState(null);
    const [selectedImageUri, setSelectedImageUri] = useState(null);
    const [units, setUnits] = useState([]);
    const [levels, setLevels] = useState([]);
    const [selectedLevelId, setSelectedLevelId] = useState(null);
    const [editingUnitId, setEditingUnitId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isImagePicking, setIsImagePicking] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const fetchUnits = useCallback(async (levelId = selectedLevelId) => {
        if (!levelId) {
            setUnits([]);
            return;
        }
        setLoading(true);
        setRefreshing(true);
        try {
            const res = await fetch(`${UNIT_API_URL}/by-level/${levelId}`);
            const data = await res.json();
            if (res.ok) {
                setUnits(data);
            } else {
                const errorMessage = data.error || 'Không thể lấy danh sách unit.';
                Alert.alert('Lỗi', errorMessage);
                throw new Error(errorMessage);
            }
        } catch (err) {
            console.error('Lỗi khi lấy units:', err);
            Alert.alert('Lỗi', 'Không thể kết nối đến server hoặc dữ liệu unit không hợp lệ.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedLevelId]);

    const fetchLevels = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(LEVEL_API_URL);
            const data = await res.json();
            if (res.ok) {
                setLevels(data);
                if (data.length > 0 && selectedLevelId === null) {
                    setSelectedLevelId(data[0].level_id);
                }
            } else {
                const errorMessage = data.error || 'Không thể lấy danh sách cấp độ.';
                Alert.alert('Lỗi', errorMessage);
                throw new Error(errorMessage);
            }
        } catch (err) {
            console.error('Lỗi khi lấy levels:', err);
            Alert.alert('Lỗi', 'Không thể kết nối đến server hoặc dữ liệu cấp độ không hợp lệ.');
        } finally {
            // setLoading(false);
        }
    }, [selectedLevelId]);

    useEffect(() => {
        fetchLevels();
    }, [fetchLevels]);

    useEffect(() => {
        if (selectedLevelId) {
            fetchUnits(selectedLevelId);
        } else {
            setUnits([]);
        }
    }, [selectedLevelId, fetchUnits]);

    const handleImagePick = async () => {
        if (isImagePicking) return;
        setIsImagePicking(true);

        const options = {
            mediaType: 'photo',
            quality: 0.8,
            maxWidth: 800,
            maxHeight: 800,
        };

        launchImageLibrary(options, (response) => {
            setIsImagePicking(false);

            if (response.didCancel) {
                console.log('Người dùng đã hủy chọn ảnh.');
            } else if (response.error) {
                console.error('Lỗi ImagePicker: ', response.error);
                Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
            } else if (response.assets && response.assets.length > 0) {
                const asset = response.assets[0];
                const uri = Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri;
                setSelectedImageUri(uri);
            } else {
                Alert.alert('Lỗi', 'Không có ảnh nào được chọn hoặc phản hồi không hợp lệ.');
            }
        });
    };

    const uploadImageToServer = async (uri, oldImagePath = null) => {
        if (!uri) {
            throw new Error('URI ảnh không được để trống.');
        }

        const formData = new FormData();
        const fileExtension = uri.split('.').pop();
        const mimeType = `image/${fileExtension.toLowerCase()}`;

        formData.append('image', {
            uri: uri,
            type: mimeType,
            name: `unit_${Date.now()}.${fileExtension.toLowerCase()}`,
        });

        if (oldImagePath) {
            formData.append('oldImagePath', oldImagePath);
        }

        try {
            const response = await fetch(UNIT_IMAGE_UPLOAD_URL, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const responseText = await response.text();
            console.log('Phản hồi thô từ tải lên ảnh unit:', responseText);

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (jsonError) {
                console.error('Lỗi phân tích JSON cho tải lên ảnh unit:', jsonError.message);
                throw new Error(`Phản hồi không hợp lệ từ server khi tải ảnh: ${responseText}`);
            }

            if (response.ok && result.imageUrl) {
                return result.imageUrl;
            } else {
                throw new Error(result.error || 'Không thể tải ảnh unit lên.');
            }
        } catch (error) {
            console.error('Lỗi tải ảnh unit:', error);
            Alert.alert('Lỗi', `Tải ảnh lên thất bại: ${error.message || 'Lỗi không xác định.'}`);
            throw error;
        }
    };

    const handleAddUnit = async () => {
        if (!unitTitle.trim()) {
            return Alert.alert('Lỗi', 'Vui lòng nhập tên unit.');
        }
        if (selectedLevelId === null) {
            return Alert.alert('Lỗi', 'Vui lòng chọn một cấp độ.');
        }
        if (!selectedImageUri) {
            return Alert.alert('Lỗi', 'Vui lòng chọn ảnh cho unit.');
        }

        setLoading(true);
        try {
            const uploadedImageUrl = await uploadImageToServer(selectedImageUri);

            const response = await fetch(UNIT_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: unitTitle,
                    level_id: selectedLevelId,
                    image_url: uploadedImageUrl,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Thành công', `Đã thêm unit: ${data.title}`);
                resetForm();
                fetchUnits(selectedLevelId);
            } else {
                Alert.alert('Lỗi', data.error || 'Không thêm được unit.');
            }
        } catch (err) {
            console.error('Lỗi khi thêm unit:', err);
            Alert.alert('Lỗi', err.message || 'Không thể thêm unit. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const startEditingUnit = (unit) => {
        setEditingUnitId(unit.unit_id);
        setUnitTitle(unit.title);
        setImageName(unit.image_url);
        // Quan trọng: Đặt selectedLevelId của unit đang sửa vào state
        setSelectedLevelId(unit.level_id);
        setSelectedImageUri(null); // Clear selectedImageUri để hiển thị ảnh cũ
    };

    const handleUpdateUnit = async () => {
        if (!editingUnitId) {
            return Alert.alert('Lỗi', 'Không có unit nào đang được chỉnh sửa.');
        }
        if (!unitTitle.trim()) {
            return Alert.alert('Lỗi', 'Vui lòng nhập tên unit.');
        }
        // Kiểm tra selectedLevelId, vì nó có thể đã thay đổi qua picker
        if (selectedLevelId === null) {
            return Alert.alert('Lỗi', 'Vui lòng chọn một cấp độ.');
        }
        if (!imageName && !selectedImageUri) {
            return Alert.alert('Lỗi', 'Vui lòng chọn ảnh cho unit.');
        }

        setLoading(true);
        let finalImageUrl = imageName; // Mặc định là ảnh cũ

        try {
            if (selectedImageUri) { // Nếu có ảnh mới được chọn
                finalImageUrl = await uploadImageToServer(selectedImageUri, imageName);
            }

            const response = await fetch(`${UNIT_API_URL}/${editingUnitId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: unitTitle,
                    level_id: selectedLevelId, // Sử dụng selectedLevelId hiện tại từ state
                    image_url: finalImageUrl,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Thành công', `Đã cập nhật unit: ${data.title}`);
                resetForm();
                fetchUnits(selectedLevelId); // Refresh units for current level (which might be new)
            } else {
                Alert.alert('Lỗi', data.error || 'Không cập nhật được unit.');
            }
        } catch (err) {
            console.error('Lỗi khi cập nhật unit:', err);
            Alert.alert('Lỗi', err.message || 'Không thể cập nhật unit. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUnit = async (unitId, imageUrl) => {
        Alert.alert(
            'Xác nhận xóa',
            `Bạn có chắc chắn muốn xóa unit này? Hành động này không thể hoàn tác.`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const response = await fetch(`${UNIT_API_URL}/${unitId}`, {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ imageUrl: imageUrl }),
                            });

                            const data = await response.json();

                            if (response.ok) {
                                Alert.alert('Thành công', `Đã xóa unit: ${data.deletedUnit.title || 'Không rõ tên'}`);
                                fetchUnits(selectedLevelId);
                            } else {
                                Alert.alert('Lỗi', data.error || 'Không xóa được unit.');
                            }
                        } catch (err) {
                            console.error('Lỗi khi xóa unit:', err);
                            Alert.alert('Lỗi', err.message || 'Không thể kết nối đến server khi xóa.');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const resetForm = () => {
        setEditingUnitId(null);
        setUnitTitle('');
        setImageName(null);
        setSelectedImageUri(null);
        // Không reset selectedLevelId ở đây, vì nó dùng để lọc danh sách Units
        // và cũng sẽ được tự động set lại khi chọn level button ở trên hoặc khi fetchLevels
    };

    const filteredUnits = units.filter(unit =>
        unit.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const onRefresh = useCallback(() => {
        if (selectedLevelId) {
            fetchUnits(selectedLevelId);
        } else {
            fetchLevels();
        }
    }, [selectedLevelId, fetchUnits, fetchLevels]);

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Image source={BackIcon} style={styles.backIcon} />
            </TouchableOpacity>

            <Text style={styles.header}>📚 Quản lý (Unit)</Text>

            {/* Phần Chọn cấp độ để Lọc */}
            <View style={styles.card}>
                <Text style={styles.label}>Chọn cấp độ để xem:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.levelSelectorContainer}>
                    {levels.length === 0 ? (
                        <Text style={styles.noLevelsAvailable}>Không có cấp độ nào. Vui lòng thêm cấp độ trước.</Text>
                    ) : (
                        levels.map((lvl) => (
                            <TouchableOpacity
                                key={lvl.level_id}
                                style={[
                                    styles.levelButton,
                                    selectedLevelId === lvl.level_id && styles.levelButtonSelected,
                                ]}
                                onPress={() => {
                                    // Khi chọn level ở đây, chỉ lọc danh sách units và reset form
                                    setSelectedLevelId(lvl.level_id);
                                    resetForm();
                                }}
                            >
                                <Text style={[
                                    styles.levelButtonText,
                                    selectedLevelId === lvl.level_id && styles.levelButtonTextSelected,
                                ]}>{lvl.name}</Text>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            </View>

            {/* Phần Thêm/Chỉnh sửa Unit (chỉ hiển thị khi có level được chọn) */}
            {selectedLevelId !== null && (
                <View style={styles.card}>
                    <Text style={styles.label}>Tên Units</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="VD: Unit 1, Unit 2..."
                        value={unitTitle}
                        onChangeText={setUnitTitle}
                    />

                    {/* Level Picker for Add/Edit Form */}
                    <Text style={styles.label}>Cấp độ cho Units</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={selectedLevelId}
                            onValueChange={(itemValue) => setSelectedLevelId(itemValue)}
                            style={styles.picker}
                            itemStyle={styles.pickerItem}
                        >
                            {levels.length === 0 ? (
                                <Picker.Item label="Không có cấp độ" value={null} />
                            ) : (
                                levels.map((lvl) => (
                                    <Picker.Item key={lvl.level_id} label={lvl.name} value={lvl.level_id} />
                                ))
                            )}
                        </Picker>
                    </View>

                    <Text style={styles.label}>Ảnh Units</Text>
                    <TouchableOpacity style={styles.imagePickerButton} onPress={handleImagePick} disabled={isImagePicking}>
                        <Text style={styles.imagePickerButtonText}>
                            {isImagePicking ? 'Đang chọn ảnh...' : 'Chọn ảnh từ thư viện'}
                        </Text>
                    </TouchableOpacity>

                    {(selectedImageUri || imageName) ? (
                        <Image
                            source={{ uri: selectedImageUri ? selectedImageUri : `${BASE_URL}${imageName}` }}
                            style={styles.previewImage}
                        />
                    ) : (
                        <Text style={styles.noImageText}>Chưa có ảnh nào được chọn.</Text>
                    )}

                    {loading ? (
                        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
                    ) : (
                        <>
                            {editingUnitId ? (
                                <TouchableOpacity style={[styles.button, styles.updateButton]} onPress={handleUpdateUnit}>
                                    <Text style={styles.buttonText}>✅ Cập nhật Units</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={styles.button} onPress={handleAddUnit}>
                                    <Text style={styles.buttonText}>➕ Thêm </Text>
                                </TouchableOpacity>
                            )}
                            {(editingUnitId || unitTitle || selectedImageUri || selectedLevelId !== null) && (
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton]}
                                    onPress={resetForm}
                                >
                                    <Text style={styles.buttonText}>Hủy</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            )}

            {/* Thanh tìm kiếm và Danh sách Unit */}
            {selectedLevelId !== null ? (
                <>
                    <Text style={[styles.header, { fontSize: 22, marginTop: 30 }]}>📋 Danh sách Units</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm đơn vị..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />

                    {loading && !refreshing ? (
                        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
                    ) : (
                        filteredUnits.length === 0 ? (
                            <Text style={styles.noUnitsText}>
                                {searchTerm ? `Không tìm thấy đơn vị "${searchTerm}" trong cấp độ này.` : 'Chưa có đơn vị nào trong cấp độ này.'}
                            </Text>
                        ) : (
                            filteredUnits.map((unit, index) => (
                                <View key={unit.unit_id} style={styles.unitCard}>
                                    <Text style={styles.unitText}>
                                        {index + 1}. {unit.title}
                                    </Text>

                                    {unit.image_url ? (
                                        <Image
                                            source={{ uri: `${BASE_URL}${unit.image_url}` }}
                                            style={styles.unitImage}
                                        />
                                    ) : (
                                        <Text style={styles.noImagePlaceholder}>Không có ảnh</Text>
                                    )}

                                    <View style={styles.unitActions}>
                                        <TouchableOpacity
                                            style={[styles.actionButton, { backgroundColor: '#f0ad4e' }]}
                                            onPress={() => startEditingUnit(unit)}
                                        >
                                            <Text style={styles.actionButtonText}>✏️ Sửa</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.actionButton, { backgroundColor: '#d9534f' }]}
                                            onPress={() => handleDeleteUnit(unit.unit_id, unit.image_url)}
                                        >
                                            <Text style={styles.actionButtonText}>🗑️ Xóa</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )
                    )}
                </>
            ) : (
                <Text style={styles.selectLevelPrompt}>Vui lòng chọn một cấp độ để xem.</Text>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f8f9fa',
        paddingBottom: 50,
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20,
        left: 20,
        zIndex: 10,
        padding: 5,
    },
    backIcon: {
        width: 24,
        height: 24,
        tintColor: '#343a40',
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: 20,
        textAlign: 'center',
        marginTop: Platform.OS === 'ios' ? 80 : 50,
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
        marginBottom: 20,
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
        resizeMode: 'cover',
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
    // Updated Styles for Level Selection
    levelSelectorContainer: {
        marginBottom: 15,
        // Dùng padding để tạo khoảng cách giữa các nút và mép
        paddingVertical: 5,
    },
    levelButton: {
        paddingVertical: 6, // Giảm padding dọc
        paddingHorizontal: 12, // Giảm padding ngang
        borderRadius: 18, // Bo tròn mạnh hơn (nửa chiều cao nút)
        backgroundColor: '#f0f4f7', // Màu nền nhẹ nhàng hơn
        marginRight: 8, // Khoảng cách giữa các nút
        borderWidth: 1,
        borderColor: '#e0e6ec', // Viền tinh tế
        justifyContent: 'center',
        // Optional: Add a subtle shadow for a modern, lifted effect
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    levelButtonSelected: {
        backgroundColor: '#4a90e2', // Màu xanh đậm hơn khi chọn
        borderColor: '#3a7bd5', // Viền phù hợp với màu nền
        shadowOpacity: 0.1, // Shadow rõ hơn khi chọn
        elevation: 2,
    },
    levelButtonText: {
        color: '#5a6a7c', // Màu chữ tinh tế hơn
        fontWeight: '600', // Chữ đậm vừa phải
        fontSize: 14, // Kích thước chữ nhỏ hơn
    },
    levelButtonTextSelected: {
        color: '#ffffff', // Chữ trắng khi chọn
    },
    noLevelsAvailable: {
        color: '#dc3545',
        textAlign: 'center',
        marginVertical: 10,
        fontStyle: 'italic',
    },
    // Unit List Styles
    unitCard: {
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
    unitText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 10,
    },
    unitImage: {
        width: '100%',
        height: 160,
        resizeMode: 'cover',
        borderRadius: 10,
        marginBottom: 10,
    },
    noImagePlaceholder: {
        textAlign: 'center',
        color: '#ccc',
        fontStyle: 'italic',
        marginBottom: 10,
    },
    unitActions: {
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
    noUnitsText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#666',
    },
    selectLevelPrompt: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 18,
        color: '#555',
        fontStyle: 'italic',
        paddingHorizontal: 20,
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#a0a0a0',
        borderRadius: 10,
        padding: 10,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: '#fff',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 10,
        marginBottom: 10,
        overflow: 'hidden',
        backgroundColor: '#fff',
    },
    picker: {
        height: 50,
        width: '100%',
    },
    pickerItem: {
        fontSize: 16,
        color: '#495057',
    },
});

export default UnitScreen;