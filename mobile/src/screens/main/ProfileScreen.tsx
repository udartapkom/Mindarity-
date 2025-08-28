import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Text,
  Button,
  TextInput,
  Avatar,
  Divider,
  List,
  Switch,
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import Toast from 'react-native-toast-message';

const ProfileScreen: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: user?.bio || '',
  });

  const theme = useTheme();

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!formData.firstName.trim()) {
      Alert.alert('Ошибка', 'Имя обязательно для заполнения');
      return;
    }

    setIsLoading(true);
    try {
      await updateUser(formData);
      setIsEditing(false);
      Toast.show({
        type: 'success',
        text1: 'Успешно',
        text2: 'Профиль обновлен',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Ошибка',
        text2: 'Не удалось обновить профиль',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      bio: user?.bio || '',
    });
    setIsEditing(false);
  };

  const handleAvatarUpload = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 512,
        maxHeight: 512,
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setIsLoading(true);

        try {
          await api.uploadAvatar(file);
          Toast.show({
            type: 'success',
            text1: 'Успешно',
            text2: 'Аватар обновлен',
          });
          // Перезагружаем профиль пользователя
          const updatedProfile = await api.getProfile();
          updateUser(updatedProfile);
        } catch (error) {
          Toast.show({
            type: 'error',
            text1: 'Ошибка',
            text2: 'Не удалось обновить аватар',
          });
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти из аккаунта?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'inactive':
        return '#f44336';
      case 'pending':
        return '#ff9800';
      default:
        return '#9e9e9e';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активен';
      case 'inactive':
        return 'Неактивен';
      case 'pending':
        return 'Ожидает подтверждения';
      default:
        return status;
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Загрузка профиля...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Заголовок профиля */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Avatar.Image
            size={120}
            source={
              user.avatar
                ? { uri: user.avatar }
                : require('../../../assets/default-avatar.png')
            }
            style={styles.avatar}
          />
          <Button
            mode="outlined"
            onPress={handleAvatarUpload}
            style={styles.avatarButton}
            disabled={isLoading}
            icon="camera-alt"
          >
            Изменить
          </Button>
        </View>

        <View style={styles.userInfo}>
          <Title style={styles.userName}>
            {user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.username}
          </Title>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(user.status) }]} />
            <Text style={styles.statusText}>{getStatusLabel(user.status)}</Text>
          </View>
        </View>
      </View>

      {/* Основная информация */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.cardTitle}>Основная информация</Title>
            <Button
              mode="text"
              onPress={() => setIsEditing(!isEditing)}
              icon={isEditing ? 'close' : 'edit'}
            >
              {isEditing ? 'Отмена' : 'Редактировать'}
            </Button>
          </View>

          <Divider style={styles.divider} />

          {isEditing ? (
            <View style={styles.editForm}>
              <TextInput
                label="Имя"
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Фамилия"
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="О себе"
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                mode="outlined"
                style={styles.input}
                multiline
                numberOfLines={3}
              />
              
              <View style={styles.editActions}>
                <Button
                  mode="outlined"
                  onPress={handleCancel}
                  style={styles.editButton}
                  disabled={isLoading}
                >
                  Отмена
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSave}
                  style={styles.editButton}
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Сохранить
                </Button>
              </View>
            </View>
          ) : (
            <View style={styles.infoDisplay}>
              <View style={styles.infoRow}>
                <Icon name="person" size={20} color="#666" />
                <Text style={styles.infoLabel}>Имя:</Text>
                <Text style={styles.infoValue}>{user.firstName || 'Не указано'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="person" size={20} color="#666" />
                <Text style={styles.infoLabel}>Фамилия:</Text>
                <Text style={styles.infoValue}>{user.lastName || 'Не указано'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="account-circle" size={20} color="#666" />
                <Text style={styles.infoLabel}>Имя пользователя:</Text>
                <Text style={styles.infoValue}>{user.username}</Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="email" size={20} color="#666" />
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="security" size={20} color="#666" />
                <Text style={styles.infoLabel}>Роль:</Text>
                <Text style={styles.infoValue}>{user.role}</Text>
              </View>
              {user.bio && (
                <View style={styles.infoRow}>
                  <Icon name="info" size={20} color="#666" />
                  <Text style={styles.infoLabel}>О себе:</Text>
                  <Text style={styles.infoValue}>{user.bio}</Text>
                </View>
              )}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Статистика */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Статистика аккаунта</Title>
          <Divider style={styles.divider} />
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name="event" size={24} color="#1976d2" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Событий</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="flag" size={24} color="#4caf50" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Целей</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="assignment" size={24} color="#ff9800" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Задач</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="folder" size={24} color="#9c27b0" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Файлов</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Настройки */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Настройки</Title>
          <Divider style={styles.divider} />
          
          <List.Item
            title="Уведомления"
            description="Настройки уведомлений"
            left={(props) => <List.Icon {...props} icon="notifications" />}
            right={() => <Switch value={true} onValueChange={() => {}} />}
            onPress={() => {/* Навигация к настройкам уведомлений */}}
          />
          
          <List.Item
            title="Безопасность"
            description="Настройки безопасности"
            left={(props) => <List.Icon {...props} icon="security" />}
            onPress={() => {/* Навигация к настройкам безопасности */}}
          />
          
          <List.Item
            title="Приватность"
            description="Настройки приватности"
            left={(props) => <List.Icon {...props} icon="privacy-tip" />}
            onPress={() => {/* Навигация к настройкам приватности */}}
          />
          
          <List.Item
            title="Язык"
            description="Русский"
            left={(props) => <List.Icon {...props} icon="language" />}
            onPress={() => {/* Навигация к выбору языка */}}
          />
        </Card.Content>
      </Card>

      {/* Действия */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Действия</Title>
          <Divider style={styles.divider} />
          
          <Button
            mode="outlined"
            onPress={() => {/* Навигация к смене пароля */}}
            style={styles.actionButton}
            icon="lock"
          >
            Сменить пароль
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => {/* Навигация к экспорту данных */}}
            style={styles.actionButton}
            icon="download"
          >
            Экспорт данных
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => {/* Навигация к удалению аккаунта */}}
            style={styles.actionButton}
            icon="delete-forever"
            textColor="#f44336"
          >
            Удалить аккаунт
          </Button>
          
          <Button
            mode="contained"
            onPress={handleLogout}
            style={[styles.actionButton, styles.logoutButton]}
            icon="logout"
            buttonColor="#f44336"
          >
            Выйти из аккаунта
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    marginBottom: 12,
  },
  avatarButton: {
    borderRadius: 20,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  card: {
    margin: 16,
    elevation: 2,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    marginBottom: 16,
  },
  editForm: {
    gap: 16,
  },
  input: {
    marginBottom: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
  },
  infoDisplay: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    minWidth: 100,
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionButton: {
    marginBottom: 12,
  },
  logoutButton: {
    marginTop: 8,
  },
});

export default ProfileScreen;
