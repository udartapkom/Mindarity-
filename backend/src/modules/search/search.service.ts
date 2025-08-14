import { Injectable, Logger } from '@nestjs/common';
import { SearchDto, SearchType, SearchSort } from './dto/search.dto';
import { Event } from '../events/entities/event.entity';
import { Goal } from '../goals/entities/goal.entity';
import { Task } from '../goals/entities/task.entity';
import { ElasticsearchService } from './elasticsearch.service';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly indexName = 'mindarity';

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async onModuleInit() {
    this.logger.log('Search service initialized with Elasticsearch');
    await this.initializeIndexes();
  }

  private async initializeIndexes() {
    try {
      // Создаем индексы для разных типов данных
      const eventMapping = {
        properties: {
          id: { type: 'keyword' },
          title: { type: 'text', analyzer: 'russian_analyzer' },
          description: { type: 'text', analyzer: 'russian_analyzer' },
          type: { type: 'keyword' },
          userId: { type: 'keyword' },
          tags: { type: 'keyword' },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
        },
      };

      const goalMapping = {
        properties: {
          id: { type: 'keyword' },
          title: { type: 'text', analyzer: 'russian_analyzer' },
          description: { type: 'text', analyzer: 'russian_analyzer' },
          userId: { type: 'keyword' },
          status: { type: 'keyword' },
          priority: { type: 'keyword' },
          dueDate: { type: 'date' },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
        },
      };

      const taskMapping = {
        properties: {
          id: { type: 'keyword' },
          title: { type: 'text', analyzer: 'russian_analyzer' },
          description: { type: 'text', analyzer: 'russian_analyzer' },
          goalId: { type: 'keyword' },
          userId: { type: 'keyword' },
          status: { type: 'keyword' },
          priority: { type: 'keyword' },
          dueDate: { type: 'date' },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
        },
      };

      await this.elasticsearchService.createIndex(`${this.indexName}_events`, eventMapping);
      await this.elasticsearchService.createIndex(`${this.indexName}_goals`, goalMapping);
      await this.elasticsearchService.createIndex(`${this.indexName}_tasks`, taskMapping);

      this.logger.log('Search indexes initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize search indexes:', error);
    }
  }

  async indexEvent(event: Event) {
    try {
      const document = {
        id: event.id,
        title: event.title,
        content: event.content,
        type: event.type,
        userId: event.userId,
        tags: event.tags,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      };

      await this.elasticsearchService.indexDocument(
        `${this.indexName}_events`,
        event.id,
        document
      );
    } catch (error) {
      this.logger.error(`Failed to index event ${event.id}: ${error.message}`);
    }
  }

  async indexGoal(goal: Goal) {
    try {
      const document = {
        id: goal.id,
        title: goal.title,
        description: goal.description,
        userId: goal.userId,
        status: goal.status,
        priority: goal.priority,
        deadline: goal.deadline,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
      };

      await this.elasticsearchService.indexDocument(
        `${this.indexName}_goals`,
        goal.id,
        document
      );
    } catch (error) {
      this.logger.error(`Failed to index goal ${goal.id}: ${error.message}`);
    }
  }

  async indexTask(task: Task) {
    try {
      const document = {
        id: task.id,
        title: task.title,
        description: task.description,
        goalId: task.goalId,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      };

      await this.elasticsearchService.indexDocument(
        `${this.indexName}_tasks`,
        task.id,
        document
      );
    } catch (error) {
      this.logger.error(`Failed to index task ${task.id}: ${error.message}`);
    }
  }

  async search(searchDto: SearchDto, userId: string) {
    try {
      const { query, types, sort, page = 0, size = 10 } = searchDto;
      
      // Определяем индекс для поиска
      let indexName = this.indexName;
      if (types && types.length > 0) {
        // Если указаны типы, ищем в первом типе
        indexName = `${this.indexName}_${types[0]}s`;
      }

      // Строим поисковый запрос
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query,
                  fields: ['title^2', 'content', 'description'],
                  fuzziness: 'AUTO',
                },
              },
              {
                term: { userId },
              },
            ],
          },
        },
        sort: this.buildSortClause(sort),
        from: page * size,
        size,
        highlight: {
          fields: {
            title: {},
            content: {},
            description: {},
          },
        },
      };

      const result = await this.elasticsearchService.search(indexName, searchQuery);
      
      return {
        hits: result.hits?.hits || [],
        total: result.hits?.total?.value || 0,
        page,
        size,
        pages: Math.ceil((result.hits?.total?.value || 0) / size),
      };
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`);
      throw error;
    }
  }

  private buildSortClause(sort?: SearchSort) {
    switch (sort) {
      case SearchSort.DATE_ASC:
        return [{ createdAt: { order: 'asc' } }];
      case SearchSort.DATE_DESC:
        return [{ createdAt: { order: 'desc' } }];
      case SearchSort.TITLE_ASC:
        return [{ title: { order: 'asc' } }];
      case SearchSort.TITLE_DESC:
        return [{ title: { order: 'desc' } }];
      case SearchSort.RELEVANCE:
      default:
        return [{ _score: { order: 'desc' } }];
    }
  }

  async deleteDocument(id: string, type: string) {
    try {
      const indexName = `${this.indexName}_${type}s`;
      await this.elasticsearchService.deleteDocument(indexName, id);
    } catch (error) {
      this.logger.error(
        `Failed to delete document ${type}_${id}: ${error.message}`,
      );
    }
  }

  async updateDocument(id: string, type: string, data: any) {
    try {
      const indexName = `${this.indexName}_${type}s`;
      await this.elasticsearchService.updateDocument(indexName, id, data);
    } catch (error) {
      this.logger.error(
        `Failed to update document ${type}_${id}: ${error.message}`,
      );
    }
  }

  async getSuggestions(query: string, userId: string) {
    try {
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query,
                  fields: ['title^2', 'content', 'description'],
                  fuzziness: 'AUTO',
                },
              },
              {
                term: { userId },
              },
            ],
          },
        },
        size: 5,
        _source: ['title', 'type'],
      };

      const results = await Promise.all([
        this.elasticsearchService.search(`${this.indexName}_events`, searchQuery),
        this.elasticsearchService.search(`${this.indexName}_goals`, searchQuery),
        this.elasticsearchService.search(`${this.indexName}_tasks`, searchQuery),
      ]);

      const suggestions = results.flatMap(result => 
        result.hits?.hits?.map(hit => ({
          title: hit._source.title,
          type: hit._source.type || 'unknown',
        })) || []
      );

      return suggestions.slice(0, 10);
    } catch (error) {
      this.logger.error(`Failed to get suggestions: ${error.message}`);
      return [];
    }
  }
}
