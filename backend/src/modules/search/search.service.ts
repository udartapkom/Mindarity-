import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SearchDto, SearchType, SearchSort } from './dto/search.dto';
import { Event } from '../events/entities/event.entity';
import { Goal } from '../goals/entities/goal.entity';
import { Task } from '../goals/entities/task.entity';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly indexName = 'mindarity';

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async onModuleInit() {
    await this.createIndex();
  }

  private async createIndex() {
    try {
      const indexExists = await this.elasticsearchService.indices.exists({
        index: this.indexName,
      });

      if (!indexExists) {
        await this.elasticsearchService.indices.create({
          index: this.indexName,
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                type: { type: 'keyword' },
                title: { type: 'text', analyzer: 'standard' },
                content: { type: 'text', analyzer: 'standard' },
                userId: { type: 'keyword' },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' },
                emotionalReactions: { type: 'keyword' },
                tags: { type: 'keyword' },
                status: { type: 'keyword' },
                priority: { type: 'keyword' },
                deadline: { type: 'date' },
                dueDate: { type: 'date' },
                progress: { type: 'integer' },
                location: { type: 'geo_point' },
                isPublic: { type: 'boolean' },
              },
            },
            settings: {
              analysis: {
                analyzer: {
                  russian: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'russian_stop', 'russian_stemmer'],
                  },
                },
                filter: {
                  russian_stop: {
                    type: 'stop',
                    stopwords: '_russian_',
                  },
                  russian_stemmer: {
                    type: 'stemmer',
                    language: 'russian',
                  },
                },
              },
            },
          },
        });

        this.logger.log(`Index ${this.indexName} created successfully`);
      }
    } catch (error) {
      this.logger.error(`Failed to create index: ${error.message}`);
    }
  }

  async indexEvent(event: Event) {
    try {
      await this.elasticsearchService.index({
        index: this.indexName,
        id: `event_${event.id}`,
        body: {
          id: event.id,
          type: 'event',
          title: event.title,
          content: event.content,
          userId: event.userId,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
          emotionalReactions: event.emotionalReactions,
          tags: event.tags,
          location: event.location,
          isPublic: event.isPublic,
          eventType: event.type,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to index event ${event.id}: ${error.message}`);
    }
  }

  async indexGoal(goal: Goal) {
    try {
      await this.elasticsearchService.index({
        index: this.indexName,
        id: `goal_${goal.id}`,
        body: {
          id: goal.id,
          type: 'goal',
          title: goal.title,
          description: goal.description,
          userId: goal.userId,
          createdAt: goal.createdAt,
          updatedAt: goal.updatedAt,
          status: goal.status,
          priority: goal.priority,
          deadline: goal.deadline,
          progress: goal.progress,
          tags: goal.tags,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to index goal ${goal.id}: ${error.message}`);
    }
  }

  async indexTask(task: Task) {
    try {
      await this.elasticsearchService.index({
        index: this.indexName,
        id: `task_${task.id}`,
        body: {
          id: task.id,
          type: 'task',
          title: task.title,
          description: task.description,
          userId: task.goal?.userId,
          goalId: task.goalId,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          estimatedTime: task.estimatedTime,
          actualTime: task.actualTime,
          tags: task.tags,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to index task ${task.id}: ${error.message}`);
    }
  }

  async search(searchDto: SearchDto, userId: string) {
    try {
      const must: any[] = [
        {
          bool: {
            should: [
              { term: { userId: userId } },
              { term: { isPublic: true } },
            ],
            minimum_should_match: 1,
          },
        },
      ];

      if (searchDto.query) {
        must.push({
          multi_match: {
            query: searchDto.query,
            fields: ['title^2', 'content', 'description'],
            type: 'best_fields',
            fuzziness: 'AUTO',
          },
        });
      }

      if (searchDto.types && searchDto.types.length > 0) {
        must.push({
          terms: { type: searchDto.types },
        });
      }

      if (searchDto.dateFrom || searchDto.dateTo) {
        const range: any = {};
        if (searchDto.dateFrom) range.gte = searchDto.dateFrom;
        if (searchDto.dateTo) range.lte = searchDto.dateTo;

        must.push({
          range: {
            createdAt: range,
          },
        });
      }

      if (
        searchDto.emotionalReactions &&
        searchDto.emotionalReactions.length > 0
      ) {
        must.push({
          terms: { emotionalReactions: searchDto.emotionalReactions },
        });
      }

      if (searchDto.tags && searchDto.tags.length > 0) {
        must.push({
          terms: { tags: searchDto.tags },
        });
      }

      const sort = this.buildSortClause(searchDto.sort);

      const response = await this.elasticsearchService.search({
        index: this.indexName,
        body: {
          query: {
            bool: { must },
          },
          sort,
          from: searchDto.page * searchDto.size,
          size: searchDto.size,
          highlight: {
            fields: {
              title: {},
              content: {},
              description: {},
            },
          },
        },
      });

      return {
        hits: response.hits.hits.map((hit) => ({
          ...hit._source,
          score: hit._score,
          highlights: hit.highlight,
        })),
        total: response.hits.total.value,
        page: searchDto.page,
        size: searchDto.size,
        pages: Math.ceil(response.hits.total.value / searchDto.size),
      };
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`);
      throw error;
    }
  }

  private buildSortClause(sort: SearchSort) {
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
      await this.elasticsearchService.delete({
        index: this.indexName,
        id: `${type}_${id}`,
      });
    } catch (error) {
      this.logger.error(
        `Failed to delete document ${type}_${id}: ${error.message}`,
      );
    }
  }

  async updateDocument(id: string, type: string, data: any) {
    try {
      await this.elasticsearchService.update({
        index: this.indexName,
        id: `${type}_${id}`,
        body: {
          doc: data,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to update document ${type}_${id}: ${error.message}`,
      );
    }
  }

  async getSuggestions(query: string, userId: string) {
    try {
      const response = await this.elasticsearchService.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              must: [
                {
                  bool: {
                    should: [
                      { term: { userId: userId } },
                      { term: { isPublic: true } },
                    ],
                    minimum_should_match: 1,
                  },
                },
                {
                  multi_match: {
                    query,
                    fields: ['title^2', 'content', 'description'],
                    type: 'phrase_prefix',
                  },
                },
              ],
            },
          },
          size: 5,
          _source: ['title', 'type'],
        },
      });

      return response.hits.hits.map((hit) => ({
        title: hit._source.title,
        type: hit._source.type,
        score: hit._score,
      }));
    } catch (error) {
      this.logger.error(`Failed to get suggestions: ${error.message}`);
      return [];
    }
  }
}
