/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './src/assets/App'; // Cập nhật đường dẫn
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
