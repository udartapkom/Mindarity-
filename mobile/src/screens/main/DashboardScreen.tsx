import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Text,
  Button,
  Chip,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import { LineChart, PieChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalEvents: number;
  totalGoals: number;
  totalTasks: number;
  completedTasks: number;
  upcomingDeadlines: number;
  moodDistribution: Record<string, number>;
  goalProgress: Array<{ goalId: string; title: string; progress: number }>;
  recentActivity: Array<any>;
  period: string;
}

const DashboardScreen: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  const { user } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    loadDashboardStats();
  }, [selectedPeriod]);

  const loadDashboardStats = async () => {
    try {
      const data = await api.getDashboardStats(selectedPeriod);
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardStats();
    setRefreshing(false);
  };

  const getMoodChartData = () => {
    if (!stats?.moodDistribution) return [];
    
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
    return Object.entries(stats.moodDistribution).map(([mood, count], index) => ({
      name: mood,
      population: count,
      color: colors[index % colors.length],
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
  };

  const getGoalProgressData = () => {
    if (!stats?.goalProgress || stats.goalProgress.length === 0) {
      return {
        labels: ['Нет данных'],
        datasets: [{ data: [1] }],
      };
    }

    const labels = stats.goalProgress.map(goal => goal.title.substring(0, 10) + '...');
    const data = stats.goalProgress.map(goal => goal.progress);

    return {
      labels,
      datasets: [{ data }],
    };
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Загрузка дашборда...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Title style={styles.welcomeTitle}>
          Добро пожаловать, {user?.firstName || user?.username}!
        </Title>
        
        <View style={styles.periodSelector}>
          <Chip
            selected={selectedPeriod === 'week'}
            onPress={() => setSelectedPeriod('week')}
            style={styles.periodChip}
          >
            Неделя
          </Chip>
          <Chip
            selected={selectedPeriod === 'month'}
            onPress={() => setSelectedPeriod('month')}
            style={styles.periodChip}
          >
            Месяц
          </Chip>
          <Chip
            selected={selectedPeriod === 'year'}
            onPress={() => setSelectedPeriod('year')}
            style={styles.periodChip}
          >
            Год
          </Chip>
        </View>
      </View>

      {/* Статистика */}
      <View style={styles.statsContainer}>
        <Card style={styles.statsCard}>
          <Card.Content>
            <Title style={styles.statsTitle}>Общая статистика</Title>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Icon name="event" size={24} color="#1976d2" />
                <Text style={styles.statNumber}>{stats?.totalEvents || 0}</Text>
                <Text style={styles.statLabel}>События</Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="flag" size={24} color="#4caf50" />
                <Text style={styles.statNumber}>{stats?.totalGoals || 0}</Text>
                <Text style={styles.statLabel}>Цели</Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="assignment" size={24} color="#ff9800" />
                <Text style={styles.statNumber}>{stats?.totalTasks || 0}</Text>
                <Text style={styles.statLabel}>Задачи</Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="check-circle" size={24} color="#4caf50" />
                <Text style={styles.statNumber}>{stats?.completedTasks || 0}</Text>
                <Text style={styles.statLabel}>Выполнено</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Прогресс целей */}
      {stats?.goalProgress && stats.goalProgress.length > 0 && (
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title style={styles.chartTitle}>Прогресс целей</Title>
            <LineChart
              data={getGoalProgressData()}
              width={width - 60}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#1976d2',
                },
              }}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      )}

      {/* Распределение настроений */}
      {stats?.moodDistribution && Object.keys(stats.moodDistribution).length > 0 && (
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title style={styles.chartTitle}>Распределение настроений</Title>
            <PieChart
              data={getMoodChartData()}
              width={width - 60}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </Card.Content>
        </Card>
      )}

      {/* Недавняя активность */}
      {stats?.recentActivity && stats.recentActivity.length > 0 && (
        <Card style={styles.activityCard}>
          <Card.Content>
            <Title style={styles.chartTitle}>Недавняя активность</Title>
            {stats.recentActivity.slice(0, 5).map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <Icon name="fiber-manual-record" size={8} color="#1976d2" />
                <Text style={styles.activityText} numberOfLines={2}>
                  {activity.title || activity.content || 'Новая активность'}
                </Text>
                <Text style={styles.activityTime}>
                  {new Date(activity.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Предстоящие дедлайны */}
      {stats?.upcomingDeadlines && stats.upcomingDeadlines > 0 && (
        <Card style={styles.deadlineCard}>
          <Card.Content>
            <Title style={styles.chartTitle}>Предстоящие дедлайны</Title>
            <View style={styles.deadlineWarning}>
              <Icon name="warning" size={24} color="#ff9800" />
              <Text style={styles.deadlineText}>
                У вас {stats.upcomingDeadlines} задач с приближающимся дедлайном
              </Text>
            </View>
            <Button
              mode="contained"
              onPress={() => {/* Навигация к задачам */}}
              style={styles.deadlineButton}
            >
              Просмотреть задачи
            </Button>
          </Card.Content>
        </Card>
      )}
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1976d2',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  periodChip: {
    marginRight: 8,
  },
  statsContainer: {
    padding: 20,
  },
  statsCard: {
    elevation: 2,
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  chartCard: {
    margin: 20,
    elevation: 2,
    borderRadius: 12,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  activityCard: {
    margin: 20,
    elevation: 2,
    borderRadius: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  deadlineCard: {
    margin: 20,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#fff3e0',
  },
  deadlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deadlineText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#e65100',
    flex: 1,
  },
  deadlineButton: {
    marginTop: 8,
  },
});

export default DashboardScreen;
