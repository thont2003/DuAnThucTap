import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import homeStyles from '../styles/homeStyles';

const HomeScreen = ({ route }) => {
  const { username } = route.params || { username: 'Guest' };
  const navigation = useNavigation();

  const categoryImages = [
    { image: require('../images/Starters.png') },
    { image: require('../images/Movers.png') },
    { image: require('../images/Flyers.png') },
    { image: require('../images/Grammar.png') },
  ];

  const navItems = [
    { label: 'Home', icon: require('../images/homeblue-icon.png'), route: 'Home' },
    { label: 'History', icon: require('../images/history-icon.png'), route: 'History' },
    { label: 'Ranking', icon: require('../images/ranking-icon.png'), route: 'Ranking' },
    { label: 'Account', icon: require('../images/account-icon.png'), route: 'Account' },
  ];

  return (
    <View style={homeStyles.container}>
      <View style={homeStyles.header}>
        <Image source={require('../images/avatar.png')} style={homeStyles.avatar} />
        <Text style={homeStyles.greeting}>Hello, {username}</Text>
      </View>
      <Image source={require('../images/banner.png')} style={homeStyles.banner} />
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginVertical: 10, marginLeft: 10 }}>
        Categories
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 10, paddingBottom: 80 }}>
        {categoryImages.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={{
              width: '48%',
              height: 100,
              marginBottom: 10,
            }}
            onPress={() => {
              if (index === 0) navigation.navigate('Starters'); // Điều hướng khi nhấn Starters
            }}
          >
            <View
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: 10,
                justifyContent: 'center',
                alignItems: 'center',
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
              }}
            >
              <Image
                source={item.image}
                style={{ width: '90%', height: '90%', resizeMode: 'contain' }}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
      {/* Thanh nav dưới cùng */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          flexDirection: 'row',
          justifyContent: 'space-around',
          backgroundColor: '#FFFFFF',
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: '#DDD',
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          height: 60,
        }}
      >
        {navItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => navigation.navigate(item.route)} // Điều hướng khi nhấn tab
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              padding: 5,
            }}
          >
            <Image
              source={item.icon}
              style={{ width: 24, height: 24, marginBottom: 5 }}
            />
            <Text style={{ fontSize: 12, color: '#333' }}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default HomeScreen;