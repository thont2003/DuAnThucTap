import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Image,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    StatusBar
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCall } from '../utils/api';
import CustomAlertDialog from '../components/CustomAlertDialog';
import { launchImageLibrary } from 'react-native-image-picker'; // Cập nhật import

const EditProfileScreen = () => {
    const navigation = useNavigation();
    const isFocused = useIsFocused();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertOnConfirm, setAlertOnConfirm] = useState(() => () => setIsAlertVisible(false));

    const showCustomAlert = (title, message, confirmAction = () => setIsAlertVisible(false)) => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertOnConfirm(() => confirmAction);
        setIsAlertVisible(true);
    };

    const fetchUserInfo = async () => {
        setLoading(true);
        try {
            const userInfoString = await AsyncStorage.getItem('userInfo');
            console.log('EditProfileScreen: userInfoString:', userInfoString);

            if (!userInfoString) {
                showCustomAlert('Lỗi', 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.', () => {
                    setIsAlertVisible(false);
                    navigation.navigate('Login');
                });
                return;
            }

            const userInfo = JSON.parse(userInfoString);
            const userId = userInfo.userId;
            console.log('EditProfileScreen: userId:', userId);

            if (!userId) {
                showCustomAlert('Lỗi', 'Không tìm thấy ID người dùng. Vui lòng đăng nhập lại.', () => {
                    setIsAlertVisible(false);
                    navigation.navigate('Login');
                });
                return;
            }

            const response = await apiCall('GET', `/api/user/${userId}`);
            console.log('EditProfileScreen: Fetch user response:', response);

            if (response.ok && response.data) {
                setUsername(response.data.username || userInfo.username || '');
                setEmail(response.data.email || userInfo.email || '');
                setDateOfBirth(response.data.date_of_birth || '');
                setPhoneNumber(response.data.phone_number || '');
                setAddress(response.data.address || '');
                setProfileImageUrl(response.data.profile_image_url || '');
            } else {
                showCustomAlert('Lỗi', response.data?.error || 'Không thể tải thông tin người dùng.');
            }
        } catch (error) {
            console.error('EditProfileScreen: Error fetching user:', error.message);
            showCustomAlert('Lỗi', 'Không thể kết nối đến server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            fetchUserInfo();
        }
    }, [isFocused]);

    const handleImagePick = () => {
        const options = {
            title: 'Chọn ảnh hồ sơ',
            storageOptions: {
                skipBackup: true,
                path: 'images',
            },
            mediaType: 'photo',
            quality: 0.8,
            maxWidth: 800,
            maxHeight: 800,
        };

        launchImageLibrary(options, async (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.error('ImagePicker Error: ', response.error);
                showCustomAlert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
            } else {
                setLoading(true);
                try {
                    const formData = new FormData();
                    formData.append('image', {
                        uri: response.assets[0].uri, // Truy cập uri từ assets[0]
                        type: response.assets[0].type || 'image/jpeg',
                        name: response.assets[0].fileName || 'profile.jpg',
                    });

                    const uploadResponse = await fetch('http://192.168.1.7:3000/api/upload', {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });

                    const result = await uploadResponse.json();
                    console.log('Upload response:', result);

                    if (uploadResponse.ok && result.imageUrl) {
                        setProfileImageUrl(result.imageUrl);
                        showCustomAlert('Thành công', 'Ảnh hồ sơ đã được cập nhật.');
                    } else {
                        showCustomAlert('Lỗi', result.error || 'Không thể tải ảnh lên.');
                    }
                } catch (error) {
                    console.error('Error uploading image:', error.message);
                    showCustomAlert('Lỗi', 'Không thể tải ảnh lên.');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleSave = async () => {
        if (!username || !email || !dateOfBirth || !phoneNumber || !address) {
            showCustomAlert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc.');
            return;
        }

        setLoading(true);
        try {
            const userInfoString = await AsyncStorage.getItem('userInfo');
            if (!userInfoString) {
                showCustomAlert('Lỗi', 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại.', () => {
                    setIsAlertVisible(false);
                    navigation.navigate('Login');
                });
                return;
            }

            const userInfo = JSON.parse(userInfoString);
            const userId = userInfo.userId;
            console.log('EditProfileScreen: userId for saving:', userId);

            if (!userId) {
                showCustomAlert('Lỗi', 'Không tìm thấy ID người dùng. Vui lòng đăng nhập lại.', () => {
                    setIsAlertVisible(false);
                    navigation.navigate('Login');
                });
                return;
            }

            const response = await apiCall('PUT', `/api/user/${userId}`, {
                username,
                email,
                dateOfBirth,
                phoneNumber,
                address,
                profileImageUrl
            });
            console.log('EditProfileScreen: Save user response:', response);

            if (response.ok) {
                const updatedUserInfo = { ...userInfo, username, email };
                await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
                showCustomAlert('Thành công', 'Thông tin đã được cập nhật thành công!', () => {
                    setIsAlertVisible(false);
                    navigation.goBack();
                });
            } else {
                showCustomAlert('Lỗi', response.data?.error || 'Không thể cập nhật thông tin.');
            }
        } catch (error) {
            console.error('EditProfileScreen: Error saving user:', error.message);
            showCustomAlert('Lỗi', 'Không thể kết nối đến server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Image source={require('../images/login_signup/back.png')} style={styles.backIcon} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" style={styles.loadingIndicator} />
                ) : (
                    <>
                        <View style={styles.profileImageContainer}>
                            <TouchableOpacity
                                onPress={handleImagePick}
                            >
                                <Image
                                source={profileImageUrl ? { uri: profileImageUrl } : require('../images/home/account.png')}
                                style={styles.profileIcon}
                            />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formContainer}>
                            <Text style={styles.inputLabel}>Tên người dùng *</Text>
                            <TextInput
                                style={[styles.input, styles.brightInput]}
                                value={username}
                                onChangeText={setUsername}
                                placeholder="Nhập tên người dùng"
                            />

                            <Text style={styles.inputLabel}>Email *</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Nhập email"
                                keyboardType="email-address"
                                editable={true}
                            />

                            <Text style={styles.inputLabel}>Ngày sinh (DD/MM/YYYY) *</Text>
                            <TextInput
                                style={[styles.input, styles.brightInput]}
                                value={dateOfBirth}
                                onChangeText={setDateOfBirth}
                                placeholder="DD/MM/YYYY"
                            />

                            <Text style={styles.inputLabel}>Số điện thoại *</Text>
                            <TextInput
                                style={[styles.input, styles.brightInput]}
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                placeholder="Nhập số điện thoại"
                                keyboardType="phone-pad"
                            />

                            <Text style={styles.inputLabel}>Địa chỉ *</Text>
                            <TextInput
                                style={[styles.input, styles.brightInput, styles.addressInput]}
                                value={address}
                                onChangeText={setAddress}
                                placeholder="Nhập địa chỉ"
                                multiline
                                numberOfLines={4}
                            />

                            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                                <Text style={styles.saveButtonText}>{loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </ScrollView>

            <CustomAlertDialog
                isVisible={isAlertVisible}
                title={alertTitle}
                message={alertMessage}
                onConfirm={alertOnConfirm}
                confirmText="OK"
                showCancelButton={false}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    },
    backButton: {
        padding: 5,
        marginRight: 10,
    },
    backIcon: {
        width: 25,
        height: 25,
        tintColor: '#333',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
        marginLeft: -30,
    },
    profileImageContainer: {
        alignItems: 'center',
        marginVertical: 30,
    },
    profileIcon: {
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 3,
        borderColor: '#ff5c5c',
        resizeMode: 'cover',
    },
    changePhotoButton: {
        marginTop: 15,
        backgroundColor: '#ff5c5c',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    changePhotoButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 15,
        marginHorizontal: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        color: '#555',
        marginBottom: 5,
        marginTop: 15,
        fontWeight: 'bold',
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    brightInput: {
        backgroundColor: '#fff',
    },
    addressInput: {
        height: 100,
        lineHeight: 20,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: '#ff5c5c',
        borderRadius: 10,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 30,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingIndicator: {
        marginTop: 50,
    },
});

export default EditProfileScreen;