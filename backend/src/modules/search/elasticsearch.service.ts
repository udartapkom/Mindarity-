import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchService {
  private readonly logger = new Logger(ElasticsearchService.name);
  private client: Client;

  constructor(private configService: ConfigService) {
    this.initializeClient();
  }

  private initializeClient() {
    const elasticsearchUrl = this.configService.get('ELASTICSEARCH_URL') || 'http://elasticsearch:9200';
    
    this.client = new Client({
      node: elasticsearchUrl,
      auth: {
        username: this.configService.get('ELASTICSEARCH_USERNAME') || 'elastic',
        password: this.configService.get('ELASTICSEARCH_PASSWORD') || 'changeme',
      },
      tls: {
        rejectUnauthorized: false, // Для разработки
      },
    });
  }

  /**
   * Проверяет подключение к Elasticsearch
   */
  async ping(): Promise<boolean> {
    try {
      await this.client.ping();
      this.logger.log('Elasticsearch connection successful');
      return true;
    } catch (error) {
      this.logger.error('Elasticsearch connection failed:', error);
      return false;
    }
  }

  /**
   * Создает индекс если он не существует
   */
  async createIndex(indexName: string, mapping: any): Promise<boolean> {
    try {
      const indexExists = await this.client.indices.exists({ index: indexName });
      
      if (!indexExists) {
        await this.client.indices.create({
          index: indexName,
          mappings: mapping,
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            analysis: {
              analyzer: {
                russian_analyzer: {
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
        });
        this.logger.log(`Index ${indexName} created successfully`);
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to create index ${indexName}:`, error);
      return false;
    }
  }

  /**
   * Индексирует документ
   */
  async indexDocument(indexName: string, id: string, document: any): Promise<boolean> {
    try {
      await this.client.index({
        index: indexName,
        id,
        document: document,
      });
      
      this.logger.log(`Document indexed successfully in ${indexName}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to index document in ${indexName}:`, error);
      return false;
    }
  }

  /**
   * Обновляет документ
   */
  async updateDocument(indexName: string, id: string, document: any): Promise<boolean> {
    try {
      await this.client.update({
        index: indexName,
        id,
        doc: document,
      });
      
      this.logger.log(`Document updated successfully in ${indexName}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to update document in ${indexName}:`, error);
      return false;
    }
  }

  /**
   * Удаляет документ
   */
  async deleteDocument(indexName: string, id: string): Promise<boolean> {
    try {
      await this.client.delete({
        index: indexName,
        id,
      });
      
      this.logger.log(`Document deleted successfully from ${indexName}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete document from ${indexName}:`, error);
      return false;
    }
  }

  /**
   * Выполняет поиск
   */
  async search(indexName: string, query: any): Promise<any> {
    try {
      const result = await this.client.search({
        index: indexName,
        query: query,
      });
      
      return result;
    } catch (error) {
      this.logger.error(`Search failed in ${indexName}:`, error);
      throw error;
    }
  }

  /**
   * Получает статистику индекса
   */
  async getIndexStats(indexName: string): Promise<any> {
    try {
      const result = await this.client.indices.stats({
        index: indexName,
      });
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to get stats for index ${indexName}:`, error);
      return null;
    }
  }

  /**
   * Переиндексирует все данные
   */
  async reindexAll(): Promise<boolean> {
    try {
      // Здесь будет логика для переиндексации всех данных
      this.logger.log('Reindexing all data...');
      
      // TODO: Реализовать переиндексацию
      
      return true;
    } catch (error) {
      this.logger.error('Reindexing failed:', error);
      return false;
    }
  }
}
