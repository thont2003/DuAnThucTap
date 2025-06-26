// StartersScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL } from '../utils/constants';

const StartersScreen = () => {
  const navigation = useNavigation();
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hàm để xây dựng URL ảnh đầy đủ
  const getFullImageUrl = (imageFileName) => {
    // Nếu imageFileName đã là một URL đầy đủ (ví dụ: từ các nguồn bên ngoài),
    // bạn có thể trả về nó trực tiếp.
    // Nếu không, nối nó với base URL và thư mục images.
    if (imageFileName && imageFileName.startsWith('http')) {
      return imageFileName;
    }
    // Đảm bảo có dấu '/' ở cuối API_BASE_URL nếu cần thiết,
    // và dấu '/' giữa 'images' và tên file.
    return `${BASE_URL}/images/${imageFileName}`;
  };

  // ... (các useEffect và handleLevelPress giữ nguyên) ...

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const response = await fetch(`${BASE_URL}/levels`);
        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}. Chi tiết: ${errorBody}`);
        }
        const data = await response.json();
        setLevels(data);

        const defaultLevel = data.find(l => l.name === 'Starters');
        if (defaultLevel) {
          setCurrentLevel(defaultLevel);
        } else if (data.length > 0) {
          setCurrentLevel(data[0]);
        } else {
          setError("Không tìm thấy cấp độ nào trong database.");
          setLoading(false);
        }
      } catch (e) {
        console.error("Lỗi khi lấy cấp độ:", e);
        setError("Không thể tải dữ liệu cấp độ. Vui lòng thử lại sau.");
        setLoading(false);
      }
    };

    fetchLevels();
  }, []);

  useEffect(() => {
    const fetchUnits = async () => {
      if (!currentLevel) {
        setLoading(false);
        setUnits([]);
        return;
      }

      setLoading(true);
      setError(null);
      setUnits([]);

      try {
        const response = await fetch(`${BASE_URL}/levels/${currentLevel.level_id}/units`);
        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}. Chi tiết: ${errorBody}`);
        }
        const data = await response.json();
        setUnits(data);
      } catch (e) {
        console.error(`Lỗi khi lấy units cho level ${currentLevel.name}:`, e);
        setError(`Không thể tải bài tập cho ${currentLevel.name}. Vui lòng thử lại sau.`);
        setUnits([]);
      } finally {
        setLoading(false);
      }
    };

    if (currentLevel) {
      fetchUnits();
    }
  }, [currentLevel]);

  const handleLevelPress = (level) => {
    setCurrentLevel(level);
  };

  if (loading && !currentLevel) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E90FF" />
        <Text>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {/* Nút Back <-- */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>{"<--"}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Danh sách bài tập</Text>
        </View>
        {/* Tabs */}
        <View style={styles.tabContainer}>
          {levels.length > 0 ? (
            levels.map((level) => (
              <TouchableOpacity
                key={level.level_id}
                onPress={() => handleLevelPress(level)}
                style={styles.tab}
              >
                <Text
                  style={[
                    styles.tabText,
                    currentLevel && level.level_id === currentLevel.level_id
                      ? styles.activeTab
                      : null,
                  ]}
                >
                  {level.name}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noLevelsText}>Không tìm thấy cấp độ nào.</Text>
          )}
        </View>
      </View>
      {/* Nội dung trang */}
      <View style={styles.content}>
        {loading && currentLevel ? (
          <View style={styles.centeredContent}>
            <ActivityIndicator size="large" color="#1E90FF" />
            <Text>Đang tải bài tập...</Text>
          </View>
        ) : (
          units.length > 0 ? (
            <FlatList
              data={units}
              keyExtractor={item => item.unit_id.toString()}
              numColumns={2}
              renderItem={({ item }) => (
                <TouchableOpacity key={item.unit_id} style={styles.imageContainer}
                  onPress={() => {
                    console.log(`Đã nhấn vào Unit: ${item.title} (Level: ${currentLevel.name})`);
                    // Đây là nơi bạn sẽ điều hướng đến màn hình chi tiết bài tập
                    // Ví dụ: navigation.navigate('UnitDetailScreen', { unitId: item.unit_id, unitTitle: item.title });
                  }}
                >
                  {/* SỬA CHỮA TẠI ĐÂY: Sử dụng getFullImageUrl */}
                  <Image
                    source={{ uri: getFullImageUrl(item.image_url) }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                  <Text style={styles.imageTitle}>{item.title}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.imageGrid}
            />
          ) : (
            <View style={styles.centeredContent}>
              <Text style={styles.noUnitsText}>
                {currentLevel ? `Không có bài tập nào cho ${currentLevel.name}.` : 'Không có bài tập nào để hiển thị.'}
              </Text>
            </View>
          )
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
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
    paddingVertical: 5,
    borderRadius: 5,
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
    marginTop: 150,
    paddingTop: 10,
  },
  imageGrid: {
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  imageContainer: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 2,
    paddingTop: 0,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 3,
  },
  imageTitle: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  noLevelsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    flex: 1,
  },
  noUnitsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default StartersScreen;