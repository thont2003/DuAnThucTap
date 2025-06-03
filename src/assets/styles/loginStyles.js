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
  registerText: {
    marginTop: 20,
    textAlign: 'center',
  },
  registerLink: {
    color: 'blue',
    fontWeight: 'bold',
  },
});