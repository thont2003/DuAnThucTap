import { StyleSheet } from 'react-native';
import globalStyles from './globalStyles';

export default StyleSheet.create({
  ...globalStyles,
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  loginText: {
    marginTop: 20,
    textAlign: 'center',
  },
  loginLink: {
    color: 'blue',
    fontWeight: 'bold',
  },
});