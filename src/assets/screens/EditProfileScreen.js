import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCall } from '../utils/api';
import CustomAlertDialog from '../components/CustomAlertDialog';
import { launchImageLibrary } from 'react-native-image-picker';
import { BASE_URL } from '../utils/constants';
import DateTimePicker from '@react-native-community/datetimepicker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState(null); // Lưu URI ảnh tạm
  const [loading, setLoading] = useState(false);
  const [showEmailTooltip, setShowEmailTooltip] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const scrollViewRef = useRef(null);
  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneNumberRef = useRef(null);
  const addressRef = useRef(null);

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
        setSelectedImageUri(null); // Reset ảnh tạm khi tải lại
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
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {});
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {});
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [isFocused]);

  const handleImagePick = async () => {
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

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.error('ImagePicker Error: ', response.error);
        showCustomAlert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
      } else {
        setSelectedImageUri(response.assets[0].uri); // Lưu URI tạm để hiển thị
      }
    });
  };

  const parseDDMMYYYY = (str) => {
    const [d, m, y] = str.split('/');
    return new Date(+y, +m - 1, +d);
  };

  const handleSave = async () => {
    if (!username.trim() || !email.trim() || !dateOfBirth.trim()) {
      showCustomAlert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc (Tên, Email, Ngày sinh).');
      return;
    }

    // Kiểm tra ngày sinh không được lớn hơn hôm nay
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    if (birthDate > today) {
      showCustomAlert('Lỗi', 'Ngày sinh không được lớn hơn ngày hiện tại.');
      return;
    }

    // Chuyển từ DD/MM/YYYY sang YYYY-MM-DD để gửi lên server
    const [day, month, year] = dateOfBirth.split('/');
    const formattedDate = `${day}/${month}/${year}`;

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

      let newProfileImageUrl = profileImageUrl;
      if (selectedImageUri) {
        const formData = new FormData();
        formData.append('image', {
          uri: selectedImageUri,
          type: 'image/jpeg',
          name: `profile_${Date.now()}.jpg`,
        });
        formData.append('userId', userId);

        // 🆕 Gửi đường dẫn ảnh cũ nếu có
        if (profileImageUrl) {
          formData.append('oldImagePath', profileImageUrl);
        }

        const uploadResponse = await fetch(`${BASE_URL}/api/upload-image`, {
          method: 'POST',
          body: formData,
        });

        const responseText = await uploadResponse.text();
        console.log('Raw response from upload:', responseText);
        console.log('Status code:', uploadResponse.status);

        let result;
        try {
          result = JSON.parse(responseText);
        } catch (jsonError) {
          console.error('JSON Parse Error:', jsonError.message);
          showCustomAlert('Lỗi', `Phản hồi từ server không hợp lệ. Raw response: ${responseText}`);
          setLoading(false);
          return;
        }

        if (uploadResponse.ok && result.profileImageUrl) {
          newProfileImageUrl = result.profileImageUrl;
        } else {
          showCustomAlert('Lỗi', result.error || 'Không thể tải ảnh lên.');
          setLoading(false);
          return;
        }
      }

      const response = await apiCall('PUT', `/api/user/${userId}`, {
        username,
        email,
        dateOfBirth: formattedDate,
        phoneNumber,
        address,
        profileImageUrl: newProfileImageUrl,
      });
      console.log('EditProfileScreen: Save user response:', response);

      if (response.ok) {
        const updatedUserInfo = { ...userInfo, username, email, profileImageUrl: newProfileImageUrl };
        await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
        setProfileImageUrl(newProfileImageUrl); // Cập nhật ảnh sau khi lưu
        setSelectedImageUri(null); // Reset ảnh tạm
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

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      const today = new Date();
      if (selectedDate > today) {
        showCustomAlert('Lỗi', 'Ngày sinh không được vượt quá ngày hiện tại.');
        return;
      }

      const day = selectedDate.getDate().toString().padStart(2, '0');
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const year = selectedDate.getFullYear();

      const formatted = `${day}/${month}/${year}`; // ✅ Định dạng DD/MM/YYYY
      setDateOfBirth(formatted);
    }
  };

  const handleOutsidePress = () => {
    setShowEmailTooltip(false);
  };

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Image source={require('../images/login_signup/back.png')} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chỉnh sửa thông tin</Text>
        </View>

        <KeyboardAwareScrollView
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 100 }} // Đảm bảo không gian cho footer
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={Platform.OS === 'ios' ? 80 : 100} // Điều chỉnh khoảng cách giữa input và bàn phím
          enableOnAndroid={true}
          enableAutomaticScroll={(event) => {
            scrollViewRef.current?.scrollToFocusedInput(ReactNative.findNodeHandle(event.target));
          }}
        >
          {loading ? (
            <ActivityIndicator size="large" style={styles.loadingIndicator} />
          ) : (
            <>
              <View style={styles.profileImageContainer}>
                <TouchableOpacity onPress={handleImagePick}>
                  <Image
                    source={
                      selectedImageUri
                        ? { uri: selectedImageUri }
                        : profileImageUrl
                          ? { uri: `${BASE_URL}${profileImageUrl}` }
                          : require('../images/home/account.png')
                    }
                    style={styles.profileIcon}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.formContainer}>
                <Text style={styles.inputLabel}>Họ và tên <Text style={styles.required}>*</Text></Text>
                <TextInput
                  ref={usernameRef}
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => {
                    scrollViewRef.current?.scrollToFocusedInput(ReactNative.findNodeHandle(usernameRef.current));
                  }}
                />

                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Email <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity onPress={() => setShowEmailTooltip(true)}>
                    <Image source={require('../images/question-mark.png')} style={styles.questionIcon} />
                  </TouchableOpacity>
                  {showEmailTooltip && (
                    <View style={styles.tooltip}>
                      <Text style={styles.tooltipText}>Vui lòng liên hệ với chúng tôi trong trường hợp bạn muốn đổi email</Text>
                    </View>
                  )}
                </View>
                <TextInput
                  ref={emailRef}
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  editable={false}
                  onFocus={() => {
                    scrollViewRef.current?.scrollToFocusedInput(ReactNative.findNodeHandle(emailRef.current));
                  }}
                />

                <Text style={styles.inputLabel}>Ngày sinh <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={styles.input}
                  onFocus={() => {
                    scrollViewRef.current?.scrollToFocusedInput(ReactNative.findNodeHandle(this));
                  }}
                >
                  <Text style={{ color: dateOfBirth ? '#000' : '#aaa', fontSize: 16 }}>
                    {dateOfBirth || 'Chọn ngày sinh'}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={dateOfBirth ? parseDDMMYYYY(dateOfBirth) : new Date('2000-01-01')}
                    mode="date"
                    display="spinner"
                    maximumDate={new Date()}
                    onChange={handleDateChange}
                  />
                )}

                <Text style={styles.inputLabel}>Số điện thoại</Text>
                <TextInput
                  ref={phoneNumberRef}
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  onFocus={() => {
                    scrollViewRef.current?.scrollToFocusedInput(ReactNative.findNodeHandle(phoneNumberRef.current));
                  }}
                />

                <Text style={styles.inputLabel}>Địa chỉ</Text>
                <TextInput
                  ref={addressRef}
                  style={[styles.input, styles.addressInput]}
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  numberOfLines={4}
                  onFocus={() => {
                    scrollViewRef.current?.scrollToFocusedInput(ReactNative.findNodeHandle(addressRef.current));
                  }}
                />
              </View>
            </>
          )}
        </KeyboardAwareScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
            <Text style={styles.saveButtonText}>{loading ? 'Đang lưu...' : 'Sửa'}</Text>
          </TouchableOpacity>
        </View>

        <CustomAlertDialog
          isVisible={isAlertVisible}
          title={alertTitle}
          message={alertMessage}
          onConfirm={alertOnConfirm}
          confirmText="OK"
          showCancelButton={false}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

// Lưu ý: Cần import ReactNative để sử dụng findNodeHandle
const ReactNative = require('react-native');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
    zIndex: 1000,
    elevation: 10,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    marginBottom: 70,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  profileIcon: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginHorizontal: 15,
    marginBottom: 20,
    padding: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  inputLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  required: {
    color: 'red',
  },
  input: {
    backgroundColor: '#f5f5f5',
    height: 50,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    borderColor: '#e0e0e0',
    marginBottom: 15,
  },
  addressInput: {
    height: 100,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  questionIcon: {
    width: 13,
    height: 13,
    marginLeft: 5,
    bottom: 3,
    tintColor: '#696969',
  },
  tooltip: {
    backgroundColor: '#000022',
    height: 70,
    width: 200,
    padding: 10,
    borderRadius: 10,
    zIndex: 1000,
    position: 'absolute',
    top: -25,
    left: 65,
    right: 0,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 14,
  },
  footer: {
    height: 100,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    zIndex: 1000,
    elevation: 10,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
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