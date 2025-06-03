import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    padding: 0, // Đảm bảo không có padding để banner sát mép
    backgroundColor: '#E0E5FF'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0, // Loại bỏ khoảng trống giữa header và banner
    backgroundColor: '#FFFFFF', // Màu trắng cho phần header
    padding: 20, // Giữ padding để không sát mép quá
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25, // Hình tròn
    marginRight: 10,
  },
  greeting: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333',
  },
  banner: {
    width: '100%', // Chiếm toàn bộ chiều rộng
    height: 150,
    resizeMode: 'cover',
    marginHorizontal: 0, // Loại bỏ margin ngang
    paddingHorizontal: 0, // Loại bỏ padding ngang
  },
});