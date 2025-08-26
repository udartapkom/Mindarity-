import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { ElasticsearchService } from './elasticsearch.service';

@Module({
  controllers: [SearchController],
  providers: [SearchService, ElasticsearchService],
  exports: [SearchService, ElasticsearchService],
})
export class SearchModule {}
