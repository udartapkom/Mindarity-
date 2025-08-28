import React from 'react';
import {
  View,
  StyleSheet,
  Image,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
  Avatar,
  Text,
  Divider,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface CustomDrawerContentProps {
  state: any;
  navigation: any;
  descriptors: any;
}

const CustomDrawerContent: React.FC<CustomDrawerContentProps> = (props) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#f44336';
      case 'high':
        return '#ff9800';
      case 'medium':
        return '#ffc107';
      case 'low':
        return '#4caf50';
      default:
        return '#9e9e9e';
    }
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props}>
        <View style={styles.header}>
          <Avatar.Image
            size={80}
            source={
              user?.avatar
                ? { uri: user.avatar }
                : require('../../assets/default-avatar.png')
            }
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.username || 'Пользователь'}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.roleContainer}>
              <Text style={styles.roleText}>{user?.role}</Text>
            </View>
          </View>
        </View>

        <Divider style={styles.divider} />

        <DrawerItemList {...props} />

        <Divider style={styles.divider} />

        <DrawerItem
          icon={({ color, size }) => (
            <Icon name="person" color={color} size={size} />
          )}
          label="Профиль"
          onPress={() => props.navigation.navigate('Profile')}
        />

        {user?.role === 'admin' && (
          <DrawerItem
            icon={({ color, size }) => (
              <Icon name="admin-panel-settings" color={color} size={size} />
            )}
            label="Администрирование"
            onPress={() => props.navigation.navigate('Admin')}
          />
        )}

        <Divider style={styles.divider} />

        <DrawerItem
          icon={({ color, size }) => (
            <Icon name="logout" color={color} size={size} />
          )}
          label="Выйти"
          onPress={handleLogout}
        />
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Mindarity v1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  avatar: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  roleContainer: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  divider: {
    marginVertical: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default CustomDrawerContent;
