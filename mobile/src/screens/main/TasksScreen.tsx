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
  Checkbox,
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Task, Goal } from '../../services/api';
import api from '../../services/api';
import Toast from 'react-native-toast-message';

const TasksScreen: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const theme = useTheme();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchQuery, selectedStatus, selectedPriority, selectedGoal]);

  const loadData = async () => {
    try {
      const [tasksData, goalsData] = await Promise.all([
        api.getTasks(''), // Получаем все задачи
        api.getGoals(),
      ]);
      setTasks(tasksData);
      setGoals(goalsData);
    } catch (error) {
      console.error('Error loading data:', error);
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

  const filterTasks = () => {
    let filtered = tasks;

    // Фильтр по поиску
    if (searchQuery.trim()) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Фильтр по статусу
    if (selectedStatus) {
      filtered = filtered.filter(task => task.status === selectedStatus);
    }

    // Фильтр по приоритету
    if (selectedPriority) {
      filtered = filtered.filter(task => task.priority === selectedPriority);
    }

    // Фильтр по цели
    if (selectedGoal) {
      filtered = filtered.filter(task => task.goalId === selectedGoal);
    }

    setFilteredTasks(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return '#9e9e9e';
      case 'in_progress':
        return '#1976d2';
      case 'review':
        return '#ff9800';
      case 'done':
        return '#4caf50';
      case 'cancelled':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo':
        return 'К выполнению';
      case 'in_progress':
        return 'В работе';
      case 'review':
        return 'На проверке';
      case 'done':
        return 'Выполнено';
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

  const getGoalTitle = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    return goal ? goal.title : 'Неизвестная цель';
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const updatedTask = await api.updateTask(taskId, { status: newStatus });
      setTasks(tasks.map(task => task.id === taskId ? updatedTask : task));
      Toast.show({
        type: 'success',
        text1: 'Успешно',
        text2: 'Статус задачи обновлен',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Ошибка',
        text2: 'Не удалось обновить статус',
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert(
      'Удаление задачи',
      'Вы уверены, что хотите удалить эту задачу?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteTask(taskId);
              setTasks(tasks.filter(task => task.id !== taskId));
              Toast.show({
                type: 'success',
                text1: 'Успешно',
                text2: 'Задача удалена',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: 'Не удалось удалить задачу',
              });
            }
          },
        },
      ]
    );
  };

  const renderTaskItem = ({ item }: { item: Task }) => (
    <Card style={styles.taskCard} key={item.id}>
      <Card.Content>
        <View style={styles.taskHeader}>
          <View style={styles.taskStatusContainer}>
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
                handleDeleteTask(item.id);
              }}
              title="Удалить"
              leadingIcon="delete"
            />
          </Menu>
        </View>

        <Title style={styles.taskTitle}>{item.title}</Title>
        {item.description && (
          <Paragraph style={styles.taskDescription} numberOfLines={3}>
            {item.description}
          </Paragraph>
        )}

        <View style={styles.taskMeta}>
          <View style={styles.metaItem}>
            <Icon name="flag" size={16} color="#666" />
            <Text style={styles.metaText}>
              Цель: {getGoalTitle(item.goalId)}
            </Text>
          </View>
          {item.dueDate && (
            <View style={styles.metaItem}>
              <Icon name="schedule" size={16} color="#666" />
              <Text style={styles.metaText}>
                Дедлайн: {new Date(item.dueDate).toLocaleDateString()}
              </Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Icon name="timer" size={16} color="#666" />
            <Text style={styles.metaText}>
              Оценка: {item.estimatedHours}ч / Факт: {item.actualHours}ч
            </Text>
          </View>
        </View>

        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Заметки:</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}

        <View style={styles.taskActions}>
          <Button
            mode="outlined"
            onPress={() => {/* Навигация к редактированию */}}
            style={styles.actionButton}
          >
            Редактировать
          </Button>
          {item.status !== 'done' && (
            <Button
              mode="contained"
              onPress={() => handleStatusChange(item.id, 'done')}
              style={styles.actionButton}
            >
              Завершить
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const taskStatuses = [
    { key: 'todo', label: 'К выполнению' },
    { key: 'in_progress', label: 'В работе' },
    { key: 'review', label: 'На проверке' },
    { key: 'done', label: 'Выполнено' },
    { key: 'cancelled', label: 'Отменено' },
  ];

  const taskPriorities = [
    { key: 'urgent', label: 'Срочно' },
    { key: 'high', label: 'Высокий' },
    { key: 'medium', label: 'Средний' },
    { key: 'low', label: 'Низкий' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Поиск задач..."
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
          {taskStatuses.map(status => (
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
          {taskPriorities.map(priority => (
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          <Chip
            selected={selectedGoal === null}
            onPress={() => setSelectedGoal(null)}
            style={styles.filterChip}
          >
            Все цели
          </Chip>
          {goals.map(goal => (
            <Chip
              key={goal.id}
              selected={selectedGoal === goal.id}
              onPress={() => setSelectedGoal(selectedGoal === goal.id ? null : goal.id)}
              style={styles.filterChip}
            >
              {goal.title.substring(0, 15)}...
            </Chip>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.tasksList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="assignment" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery || selectedStatus || selectedPriority || selectedGoal ? 'Задачи не найдены' : 'Задач пока нет'}
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // Навигация к созданию задачи
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
  tasksList: {
    padding: 16,
  },
  taskCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskStatusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    height: 24,
  },
  priorityChip: {
    height: 24,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  taskMeta: {
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
  notesContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
  },
  taskActions: {
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

export default TasksScreen;
