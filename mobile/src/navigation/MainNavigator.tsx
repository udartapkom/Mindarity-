import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import DashboardScreen from '../screens/main/DashboardScreen';
import EventsScreen from '../screens/main/EventsScreen';
import GoalsScreen from '../screens/main/GoalsScreen';
import TasksScreen from '../screens/main/TasksScreen';
import FilesScreen from '../screens/main/FilesScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import AdminScreen from '../screens/main/AdminScreen';
import CustomDrawerContent from '../components/CustomDrawerContent';

export type MainStackParamList = {
  Dashboard: undefined;
  Events: undefined;
  Goals: undefined;
  Tasks: undefined;
  Files: undefined;
  Profile: undefined;
  Admin: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Events: undefined;
  Goals: undefined;
  Tasks: undefined;
  Files: undefined;
};

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<MainStackParamList>();

const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Events':
              iconName = 'event';
              break;
            case 'Goals':
              iconName = 'flag';
              break;
            case 'Tasks':
              iconName = 'assignment';
              break;
            case 'Files':
              iconName = 'folder';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Files" component={FilesScreen} />
    </Tab.Navigator>
  );
};

const MainNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#fff',
          width: 280,
        },
      }}
    >
      <Drawer.Screen name="MainTabs" component={TabNavigator} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Admin" component={AdminScreen} />
    </Drawer.Navigator>
  );
};

export default MainNavigator;
