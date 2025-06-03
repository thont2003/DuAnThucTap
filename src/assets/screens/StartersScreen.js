import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const StartersScreen = () => {
  const navigation = useNavigation();

  const tabs = [
    { label: 'Starters', route: 'Starters' },
    { label: 'Movers', route: 'Movers' },
    { label: 'Flyers', route: 'Flyers' },
    { label: 'Grammar', route: 'Grammar' },
  ];

  // Danh sách ảnh (thay đổi đường dẫn theo đúng file trong dự án của bạn)
  const images = [
    require('../images/image1.jpg'), // Đường dẫn tới ảnh 1
    require('../images/image2.jpg'), // Đường dẫn tới ảnh 2
    require('../images/image3.jpg'), // Đường dẫn tới ảnh 3
    require('../images/image4.jpg'), // Đường dẫn tới ảnh 4
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>{"<--"}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Danh sách bài tập</Text>
        </View>
        {/* Tabs */}
        <View style={styles.tabContainer}>
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => navigation.navigate(tab.route)}
              style={styles.tab}
Gol>
              <Text
                style={[styles.tabText, tab.label === 'Starters' ? styles.activeTab : null]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {/* Nội dung trang */}
      <View style={styles.content}>
       
        {/* Hiển thị 4 ảnh, 2 ảnh trên mỗi hàng */}
        <View style={styles.imageGrid}>
          {images.map((image, index) => (
            <Image
              key={index}
              source={image}
              style={styles.image}
              resizeMode="cover"
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFF',
    elevation: 4,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  backButton: {
    padding: 30,
    borderRadius: 5,
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'left',
    marginLeft: 20,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 0,
    borderTopColor: '#DDD',
  },
  tabText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  activeTab: {
    color: '#1E90FF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -120, // Đẩy nội dung xuống dưới header
  },
  contentText: {
    fontSize: 18,
    marginBottom: 20,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  image: {
    width: '45%', // Chiếm khoảng 45% chiều rộng để có 2 ảnh trên mỗi hàng
    height: "150", // Chiều cao cố định, bạn có thể điều chỉnh
    marginBottom: 20,
    borderRadius: 10, // Bo góc ảnh (tùy chọn)
  },
});

export default StartersScreen;