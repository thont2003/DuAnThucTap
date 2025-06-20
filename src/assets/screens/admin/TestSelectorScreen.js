import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import TouchableScale from 'react-native-touchable-scale';

const BackIcon = require('../../images/login_signup/back.png');

const API = 'http://192.168.1.53:3000';

const TestSelectorScreen = () => {
  const navigation = useNavigation();
  const { questionTypeId, questionTypeName } = useRoute().params;

  const [levels, setLevels] = useState([]);
  const [units, setUnits] = useState([]);
  const [tests, setTests] = useState([]);
  const [level, setLevel] = useState('');
  const [unit, setUnit] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API}/levels`)
      .then((r) => {
        setLevels(r.data);
        if (r.data.length > 0 && !level) {
          setLevel(r.data[0].level_id); // Auto-select the first level
        }
      })
      .catch(err => {
        console.error('Lỗi khi tải levels:', err);
        Alert.alert('Lỗi', 'Không thể tải danh sách Level. Vui lòng thử lại.');
      });
  }, []);

  useEffect(() => {
    if (level) {
      setUnit('');
      setTests([]);
      axios.get(`${API}/units/by-level/${level}`) // Check this endpoint with your backend
        .then((r) => {
          setUnits(r.data);
          if (r.data.length > 0) {
            setUnit(r.data[0].unit_id);
          } else {
            setUnit('');
          }
        })
        .catch(err => {
          console.error('Lỗi khi tải units:', err);
          Alert.alert('Lỗi', 'Không thể tải danh sách Unit cho Level này.');
          setUnits([]);
          setUnit('');
        });
    } else {
      setUnits([]);
      setTests([]);
    }
  }, [level]);

  useEffect(() => {
    if (level && unit) {
      setLoading(true);
      axios
        .get(`${API}/tests`, { params: { level_id: level, unit_id: unit, type_id: questionTypeId } })
        .then((r) => setTests(r.data))
        .catch((err) => {
          console.error('Lỗi khi tải tests:', err);
          setTests([]);
          Alert.alert('Lỗi', 'Không thể tải bài test cho lựa chọn này. Vui lòng kiểm tra lại kết nối hoặc dữ liệu.');
        })
        .finally(() => setLoading(false));
    } else {
      setTests([]);
    }
  }, [level, unit, questionTypeId]);

  const chooseTest = (test) => {
    // REVERTED: Changed back to 'QuestionListScreen' as per your original code's implied route name
    navigation.navigate('QuestionListScreen', {
      testId: test.test_id,
      questionTypeId: questionTypeId,
      testTitle: test.title,
      questionTypeName: questionTypeName,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Image source={BackIcon} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{questionTypeName}</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <View style={styles.contentWrapper}>
    

        <Text style={styles.label}>Level</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={level}
            onValueChange={(itemValue) => setLevel(itemValue)}
            style={styles.picker}
            mode="dropdown"
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="-- Chọn Level --" value="" />
            {levels.map((l) => (
              <Picker.Item key={l.level_id} label={l.name} value={l.level_id} />
            ))}
          </Picker>
        </View>

        {level ? (
          <>
            <Text style={styles.label}>Unit</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={unit}
                onValueChange={(itemValue) => setUnit(itemValue)}
                style={styles.picker}
                mode="dropdown"
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="-- Chọn Unit --" value="" />
                {units.map((u) => (
                  <Picker.Item key={u.unit_id} label={u.title} value={u.unit_id} />
                ))}
              </Picker>
            </View>
          </>
        ) : null}

        {loading ? (
          <ActivityIndicator style={styles.activityIndicator} size="large" color="#4caf50" />
        ) : (
          <FlatList
            data={tests}
            keyExtractor={(item) => item.test_id.toString()}
            renderItem={({ item }) => (
              <TouchableScale
                activeScale={0.96}
                tension={80}
                friction={7}
                useNativeDriver
                onPress={() => chooseTest(item)}
                style={styles.testItem}
              >
                <Image
                  source={{ uri: `${API}${item.image_url}` }}
                  style={styles.image}
                  onError={(e) => console.log('Image loading error for:', item.image_url, e.nativeEvent.error)}
                />
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.count}>{item.play_count} lượt chơi</Text>
              </TouchableScale>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyTestListContainer}>
                {level && unit ? (
                  <Text style={styles.empty}>Không có bài test nào phù hợp với lựa chọn này.</Text>
                ) : (
                  <Text style={styles.empty}>Vui lòng chọn Level và Unit.</Text>
                )}
              </View>
            )}
            contentContainerStyle={styles.testListContent}
          />
        )}
      </View>
    </View>
  );
};

export default TestSelectorScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0E5FF',
    paddingTop: 0,
  },
  header: {
    justifyContent: 'center', // Centers the text initially
        paddingTop: 40, // Retain original padding for the header area
        paddingBottom: 20, // Add some bottom padding for separation
        backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 0,
  },
  backButton: {
    padding: 5,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#333',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 30,
  },
  contentWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: 10,
    flex: 1,
  },
  subHeader: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
    color: '#333',
  },
  pickerWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    height: 60,
    justifyContent: 'center',
  },
  picker: {
    height: '100%',
    width: '100%',
    color: '#34495e',
  },
  pickerItem: {
    height: 50,
  },
  testListContent: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  testItem: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2e7d32',
  },
  count: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  activityIndicator: {
    marginTop: 30,
    marginBottom: 20,
  },
  emptyTestListContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    fontSize: 15,
  },
});