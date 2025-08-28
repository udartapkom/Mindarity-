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
  Divider,
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Event } from '../../services/api';
import api from '../../services/api';
import Toast from 'react-native-toast-message';

const EventsScreen: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const theme = useTheme();

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchQuery, selectedType]);

  const loadEvents = async () => {
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
      Toast.show({
        type: 'error',
        text1: 'Ошибка',
        text2: 'Не удалось загрузить события',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const filterEvents = () => {
    let filtered = events;

    // Фильтр по поиску
    if (searchQuery.trim()) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Фильтр по типу
    if (selectedType) {
      filtered = filtered.filter(event => event.type === selectedType);
    }

    setFilteredEvents(filtered);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'event':
        return '#1976d2';
      case 'thought':
        return '#4caf50';
      case 'memory':
        return '#ff9800';
      case 'idea':
        return '#9c27b0';
      default:
        return '#9e9e9e';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'event':
        return 'event';
      case 'thought':
        return 'psychology';
      case 'memory':
        return 'memory';
      case 'idea':
        return 'lightbulb';
      default:
        return 'help';
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    Alert.alert(
      'Удаление события',
      'Вы уверены, что хотите удалить это событие?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteEvent(eventId);
              setEvents(events.filter(event => event.id !== eventId));
              Toast.show({
                type: 'success',
                text1: 'Успешно',
                text2: 'Событие удалено',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: 'Не удалось удалить событие',
              });
            }
          },
        },
      ]
    );
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <Card style={styles.eventCard} key={item.id}>
      <Card.Content>
        <View style={styles.eventHeader}>
          <View style={styles.eventTypeContainer}>
            <Icon
              name={getTypeIcon(item.type)}
              size={20}
              color={getTypeColor(item.type)}
            />
            <Chip
              mode="outlined"
              textStyle={{ color: getTypeColor(item.type) }}
              style={[styles.typeChip, { borderColor: getTypeColor(item.type) }]}
            >
              {item.type === 'event' ? 'Событие' :
               item.type === 'thought' ? 'Мысль' :
               item.type === 'memory' ? 'Воспоминание' : 'Идея'}
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
                handleDeleteEvent(item.id);
              }}
              title="Удалить"
              leadingIcon="delete"
            />
          </Menu>
        </View>

        <Title style={styles.eventTitle}>{item.title}</Title>
        <Paragraph style={styles.eventContent} numberOfLines={3}>
          {item.content}
        </Paragraph>

        <View style={styles.eventMeta}>
          <View style={styles.metaItem}>
            <Icon name="schedule" size={16} color="#666" />
            <Text style={styles.metaText}>
              {new Date(item.eventDate).toLocaleDateString()}
            </Text>
          </View>
          {item.location && (
            <View style={styles.metaItem}>
              <Icon name="location-on" size={16} color="#666" />
              <Text style={styles.metaText}>{item.location}</Text>
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

        <View style={styles.eventStats}>
          <View style={styles.statItem}>
            <Icon name="visibility" size={16} color="#666" />
            <Text style={styles.statText}>{item.viewCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="thumb-up" size={16} color="#666" />
            <Text style={styles.statText}>{item.likeCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="emotions" size={16} color="#666" />
            <Text style={styles.statText}>{item.emotionalReactions.length}</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const eventTypes = [
    { key: 'event', label: 'События', icon: 'event' },
    { key: 'thought', label: 'Мысли', icon: 'psychology' },
    { key: 'memory', label: 'Воспоминания', icon: 'memory' },
    { key: 'idea', label: 'Идеи', icon: 'lightbulb' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Поиск событий..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeFilter}>
          <Chip
            selected={selectedType === null}
            onPress={() => setSelectedType(null)}
            style={styles.filterChip}
          >
            Все
          </Chip>
          {eventTypes.map(type => (
            <Chip
              key={type.key}
              selected={selectedType === type.key}
              onPress={() => setSelectedType(selectedType === type.key ? null : type.key)}
              style={styles.filterChip}
              icon={type.icon}
            >
              {type.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredEvents}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.eventsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="event-busy" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery || selectedType ? 'События не найдены' : 'Событий пока нет'}
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // Навигация к созданию события
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
  typeFilter: {
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  eventsList: {
    padding: 16,
  },
  eventCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeChip: {
    height: 24,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  eventContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  eventMeta: {
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
    marginBottom: 12,
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
  eventStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
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

export default EventsScreen;
