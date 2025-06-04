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

  // Danh sách ảnh và tiêu đề
  const images = [
    { source: require('../images/image1.jpg'), title: 'Unit 0: Home' },
    { source: require('../images/image2.jpg'), title: 'Unit 1: I love animal' },
    { source: require('../images/image3.jpg'), title: 'Unit 2: Home' },
    { source: require('../images/image4.jpg'), title: 'Unit 3: Family and friends' },
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
            >
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
        {/* Hiển thị 4 ảnh với khung trắng và tiêu đề */}
        <View style={styles.imageGrid}>
          {images.map((item, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image
                source={item.source}
                style={styles.image}
                resizeMode="contain" // Đảm bảo ảnh hiển thị đầy đủ
              />
              <Text style={styles.imageTitle}>{item.title}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF', // Nền trắng cho toàn màn hình
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
    padding: 10,
    borderRadius: 5,
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'left',
    marginLeft: 10,
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
  tab: {
    paddingHorizontal: 10,
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
    marginTop: 150, // Giữ khoảng cách giữa header và imageGrid
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  imageContainer: {
    width: '50%', // Chiếm 48% để có 2 ảnh trên mỗi hàng
    backgroundColor: '#FFF', // Khung trắng bao quanh ảnh và tiêu đề
    borderRadius: 10, // Bo góc khung
    borderWidth: 1, // Viền khung
    borderColor: '#DDD',
    alignItems: 'center', // Căn giữa nội dung theo chiều ngang
    justifyContent: 'center', // Căn giữa nội dung theo chiều dọc
    marginBottom: 20,
    padding: 2, // Giảm padding để thu hẹp khung trắng
    paddingTop: 0, // Giảm padding trên để khung gọn hơn
  },
  image: {
    width: '100%', // Ảnh chiếm toàn bộ chiều rộng của khung (sau padding)
    height: 150, // Chiều cao cố định
    borderRadius: 8, // Bo góc ảnh
    marginBottom: 3, // Giảm khoảng cách giữa ảnh và tiêu đề
  },
  imageTitle: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
});

export default StartersScreen;