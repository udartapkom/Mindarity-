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
  FAB,
  Searchbar,
  IconButton,
  Menu,
  ProgressBar,
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Goal } from '../../services/api';
import api from '../../services/api';
import Toast from 'react-native-toast-message';

const GoalsScreen: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const theme = useTheme();

  useEffect(() => {
    loadGoals();
  }, []);

  useEffect(() => {
    filterGoals();
  }, [goals, searchQuery, selectedStatus, selectedPriority]);

  const loadGoals = async () => {
    try {
      const data = await api.getGoals();
      setGoals(data);
    } catch (error) {
      console.error('Error loading goals:', error);
      Toast.show({
        type: 'error',
        text1: 'Ошибка',
        text2: 'Не удалось загрузить цели',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGoals();
    setRefreshing(false);
  };

  const filterGoals = () => {
    let filtered = goals;

    // Фильтр по поиску
    if (searchQuery.trim()) {
      filtered = filtered.filter(goal =>
        goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (goal.description && goal.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Фильтр по статусу
    if (selectedStatus) {
      filtered = filtered.filter(goal => goal.status === selectedStatus);
    }

    // Фильтр по приоритету
    if (selectedPriority) {
      filtered = filtered.filter(goal => goal.priority === selectedPriority);
    }

    setFilteredGoals(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return '#9e9e9e';
      case 'in_progress':
        return '#1976d2';
      case 'completed':
        return '#4caf50';
      case 'on_hold':
        return '#ff9800';
      case 'cancelled':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'Не начато';
      case 'in_progress':
        return 'В процессе';
      case 'completed':
        return 'Завершено';
      case 'on_hold':
        return 'Приостановлено';
      case 'cancelled':
        return 'Отменено';
      default:
        return status;
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

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Срочно';
      case 'high':
        return 'Высокий';
      case 'medium':
        return 'Средний';
      case 'low':
        return 'Низкий';
      default:
        return priority;
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    Alert.alert(
      'Удаление цели',
      'Вы уверены, что хотите удалить эту цель?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteGoal(goalId);
              setGoals(goals.filter(goal => goal.id !== goalId));
              Toast.show({
                type: 'success',
                text1: 'Успешно',
                text2: 'Цель удалена',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: 'Не удалось удалить цель',
              });
            }
          },
        },
      ]
    );
  };

  const renderGoalItem = ({ item }: { item: Goal }) => (
    <Card style={styles.goalCard} key={item.id}>
      <Card.Content>
        <View style={styles.goalHeader}>
          <View style={styles.goalStatusContainer}>
            <Chip
              mode="outlined"
              textStyle={{ color: getStatusColor(item.status) }}
              style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
            >
              {getStatusLabel(item.status)}
            </Chip>
            <Chip
              mode="outlined"
              textStyle={{ color: getPriorityColor(item.priority) }}
              style={[styles.priorityChip, { borderColor: getPriorityColor(item.priority) }]}
            >
              {getPriorityLabel(item.priority)}
            </Chip>
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
                // Навигация к редактированию
              }}
              title="Редактировать"
              leadingIcon="pencil"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                handleDeleteGoal(item.id);
              }}
              title="Удалить"
              leadingIcon="delete"
            />
          </Menu>
        </View>

        <Title style={styles.goalTitle}>{item.title}</Title>
        {item.description && (
          <Paragraph style={styles.goalDescription} numberOfLines={3}>
            {item.description}
          </Paragraph>
        )}

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>Прогресс</Text>
            <Text style={styles.progressPercent}>{item.progress}%</Text>
          </View>
          <ProgressBar
            progress={item.progress / 100}
            color={getStatusColor(item.status)}
            style={styles.progressBar}
          />
        </View>

        <View style={styles.goalMeta}>
          {item.startDate && (
            <View style={styles.metaItem}>
              <Icon name="play-arrow" size={16} color="#666" />
              <Text style={styles.metaText}>
                Начало: {new Date(item.startDate).toLocaleDateString()}
              </Text>
            </View>
          )}
          {item.deadline && (
            <View style={styles.metaItem}>
              <Icon name="schedule" size={16} color="#666" />
              <Text style={styles.metaText}>
                Дедлайн: {new Date(item.deadline).toLocaleDateString()}
              </Text>
            </View>
          )}
          {item.completedDate && (
            <View style={styles.metaItem}>
              <Icon name="check-circle" size={16} color="#4caf50" />
              <Text style={styles.metaText}>
                Завершено: {new Date(item.completedDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <Chip key={index} style={styles.tag} textStyle={styles.tagText}>
                {tag}
              </Chip>
            ))}
            {item.tags.length > 3 && (
              <Text style={styles.moreTags}>+{item.tags.length - 3}</Text>
            )}
          </View>
        )}

        <View style={styles.goalActions}>
          <Button
            mode="outlined"
            onPress={() => {/* Навигация к задачам цели */}}
            style={styles.actionButton}
          >
            Задачи
          </Button>
          <Button
            mode="outlined"
            onPress={() => {/* Навигация к редактированию */}}
            style={styles.actionButton}
          >
            Редактировать
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const goalStatuses = [
    { key: 'not_started', label: 'Не начато' },
    { key: 'in_progress', label: 'В процессе' },
    { key: 'completed', label: 'Завершено' },
    { key: 'on_hold', label: 'Приостановлено' },
    { key: 'cancelled', label: 'Отменено' },
  ];

  const goalPriorities = [
    { key: 'urgent', label: 'Срочно' },
    { key: 'high', label: 'Высокий' },
    { key: 'medium', label: 'Средний' },
    { key: 'low', label: 'Низкий' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Поиск целей..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          <Chip
            selected={selectedStatus === null}
            onPress={() => setSelectedStatus(null)}
            style={styles.filterChip}
          >
            Все статусы
          </Chip>
          {goalStatuses.map(status => (
            <Chip
              key={status.key}
              selected={selectedStatus === status.key}
              onPress={() => setSelectedStatus(selectedStatus === status.key ? null : status.key)}
              style={styles.filterChip}
            >
              {status.label}
            </Chip>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          <Chip
            selected={selectedPriority === null}
            onPress={() => setSelectedPriority(null)}
            style={styles.filterChip}
          >
            Все приоритеты
          </Chip>
          {goalPriorities.map(priority => (
            <Chip
              key={priority.key}
              selected={selectedPriority === priority.key}
              onPress={() => setSelectedPriority(selectedPriority === priority.key ? null : priority.key)}
              style={styles.filterChip}
            >
              {priority.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredGoals}
        renderItem={renderGoalItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.goalsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="flag" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery || selectedStatus || selectedPriority ? 'Цели не найдены' : 'Целей пока нет'}
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // Навигация к созданию цели
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    marginBottom: 16,
    elevation: 2,
  },
  filters: {
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  goalsList: {
    padding: 16,
  },
  goalCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalStatusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    height: 24,
  },
  priorityChip: {
    height: 24,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  goalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  goalMeta: {
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    height: 24,
  },
  tagText: {
    fontSize: 12,
  },
  moreTags: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'center',
    marginLeft: 8,
  },
  goalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default GoalsScreen;
