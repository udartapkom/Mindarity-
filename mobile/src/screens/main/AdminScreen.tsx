import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Text,
  Button,
  Chip,
  Searchbar,
  IconButton,
  Menu,
  List,
  Switch,
  useTheme,
  DataTable,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { User, Session, SecurityAlert } from '../../services/api';
import api from '../../services/api';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../contexts/AuthContext';

const AdminScreen: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'users' | 'sessions' | 'security'>('users');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const theme = useTheme();

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [usersData, sessionsData, alertsData] = await Promise.all([
        api.getUsers(),
        api.getSessions(),
        api.getSecurityAlerts(),
      ]);
      setUsers(usersData);
      setSessions(sessionsData);
      setSecurityAlerts(alertsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
      Toast.show({
        type: 'error',
        text1: 'Ошибка',
        text2: 'Не удалось загрузить данные',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUserStatusChange = async (userId: string, isActive: boolean) => {
    try {
      await api.updateUserStatus(userId, isActive);
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isActive } : user
      ));
      Toast.show({
        type: 'success',
        text1: 'Успешно',
        text2: `Статус пользователя изменен на ${isActive ? 'активный' : 'неактивный'}`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Ошибка',
        text2: 'Не удалось изменить статус пользователя',
      });
    }
  };

  const handleResetPassword = async (userId: string) => {
    Alert.alert(
      'Сброс пароля',
      'Вы уверены, что хотите сбросить пароль для этого пользователя?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Сбросить',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.resetUserPassword(userId);
              Toast.show({
                type: 'success',
                text1: 'Успешно',
                text2: 'Пароль пользователя сброшен',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: 'Не удалось сбросить пароль',
              });
            }
          },
        },
      ]
    );
  };

  const handleTerminateSession = async (sessionId: string) => {
    Alert.alert(
      'Завершение сессии',
      'Вы уверены, что хотите завершить эту сессию?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Завершить',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.terminateSession(sessionId);
              setSessions(sessions.filter(session => session.id !== sessionId));
              Toast.show({
                type: 'success',
                text1: 'Успешно',
                text2: 'Сессия завершена',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: 'Не удалось завершить сессию',
              });
            }
          },
        },
      ]
    );
  };

  const handleTerminateAllOtherSessions = async () => {
    Alert.alert(
      'Завершение всех сессий',
      'Вы уверены, что хотите завершить все другие сессии?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Завершить все',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.terminateAllOtherSessions();
              setSessions(sessions.filter(session => session.isCurrent));
              Toast.show({
                type: 'success',
                text1: 'Успешно',
                text2: 'Все другие сессии завершены',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: 'Не удалось завершить сессии',
              });
            }
          },
        },
      ]
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
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

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'Критично';
      case 'high':
        return 'Высоко';
      case 'medium':
        return 'Средне';
      case 'low':
        return 'Низко';
      default:
        return severity;
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <Card style={styles.itemCard} key={item.id}>
      <Card.Content>
        <View style={styles.itemHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.username}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <View style={styles.userMeta}>
              <Chip mode="outlined" style={styles.roleChip}>
                {item.role}
              </Chip>
              <Chip
                mode="outlined"
                style={[
                  styles.statusChip,
                  { borderColor: item.isActive ? '#4caf50' : '#f44336' }
                ]}
                textStyle={{ color: item.isActive ? '#4caf50' : '#f44336' }}
              >
                {item.isActive ? 'Активен' : 'Неактивен'}
              </Chip>
            </View>
          </View>
          <Menu
            visible={menuVisible === item.id}
            onDismiss={() => setMenuVisible(null)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(item.id)}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                handleUserStatusChange(item.id, !item.isActive);
              }}
              title={item.isActive ? 'Деактивировать' : 'Активировать'}
              leadingIcon={item.isActive ? 'block' : 'check-circle'}
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                handleResetPassword(item.id);
              }}
              title="Сбросить пароль"
              leadingIcon="lock-reset"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                // Навигация к деталям пользователя
              }}
              title="Детали"
              leadingIcon="info"
            />
          </Menu>
        </View>
      </Card.Content>
    </Card>
  );

  const renderSessionItem = ({ item }: { item: Session }) => (
    <Card style={styles.itemCard} key={item.id}>
      <Card.Content>
        <View style={styles.itemHeader}>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionDevice}>{item.device}</Text>
            <Text style={styles.sessionIp}>{item.ipAddress}</Text>
            <Text style={styles.sessionTime}>
              Последняя активность: {new Date(item.lastActivity).toLocaleString()}
            </Text>
            {item.isCurrent && (
              <Chip mode="outlined" style={styles.currentSessionChip}>
                Текущая сессия
              </Chip>
            )}
          </View>
          {!item.isCurrent && (
            <Button
              mode="outlined"
              onPress={() => handleTerminateSession(item.id)}
              icon="close"
              textColor="#f44336"
            >
              Завершить
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const renderSecurityAlertItem = ({ item }: { item: SecurityAlert }) => (
    <Card style={styles.itemCard} key={item.id}>
      <Card.Content>
        <View style={styles.itemHeader}>
          <View style={styles.alertInfo}>
            <Text style={styles.alertType}>{item.type}</Text>
            <Text style={styles.alertMessage}>{item.message}</Text>
            <Text style={styles.alertTime}>
              {new Date(item.timestamp).toLocaleString()}
            </Text>
            <View style={styles.alertMeta}>
              <Chip
                mode="outlined"
                style={[
                  styles.severityChip,
                  { borderColor: getSeverityColor(item.severity) }
                ]}
                textStyle={{ color: getSeverityColor(item.severity) }}
              >
                {getSeverityLabel(item.severity)}
              </Chip>
              <Chip
                mode="outlined"
                style={[
                  styles.resolvedChip,
                  { borderColor: item.resolved ? '#4caf50' : '#f44336' }
                ]}
                textStyle={{ color: item.resolved ? '#4caf50' : '#f44336' }}
              >
                {item.resolved ? 'Решено' : 'Не решено'}
              </Chip>
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if (user?.role !== 'admin') {
    return (
      <View style={styles.accessDeniedContainer}>
        <Icon name="security" size={64} color="#f44336" />
        <Text style={styles.accessDeniedText}>Доступ запрещен</Text>
        <Text style={styles.accessDeniedSubtext}>
          У вас нет прав для доступа к этой странице
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Панель администратора</Title>
        
        <View style={styles.tabContainer}>
          <Button
            mode={selectedTab === 'users' ? 'contained' : 'outlined'}
            onPress={() => setSelectedTab('users')}
            style={styles.tabButton}
          >
            Пользователи ({users.length})
          </Button>
          <Button
            mode={selectedTab === 'sessions' ? 'contained' : 'outlined'}
            onPress={() => setSelectedTab('sessions')}
            style={styles.tabButton}
          >
            Сессии ({sessions.length})
          </Button>
          <Button
            mode={selectedTab === 'security' ? 'contained' : 'outlined'}
            onPress={() => setSelectedTab('security')}
            style={styles.tabButton}
          >
            Безопасность ({securityAlerts.length})
          </Button>
        </View>
      </View>

      {selectedTab === 'users' && (
        <View style={styles.tabContent}>
          <Searchbar
            placeholder="Поиск пользователей..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
          
          <FlatList
            data={users.filter(user =>
              user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
              user.email.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        </View>
      )}

      {selectedTab === 'sessions' && (
        <View style={styles.tabContent}>
          <View style={styles.sessionActions}>
            <Button
              mode="contained"
              onPress={handleTerminateAllOtherSessions}
              icon="logout"
              style={styles.sessionActionButton}
            >
              Завершить все другие сессии
            </Button>
          </View>
          
          <FlatList
            data={sessions}
            renderItem={renderSessionItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        </View>
      )}

      {selectedTab === 'security' && (
        <View style={styles.tabContent}>
          <FlatList
            data={securityAlerts}
            renderItem={renderSecurityAlertItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  accessDeniedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f44336',
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1976d2',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  sessionActions: {
    padding: 16,
  },
  sessionActionButton: {
    marginBottom: 8,
  },
  listContainer: {
    padding: 16,
  },
  itemCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  roleChip: {
    height: 24,
  },
  statusChip: {
    height: 24,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDevice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sessionIp: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  currentSessionChip: {
    height: 24,
    borderColor: '#4caf50',
  },
  alertInfo: {
    flex: 1,
  },
  alertType: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  alertMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  severityChip: {
    height: 24,
  },
  resolvedChip: {
    height: 24,
  },
});

export default AdminScreen;
