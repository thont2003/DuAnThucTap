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
    RefreshControl,
    SafeAreaView
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { BASE_URL } from '../../utils/constants';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

const BackIcon = require('../../images/login_signup/back.png'); // Đảm bảo đường dẫn này đúng

const TEST_API_URL = `${BASE_URL}/tests`;
const LEVEL_API_URL = `${BASE_URL}/levels`;
const UNIT_API_URL = `${BASE_URL}/units`; // Cần để lấy danh sách units theo level
const TEST_IMAGE_UPLOAD_URL = `${BASE_URL}/api/upload-test-image`;

const TestADScreen = () => {
    const navigation = useNavigation();

    const [testTitle, setTestTitle] = useState('');
    const [testDescription, setTestDescription] = useState('');
    const [imageName, setImageName] = useState(null); // Đường dẫn ảnh từ server (để chỉnh sửa)
    const [selectedImageUri, setSelectedImageUri] = useState(null); // URI ảnh tạm thời từ gallery
    const [tests, setTests] = useState([]);
    const [levels, setLevels] = useState([]);
    const [units, setUnits] = useState([]); // Danh sách units cho picker
    const [selectedLevelId, setSelectedLevelId] = useState(null);
    const [selectedUnitId, setSelectedUnitId] = useState(null); // ID của unit được chọn
    const [editingTestId, setEditingTestId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isImagePicking, setIsImagePicking] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // --- Fetching Data ---

    const fetchLevels = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(LEVEL_API_URL);
            const data = await res.json();
            if (res.ok) {
                setLevels(data);
                // Nếu chưa có cấp độ nào được chọn, chọn cấp độ đầu tiên
                if (data.length > 0 && selectedLevelId === null) {
                    setSelectedLevelId(data[0].level_id);
                }
            } else {
                const errorMessage = data.error || 'Không thể lấy danh sách cấp độ.';
                Alert.alert('Lỗi', errorMessage);
            }
        } catch (err) {
            console.error('Lỗi khi lấy levels:', err);
            Alert.alert('Lỗi', 'Không thể kết nối đến server hoặc dữ liệu cấp độ không hợp lệ.');
        } finally {
            setLoading(false);
        }
    }, [selectedLevelId]);

    const fetchUnitsByLevel = useCallback(async (levelId) => {
        if (!levelId) {
            setUnits([]);
            setSelectedUnitId(null); // Reset unit khi không có level
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${UNIT_API_URL}/by-level/${levelId}`);
            const data = await res.json();
            if (res.ok) {
                setUnits(data);
                // Tự động chọn unit đầu tiên nếu có, hoặc reset nếu không có
                if (data.length > 0) {
                    // Chỉ đặt lại selectedUnitId nếu nó không nằm trong danh sách hiện tại
                    if (!data.some(unit => unit.unit_id === selectedUnitId)) {
                        setSelectedUnitId(data[0].unit_id);
                    }
                } else {
                    setSelectedUnitId(null);
                }
            } else {
                const errorMessage = data.error || 'Không thể lấy danh sách unit.';
                Alert.alert('Lỗi', errorMessage);
            }
        } catch (err) {
            console.error(`Lỗi khi lấy units cho level_id ${levelId}:`, err);
            Alert.alert('Lỗi', 'Không thể kết nối đến server hoặc dữ liệu unit không hợp lệ.');
        } finally {
            setLoading(false);
        }
    }, [selectedUnitId]);

    const fetchTests = useCallback(async (levelId, unitId) => {
        if (!levelId || !unitId) {
            setTests([]);
            return;
        }
        setLoading(true);
        setRefreshing(true);
        try {
            const res = await fetch(`${TEST_API_URL}?level_id=${levelId}&unit_id=${unitId}`);
            const data = await res.json();
            if (res.ok) {
                setTests(data);
            } else {
                const errorMessage = data.error || 'Không thể lấy danh sách bài test.';
                Alert.alert('Lỗi', errorMessage);
            }
        } catch (err) {
            console.error('Lỗi khi lấy tests:', err);
            Alert.alert('Lỗi', 'Không thể kết nối đến server hoặc dữ liệu bài test không hợp lệ.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Initial fetch for levels
    useEffect(() => {
        fetchLevels();
    }, [fetchLevels]);

    // Fetch units when selectedLevelId changes
    useEffect(() => {
        if (selectedLevelId) {
            fetchUnitsByLevel(selectedLevelId);
        } else {
            setUnits([]);
            setSelectedUnitId(null);
        }
    }, [selectedLevelId, fetchUnitsByLevel]);

    // Fetch tests when selectedLevelId or selectedUnitId changes
    useEffect(() => {
        if (selectedLevelId && selectedUnitId) {
            fetchTests(selectedLevelId, selectedUnitId);
        } else {
            setTests([]);
        }
    }, [selectedLevelId, selectedUnitId, fetchTests]);

    // --- Image Handling ---

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

        formData.append('testImage', { // Tên trường phải khớp với Multer config trên server (`uploadTestImage.single('testImage')`)
            uri: uri,
            type: mimeType,
            name: `test_${Date.now()}.${fileExtension.toLowerCase()}`,
        });

        if (oldImagePath) {
            formData.append('oldImagePath', oldImagePath);
        }

        try {
            const response = await fetch(TEST_IMAGE_UPLOAD_URL, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const responseText = await response.text();
            console.log('Phản hồi thô từ tải lên ảnh test:', responseText);

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (jsonError) {
                console.error('Lỗi phân tích JSON cho tải lên ảnh test:', jsonError.message);
                throw new Error(`Phản hồi không hợp lệ từ server khi tải ảnh: ${responseText}`);
            }

            if (response.ok && result.imageUrl) {
                return result.imageUrl;
            } else {
                throw new Error(result.error || 'Không thể tải ảnh bài test lên.');
            }
        } catch (error) {
            console.error('Lỗi tải ảnh bài test:', error);
            Alert.alert('Lỗi', `Tải ảnh lên thất bại: ${error.message || 'Lỗi không xác định.'}`);
            throw error;
        }
    };

    // --- CRUD Operations ---

    const handleAddTest = async () => {
        if (!testTitle.trim()) {
            return Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề bài test.');
        }
        if (selectedLevelId === null) {
            return Alert.alert('Lỗi', 'Vui lòng chọn một cấp độ.');
        }
        if (selectedUnitId === null) {
            return Alert.alert('Lỗi', 'Vui lòng chọn một đơn vị.');
        }
        if (!selectedImageUri) {
            return Alert.alert('Lỗi', 'Vui lòng chọn ảnh cho bài test.');
        }

        setLoading(true);
        try {
            const uploadedImageUrl = await uploadImageToServer(selectedImageUri);

            const response = await fetch(TEST_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: testTitle,
                    level_id: selectedLevelId,
                    unit_id: selectedUnitId,
                    image_url: uploadedImageUrl,
                    description: testDescription.trim() || null,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Thành công', `Đã thêm bài test: ${data.title}`);
                resetForm();
                fetchTests(selectedLevelId, selectedUnitId);
            } else {
                Alert.alert('Lỗi', data.error || 'Không thêm được bài test.');
            }
        } catch (err) {
            console.error('Lỗi khi thêm bài test:', err);
            Alert.alert('Lỗi', err.message || 'Không thể thêm bài test. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const startEditingTest = (test) => {
        setEditingTestId(test.test_id);
        setTestTitle(test.title);
        setTestDescription(test.description || '');
        setImageName(test.image_url); // Lưu đường dẫn ảnh cũ để xóa nếu ảnh mới được chọn
        setSelectedLevelId(test.level_id);
        setSelectedUnitId(test.unit_id);
        setSelectedImageUri(null); // Clear selectedImageUri để hiển thị ảnh cũ
    };

    const handleUpdateTest = async () => {
        if (!editingTestId) {
            return Alert.alert('Lỗi', 'Không có bài test nào đang được chỉnh sửa.');
        }
        if (!testTitle.trim()) {
            return Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề bài test.');
        }
        if (selectedLevelId === null) {
            return Alert.alert('Lỗi', 'Vui lòng chọn một cấp độ.');
        }
        if (selectedUnitId === null) {
            return Alert.alert('Lỗi', 'Vui lòng chọn một đơn vị.');
        }
        if (!imageName && !selectedImageUri) { // Kiểm tra cả ảnh cũ và ảnh mới
            return Alert.alert('Lỗi', 'Vui lòng chọn ảnh cho bài test.');
        }

        setLoading(true);
        let finalImageUrl = imageName; // Mặc định là ảnh hiện có

        try {
            if (selectedImageUri) { // Nếu có ảnh mới được chọn
                finalImageUrl = await uploadImageToServer(selectedImageUri, imageName); // Tải ảnh mới và truyền ảnh cũ để xóa
            }

            const response = await fetch(`${TEST_API_URL}/${editingTestId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: testTitle,
                    level_id: selectedLevelId,
                    unit_id: selectedUnitId,
                    image_url: finalImageUrl,
                    description: testDescription.trim() || null,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Thành công', `Đã cập nhật bài test: ${data.title}`);
                resetForm();
                fetchTests(selectedLevelId, selectedUnitId); // Refresh tests for the current level and unit
            } else {
                Alert.alert('Lỗi', data.error || 'Không cập nhật được bài test.');
            }
        } catch (err) {
            console.error('Lỗi khi cập nhật bài test:', err);
            Alert.alert('Lỗi', err.message || 'Không thể cập nhật bài test. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTest = async (testId, imageUrl) => {
        Alert.alert(
            'Xác nhận xóa',
            `Bạn có chắc chắn muốn xóa bài test này? Hành động này không thể hoàn tác.`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const response = await fetch(`${TEST_API_URL}/${testId}`, {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ imageUrl: imageUrl }), // Pass image URL to delete on server
                            });

                            const data = await response.json();

                            if (response.ok) {
                                Alert.alert('Thành công', `Đã xóa bài test: ${data.deletedTest.title || 'Không rõ tên'}`);
                                fetchTests(selectedLevelId, selectedUnitId);
                            } else {
                                Alert.alert('Lỗi', data.error || 'Không xóa được bài test.');
                            }
                        } catch (err) {
                            console.error('Lỗi khi xóa bài test:', err);
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
        setEditingTestId(null);
        setTestTitle('');
        setTestDescription('');
        setImageName(null);
        setSelectedImageUri(null);
        // Không reset selectedLevelId và selectedUnitId ở đây để giữ bộ lọc
    };

    const filteredTests = tests.filter(test =>
        test.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const onRefresh = useCallback(() => {
        resetForm();
        if (selectedLevelId && selectedUnitId) {
            fetchTests(selectedLevelId, selectedUnitId);
        } else if (selectedLevelId) {
            fetchUnitsByLevel(selectedLevelId);
        } else {
            fetchLevels();
        }
    }, [selectedLevelId, selectedUnitId, fetchTests, fetchUnitsByLevel, fetchLevels]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
            {/* Header Section: Back Button and Title */}
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Image source={BackIcon} style={styles.backIcon} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Quản lý (Tests)</Text>
            </View>
            {/* --- */}

            <ScrollView
                contentContainerStyle={styles.scrollViewContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007bff']} tintColor={'#007bff'} />
                }
            >
                {/* Phần Chọn cấp độ để Lọc */}
                <View style={styles.card}>
                    <Text style={styles.label}>Chọn cấp độ để xem:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.levelSelectorContainer}>
                        {levels.length === 0 ? (
                            <Text style={styles.noDataAvailable}>Không có cấp độ nào. Vui lòng thêm cấp độ trước.</Text>
                        ) : (
                            levels.map((lvl) => (
                                <TouchableOpacity
                                    key={lvl.level_id}
                                    style={[
                                        styles.levelButton,
                                        selectedLevelId === lvl.level_id && styles.levelButtonSelected,
                                    ]}
                                    onPress={() => {
                                        setSelectedLevelId(lvl.level_id);
                                        setSelectedUnitId(null); // Reset unit khi đổi level
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

                {/* Phần Chọn đơn vị để Lọc (hiển thị khi có level được chọn) */}
                {selectedLevelId !== null && (
                    <View style={styles.card}>
                        <Text style={styles.label}>Chọn đơn vị để xem:</Text>
                        {loading && !refreshing ? (
                             <ActivityIndicator size="small" color="#007bff" style={{marginTop: 10}} />
                        ) : (
                            units.length === 0 ? (
                                <Text style={styles.noDataAvailable}>Không có đơn vị nào trong cấp độ này.</Text>
                            ) : (
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={selectedUnitId}
                                        onValueChange={(itemValue) => {
                                            setSelectedUnitId(itemValue);
                                            resetForm();
                                        }}
                                        style={styles.picker}
                                        itemStyle={styles.pickerItem}
                                    >
                                        <Picker.Item label="-- Chọn đơn vị --" value={null} />
                                        {units.map((unit) => (
                                            <Picker.Item key={unit.unit_id} label={unit.title} value={unit.unit_id} />
                                        ))}
                                    </Picker>
                                </View>
                            )
                        )}
                    </View>
                )}

                {/* Phần Thêm/Chỉnh sửa Test (chỉ hiển thị khi có level và unit được chọn) */}
                {selectedLevelId !== null && selectedUnitId !== null && (
                    <View style={styles.card}>
                        <Text style={styles.label}>{editingTestId ? 'Chỉnh sửa Bài Test' : 'Thêm Bài Test Mới'}</Text>
                        
                        <Text style={styles.label}>Tiêu đề Bài Test</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="VD: Bài kiểm tra Unit 1..."
                            value={testTitle}
                            onChangeText={setTestTitle}
                        />

                        <Text style={styles.label}>Mô tả Bài Test (Tùy chọn)</Text>
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                            placeholder="Mô tả chi tiết bài test..."
                            value={testDescription}
                            onChangeText={setTestDescription}
                            multiline
                        />

                        <Text style={styles.label}>Cấp độ cho Bài Test</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={selectedLevelId}
                                onValueChange={(itemValue) => setSelectedLevelId(itemValue)}
                                style={styles.picker}
                                itemStyle={styles.pickerItem}
                                enabled={true} // Luôn cho phép chọn level
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

                        <Text style={styles.label}>Đơn vị cho Bài Test</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={selectedUnitId}
                                onValueChange={(itemValue) => setSelectedUnitId(itemValue)}
                                style={styles.picker}
                                itemStyle={styles.pickerItem}
                                enabled={true} // Luôn cho phép chọn unit
                            >
                                {units.length === 0 ? (
                                    <Picker.Item label="Không có đơn vị" value={null} />
                                ) : (
                                    units.map((unit) => (
                                        <Picker.Item key={unit.unit_id} label={unit.title} value={unit.unit_id} />
                                    ))
                                )}
                            </Picker>
                        </View>

                        <Text style={styles.label}>Ảnh Bài Test</Text>
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

                        {loading && !refreshing ? (
                            <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
                        ) : (
                            <>
                                {editingTestId ? (
                                    <TouchableOpacity style={[styles.button, styles.updateButton]} onPress={handleUpdateTest}>
                                        <Text style={styles.buttonText}>Cập nhật Bài Test</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity style={styles.button} onPress={handleAddTest}>
                                        <Text style={styles.buttonText}>Thêm Bài Test</Text>
                                    </TouchableOpacity>
                                )}
                                {(editingTestId || testTitle || testDescription || selectedImageUri || selectedLevelId !== null || selectedUnitId !== null) && (
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
                {/* --- */}

                {/* Thanh tìm kiếm và Danh sách Test */}
                {selectedLevelId !== null && selectedUnitId !== null ? (
                    <>
                        <Text style={[styles.headerTitle, { fontSize: 22, marginTop: 30, marginBottom: 15, textAlign: 'center' }]}>Danh sách Bài Test</Text>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Tìm kiếm bài test..."
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />

                        {loading && !refreshing ? (
                            <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
                        ) : (
                            filteredTests.length === 0 ? (
                                <Text style={styles.noDataAvailable}>
                                    {searchTerm ? `Không tìm thấy bài test "${searchTerm}" trong đơn vị này.` : 'Chưa có bài test nào trong đơn vị này.'}
                                </Text>
                            ) : (
                                filteredTests.map((test, index) => (
                                    <View key={test.test_id} style={styles.testCard}>
                                        <Text style={styles.testText}>
                                            {index + 1}. {test.title} (Lượt chơi: {test.play_count})
                                        </Text>
                                        {test.description ? (
                                            <Text style={styles.testDescription}>{test.description}</Text>
                                        ) : null}

                                        {test.image_url ? (
                                            <Image
                                                source={{ uri: `${BASE_URL}${test.image_url}` }}
                                                style={styles.testImage}
                                            />
                                        ) : (
                                            <Text style={styles.noImagePlaceholder}>Không có ảnh</Text>
                                        )}

                                        <View style={styles.testActions}>
                                            <TouchableOpacity
                                                style={[styles.actionButton, { backgroundColor: '#f0ad4e' }]}
                                                onPress={() => startEditingTest(test)}
                                            >
                                                <Text style={styles.actionButtonText}>✏️ Sửa</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[styles.actionButton, { backgroundColor: '#d9534f' }]}
                                                onPress={() => handleDeleteTest(test.test_id, test.image_url)}
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
                    <Text style={styles.selectPrompt}>Vui lòng chọn một cấp độ và một đơn vị để xem hoặc thêm bài test.</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    scrollViewContent: {
        paddingHorizontal: 20,
        paddingBottom: 50,
        backgroundColor: '#E0E5FF',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        marginTop: 20,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        position: 'absolute',
        left: 20,
        padding: 5,
        zIndex: 10,
    },
    backIcon: {
        width: 24,
        height: 24,
        tintColor: '#343a40',
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#343a40',
        textAlign: 'center',
        flex: 1,
    },
    card: {
        backgroundColor: '#ffffff',
        marginTop: 5,
        padding: 10,
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
        backgroundColor: '#fff',
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
    levelSelectorContainer: {
        marginBottom: 15,
        paddingVertical: 5,
    },
    levelButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 18,
        backgroundColor: '#f0f4f7',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e0e6ec',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    levelButtonSelected: {
        backgroundColor: '#4a90e2',
        borderColor: '#3a7bd5',
        shadowOpacity: 0.1,
        elevation: 2,
    },
    levelButtonText: {
        color: '#5a6a7c',
        fontWeight: '600',
        fontSize: 14,
    },
    levelButtonTextSelected: {
        color: '#ffffff',
    },
    noDataAvailable: {
        color: '#dc3545',
        textAlign: 'center',
        marginVertical: 10,
        fontStyle: 'italic',
        paddingHorizontal: 20,
    },
    testCard: {
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
    testText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 5,
    },
    testDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
        lineHeight: 20,
    },
    testImage: {
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
    testActions: {
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
    selectPrompt: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 18,
        color: '#555',
        fontStyle: 'italic',
        paddingHorizontal: 20,
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 10,
        padding: 10,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
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

export default TestADScreen;