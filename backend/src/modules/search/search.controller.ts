import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchDto } from './dto/search.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Search')
@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search across all content types' })
  @ApiResponse({ status: 200, description: 'Search results' })
  @ApiQuery({
    name: 'query',
    required: false,
    description: 'Search query text',
  })
  @ApiQuery({
    name: 'types',
    required: false,
    description: 'Content types to search in',
    isArray: true,
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    description: 'Start date (ISO string)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    description: 'End date (ISO string)',
  })
  @ApiQuery({
    name: 'emotionalReactions',
    required: false,
    description: 'Emotional reactions filter',
    isArray: true,
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    description: 'Tags filter',
    isArray: true,
  })
  @ApiQuery({ name: 'sort', required: false, description: 'Sort order' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (0-based)',
  })
  @ApiQuery({ name: 'size', required: false, description: 'Page size' })
  async search(@Query() searchDto: SearchDto, @Request() req) {
    return this.searchService.search(searchDto, req.user.id);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions' })
  @ApiResponse({ status: 200, description: 'Search suggestions' })
  @ApiQuery({
    name: 'query',
    required: true,
    description: 'Partial search query',
  })
  async getSuggestions(@Query('query') query: string, @Request() req) {
    return this.searchService.getSuggestions(query, req.user.id);
  }

  @Post('reindex')
  @ApiOperation({ summary: 'Reindex all content (admin only)' })
  @ApiResponse({ status: 200, description: 'Reindexing started' })
  async reindexAll(@Request() req) {
    // TODO: Implement reindexing logic
    // This would require access to all entities and their services
    return { message: 'Reindexing started' };
  }
}
