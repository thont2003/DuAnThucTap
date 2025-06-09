import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';

const CustomAlertDialog = ({
  isVisible,
  title,
  message,
  onConfirm,
  onCancel, // Vẫn giữ onCancel để có thể đóng modal khi nhấn ra ngoài nếu không có nút cancel
  confirmText = 'OK',
  cancelText = 'Hủy',
  showCancelButton = true, // Thêm prop này để kiểm soát việc hiển thị nút Hủy
}) => {
  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={showCancelButton ? onCancel : null} // Chỉ đóng khi nhấn ra ngoài nếu có nút hủy
      animationIn="zoomIn"
      animationOut="zoomOut"
      backdropTransitionOutTiming={0}
      useNativeDriver
      hideModalContentWhileAnimating={true} // Tối ưu hiệu suất
    >
      <View style={styles.alertContainer}>
        {/* Title */}
        <Text style={styles.alertTitle}>{title}</Text>

        {/* Message */}
        <Text style={styles.alertMessage}>{message}</Text>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {showCancelButton && onCancel && ( // Chỉ hiển thị nút Hủy nếu showCancelButton là true VÀ có onCancel
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, styles.confirmButton, !showCancelButton && styles.singleButton]} // Thêm style cho nút đơn
            onPress={onConfirm}
          >
            <Text style={styles.confirmButtonText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  alertContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#4CAF50', // Màu xanh cho thành công
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  singleButton: {
    flex: 0, // Không chiếm toàn bộ không gian
    width: '60%', // Chiếm 60% chiều rộng container
    marginHorizontal: 0, // Bỏ margin ngang nếu là nút đơn
  },
});

export default CustomAlertDialog;
