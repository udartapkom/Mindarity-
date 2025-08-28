import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  Alert,
  Dimensions,
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
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DocumentPicker from 'react-native-document-picker';
import api from '../../services/api';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

interface FileItem {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  userId: string;
}

const FilesScreen: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const theme = useTheme();

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    filterFiles();
  }, [files, searchQuery, selectedType]);

  const loadFiles = async () => {
    try {
      const data = await api.getFiles();
      setFiles(data);
    } catch (error) {
      console.error('Error loading files:', error);
      Toast.show({
        type: 'error',
        text1: 'Ошибка',
        text2: 'Не удалось загрузить файлы',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFiles();
    setRefreshing(false);
  };

  const filterFiles = () => {
    let filtered = files;

    // Фильтр по поиску
    if (searchQuery.trim()) {
      filtered = filtered.filter(file =>
        file.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.filename.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Фильтр по типу
    if (selectedType) {
      filtered = filtered.filter(file => file.mimeType.startsWith(selectedType));
    }

    setFilteredFiles(filtered);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video-file';
    if (mimeType.startsWith('audio/')) return 'audiotrack';
    if (mimeType.includes('pdf')) return 'picture-as-pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'description';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'table-chart';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'slideshow';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive';
    return 'insert-drive-file';
  };

  const getFileTypeColor = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '#4caf50';
    if (mimeType.startsWith('video/')) return '#f44336';
    if (mimeType.startsWith('audio/')) return '#9c27b0';
    if (mimeType.includes('pdf')) return '#f44336';
    if (mimeType.includes('word') || mimeType.includes('document')) return '#1976d2';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '#4caf50';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '#ff9800';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '#795548';
    return '#9e9e9e';
  };

  const getFileTypeLabel = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'Изображение';
    if (mimeType.startsWith('video/')) return 'Видео';
    if (mimeType.startsWith('audio/')) return 'Аудио';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'Документ';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Таблица';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'Презентация';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'Архив';
    return 'Файл';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: false,
      });

      if (result && result.length > 0) {
        const file = result[0];
        setUploading(true);

        try {
          await api.uploadFile(file);
          Toast.show({
            type: 'success',
            text1: 'Успешно',
            text2: 'Файл загружен',
          });
          loadFiles(); // Перезагружаем список файлов
        } catch (error) {
          Toast.show({
            type: 'error',
            text1: 'Ошибка',
            text2: 'Не удалось загрузить файл',
          });
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        Toast.show({
          type: 'error',
          text1: 'Ошибка',
          text2: 'Не удалось выбрать файл',
        });
      }
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    Alert.alert(
      'Удаление файла',
      'Вы уверены, что хотите удалить этот файл?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteFile(fileId);
              setFiles(files.filter(file => file.id !== fileId));
              Toast.show({
                type: 'success',
                text1: 'Успешно',
                text2: 'Файл удален',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: 'Не удалось удалить файл',
              });
            }
          },
        },
      ]
    );
  };

  const renderFileItem = ({ item }: { item: FileItem }) => (
    <Card style={styles.fileCard} key={item.id}>
      <Card.Content>
        <View style={styles.fileHeader}>
          <View style={styles.fileTypeContainer}>
            <Icon
              name={getFileIcon(item.mimeType)}
              size={24}
              color={getFileTypeColor(item.mimeType)}
            />
            <Chip
              mode="outlined"
              textStyle={{ color: getFileTypeColor(item.mimeType) }}
              style={[styles.typeChip, { borderColor: getFileTypeColor(item.mimeType) }]}
            >
              {getFileTypeLabel(item.mimeType)}
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
                // Скачивание файла
              }}
              title="Скачать"
              leadingIcon="download"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                // Поделиться файлом
              }}
              title="Поделиться"
              leadingIcon="share"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(null);
                handleDeleteFile(item.id);
              }}
              title="Удалить"
              leadingIcon="delete"
            />
          </Menu>
        </View>

        <Title style={styles.fileTitle} numberOfLines={2}>
          {item.originalName}
        </Title>

        <View style={styles.fileMeta}>
          <View style={styles.metaItem}>
            <Icon name="storage" size={16} color="#666" />
            <Text style={styles.metaText}>
              {formatFileSize(item.size)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="schedule" size={16} color="#666" />
            <Text style={styles.metaText}>
              {new Date(item.uploadedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.fileActions}>
          <Button
            mode="outlined"
            onPress={() => {/* Скачивание файла */}}
            style={styles.actionButton}
            icon="download"
          >
            Скачать
          </Button>
          <Button
            mode="outlined"
            onPress={() => {/* Поделиться файлом */}}
            style={styles.actionButton}
            icon="share"
          >
            Поделиться
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const fileTypes = [
    { key: 'image/', label: 'Изображения', icon: 'image' },
    { key: 'video/', label: 'Видео', icon: 'video-file' },
    { key: 'audio/', label: 'Аудио', icon: 'audiotrack' },
    { key: 'application/', label: 'Документы', icon: 'description' },
    { key: 'text/', label: 'Текстовые', icon: 'article' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Поиск файлов..."
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
            Все типы
          </Chip>
          {fileTypes.map(type => (
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
        data={filteredFiles}
        renderItem={renderFileItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.filesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="folder-open" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery || selectedType ? 'Файлы не найдены' : 'Файлов пока нет'}
            </Text>
          </View>
        }
      />

      <FAB
        icon="upload"
        style={styles.fab}
        onPress={handleFileUpload}
        loading={uploading}
        disabled={uploading}
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
  filesList: {
    padding: 16,
  },
  fileCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  fileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fileTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeChip: {
    height: 24,
  },
  fileTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 20,
  },
  fileMeta: {
    marginBottom: 16,
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
  fileActions: {
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

export default FilesScreen;
