import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity, // Import TouchableOpacity for the back button
    Image,          // Import Image for the back icon
    SafeAreaView    // Import SafeAreaView for proper layout on all devices
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import TouchableScale from 'react-native-touchable-scale';
import { BASE_URL } from '../../utils/constants';

// Import your back icon image
// Make sure you have an image file at this path, e.g., 'back.png' in an 'assets' folder
const BackIcon = require('../../images/login_signup/back.png'); // Adjust this path to your actual back icon image

const QuestionTypeListScreen = () => {
    const [types, setTypes] = useState([]);
    const navigation = useNavigation();

    useEffect(() => {
        axios
            .get(`${BASE_URL}/questiontypes`)
            .then((res) => setTypes(res.data))
            .catch((err) => console.error('Lỗi khi lấy loại câu hỏi:', err));
    }, []);

    const handleSelectType = (item) => {
        navigation.navigate('TestSelectorScreen', {
            questionTypeId: item.type_id,
            questionTypeName: item.type_name,
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header Group */}
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Image source={BackIcon} style={styles.backIcon} />
                </TouchableOpacity>
                <Text style={styles.header}>Chọn thể loại câu hỏi</Text>
            </View>
            {/* End Header Group */}

            <FlatList
                data={types}
                keyExtractor={(item) => item.type_id.toString()}
                renderItem={({ item }) => (
                    <TouchableScale
                        activeScale={0.96}
                        tension={80}
                        friction={7}
                        useNativeDriver
                        onPress={() => handleSelectType(item)}
                        style={styles.typeItem}
                    >
                        <Text style={styles.typeText}>{item.type_name}</Text>
                    </TouchableScale>
                )}
                contentContainerStyle={styles.listContainer}
            />
        </SafeAreaView>
    );
};

export default QuestionTypeListScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#E0E5FF', // Matches original container background
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Centers the text initially
        paddingTop: 40, // Retain original padding for the header area
        paddingBottom: 20, // Add some bottom padding for separation
        paddingHorizontal: 20, // Retain original padding
        backgroundColor: '#fff', // Ensure header background matches container
        // Optional: add a subtle bottom border if desired, similar to LevelScreen
        // borderBottomWidth: 1,
        // borderBottomColor: '#ccc',
    },
    backButton: {
        position: 'absolute', // Position absolutely to allow text to center
        left: 20, // Align with the horizontal padding
        top: 40, // Align with paddingTop of headerContainer
        padding: 5, // Add some padding for easier touch
        zIndex: 1, // Ensure the button is clickable on top of other elements
    },
    backIcon: {
        width: 24, // Size of your back icon
        height: 24, // Size of your back icon
        tintColor: '#000', // Color of your icon, match text color if needed
    },
    header: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        color: '#000',
        // marginBottom removed here as paddingBottom is on headerContainer
        flex: 1, // Allows the text to take up available space and truly center
    },
    listContainer: {
      marginTop:20,
        paddingHorizontal: 20, // Retain original horizontal padding for FlatList items
        paddingBottom: 20,
    },
    typeItem: {
        backgroundColor: '#ffffff',
        paddingVertical: 18,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 12,
        // Existing shadows from your LevelScreen can be added here if you want it to look exactly like a card.
        // shadowColor: '#000',
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.1,
        // shadowRadius: 3,
        // elevation: 2,
    },
    typeText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
});