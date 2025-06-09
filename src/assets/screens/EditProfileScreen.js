import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    ScrollView, // Import ScrollView
    KeyboardAvoidingView, // Import KeyboardAvoidingView
    Platform, // Import Platform
    StatusBar // Import StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const EditProfileScreen = () => {
    const navigation = useNavigation();
    const [fullName, setFullName] = useState('lê thanh tùng');
    const [email, setEmail] = useState('lethanhtung0234@gmail.com');
    const [dateOfBirth, setDateOfBirth] = useState('18/11/2003');
    const [phoneNumber, setPhoneNumber] = useState('+84908101483');
    const [address, setAddress] = useState('123 Đường ABC, Quận XYZ, TP.HCM'); // Thêm state cho Địa chỉ

    const handleSave = () => {
        // Here you would typically send updated data to your backend
        // In a real application, you'd send an API request with:
        // { fullName, email, dateOfBirth, phoneNumber, address }
        console.log({ fullName, email, dateOfBirth, phoneNumber, address });
        Alert.alert('Lưu thông tin', 'Thông tin của bạn đã được lưu thành công!');
        // Optionally navigate back after saving
        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView // Wrap toàn bộ với KeyboardAvoidingView
            style={styles.container}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#e0e5ff" />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Image
                        source={require('../images/login_signup/back.png')} // Sử dụng icon back đã có
                        style={styles.backIcon}
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
            </View>

            <ScrollView // Sử dụng ScrollView cho nội dung có thể cuộn
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={false} // Ẩn thanh cuộn dọc
            >
                {/* Profile Icon */}
                <View style={styles.profileIconContainer}>
                    <Image
                        source={require('../images/home/account.png')} // Replace with actual profile image or a default avatar
                        style={styles.profileIcon}
                    />
                </View>

                {/* Input Fields */}
                <View style={styles.formContainer}>
                    <Text style={styles.inputLabel}>Họ và tên *</Text>
                    <TextInput
                        style={styles.input}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Nhập họ và tên của bạn"
                    />

                    <Text style={styles.inputLabel}>Email *</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        editable={false} // Email is often not editable
                        placeholder="Email của bạn"
                    />

                    <Text style={styles.inputLabel}>Ngày sinh *</Text>
                    <TextInput
                        style={styles.input}
                        value={dateOfBirth}
                        onChangeText={setDateOfBirth}
                        placeholder="DD/MM/YYYY"
                        keyboardType="numbers-and-punctuation" // Hỗ trợ nhập ngày
                    />

                    <Text style={styles.inputLabel}>Số điện thoại</Text>
                    <TextInput
                        style={styles.input}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        placeholder="Số điện thoại của bạn"
                    />

                    <Text style={styles.inputLabel}>Địa chỉ</Text>
                    <TextInput
                        style={[styles.input, styles.addressInput]} // Thêm style cho địa chỉ nếu cần nhiều dòng
                        value={address}
                        onChangeText={setAddress}
                        placeholder="Địa chỉ của bạn"
                        multiline={true} // Cho phép nhiều dòng
                        numberOfLines={4} // Số dòng hiển thị ban đầu
                        textAlignVertical="top" // Đặt text lên trên cùng
                    />

                    {/* Save Button */}
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Sửa</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ height: 50 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e0e5ff', // Light gray background
    },
    header: {
      flexDirection: 'row',
      paddingTop: 50,
      paddingBottom: 20,
      alignItems: 'center',
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    backButton: {
        marginRight: 10, // Giảm khoảng cách để icon trông đẹp hơn
        padding: 5, // Tăng vùng chạm cho nút
    },
    backIcon: { // Style mới cho icon back
        width: 24,
        height: 24,
        tintColor: '#333',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        justifyContent: 'center',
    },
    scrollViewContent: {
        flexGrow: 1, // Đảm bảo ScrollView có thể cuộn
        paddingBottom: 20, // Khoảng trống ở cuối để nút không bị che
    },
    profileIconContainer: {
        width: 160,
        height: 160,
        borderRadius: 100,
        backgroundColor: '#fff', // Changed to white to match your logo/avatar background
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center', // Center horizontally
        marginTop: 30, // Giảm margin top
        marginBottom: 30, // Giảm margin bottom
        shadowColor: '#000', // Add shadow for depth
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
        borderWidth: 2, // Thêm viền nhẹ
        borderColor: '#eee', // Màu viền
    },
    profileIcon: {
        width: 180, // Giảm kích thước ảnh để nó nằm trong container
        height: 180,
        resizeMode: 'contain', // Đảm bảo ảnh không bị cắt xén
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 30,
        marginHorizontal: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        paddingBottom: 30, // Thêm padding dưới để nút Save không quá sát mép
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
    addressInput: {
        height: 100, // Chiều cao cố định cho trường địa chỉ nhiều dòng
        lineHeight: 20, // Tăng khoảng cách dòng
    },
    saveButton: {
        backgroundColor: '#ff5c5c', // Đổi màu nút save thành màu đỏ cam
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
});

export default EditProfileScreen;