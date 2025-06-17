import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const ContactSupportScreen = () => {
  const navigation = useNavigation();

  const handleMailPress = () => {
    Linking.openURL('mailto:enviet.mediavn@gmail.com');
  };

  const handleFacebookPress = () => {
    Linking.openURL('https://www.facebook.com/enviet.media');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={require('../images/login_signup/back.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liên hệ/ Hỗ trợ</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.card} onPress={handleMailPress}>
          <View style={styles.iconContainer}>
            <Image source={require('../images/contact/mail.png')} style={styles.icon} />
          </View>
          <Text style={styles.cardText}>Mail</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={handleFacebookPress}>
          <View style={styles.iconContainer}>
            <Image source={require('../images/contact/facebook.png')} style={styles.icon} />
          </View>
          <Text style={styles.cardText}>Facebook</Text>
        </TouchableOpacity>

        <View style={styles.companyInfoContainer}>
          <Text style={styles.companyTitle}>CÔNG TY TRUYỀN THÔNG & TỔ CHỨC SỰ KIỆN ÉN VIỆT</Text>
          <Text style={styles.companyText}>MSDN: 3703209963.</Text>
          <Text style={styles.companyText}>Địa chỉ liên hệ: Số 11, Đường D3, Khu Dân Cư K8, Phường Hiệp Thành, Thành phố Thủ Dầu Một, Tỉnh Bình Dương, Việt Nam.</Text>
          <Text style={styles.companyText}>Địa chỉ kinh doanh: Số 11, Đường D3, Khu Dân Cư K8, Phường Hiệp Thành, Thành phố Thủ Dầu Một, Tỉnh Bình Dương, Việt Nam.</Text>
          <Text style={styles.companyText}>Trụ sở: Số 11, Đường D3, Khu Dân Cư K8, Phường Hiệp Thành, Thành phố Thủ Dầu Một, Tỉnh Bình Dương, Việt Nam.</Text>
         
          <View style={styles.logosRow}>
            <Image source={require('../images/contact/logo_1.jpg')} style={styles.logo} />
            <Image source={require('../images/contact/logo_2.jpg')} style={styles.logo} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#E0E5FF' 
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
        padding: 15 
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
    },
    iconContainer: {
        width: 35,
        height: 35,
        borderRadius: 17,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    icon: { 
        width: 20, 
        height: 20, 
        tintColor: '#333' 
    },
    cardText: { 
        fontSize: 16, 
        color: '#333', 
        fontWeight: '500' 
    },
    companyInfoContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginTop: 10,
    },
    companyTitle: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#1C2B33', 
        marginBottom: 10 
    },
    companyText: { 
        fontSize: 14, 
        color: '#555', 
        marginBottom: 5 
    },
    logosRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        marginTop: 15 
    },
    logo: { 
        width: 150, 
        height: 125, 
        resizeMode: 'contain' 
    },
});

export default ContactSupportScreen;
