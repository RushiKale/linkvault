import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SearchService } from './search.service';

@ApiTags('Search')
@ApiBearerAuth()
@Controller('search')
@UseGuards(AuthGuard('jwt'))
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search links', description: 'Full-text search across title, URL, notes, tags, and collection names' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'collectionId', required: false })
  @ApiQuery({ name: 'tag', required: false })
  @ApiQuery({ name: 'favorites', required: false, description: 'Filter to favorites only' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  search(
    @Req() req: any,
    @Query('q') query: string,
    @Query('collectionId') collectionId?: string,
    @Query('tag') tag?: string,
    @Query('favorites') favorites?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.searchService.search(req.user.userId, query || '', {
      collectionId,
      tag,
      favorites: favorites === 'true',
      dateFrom,
      dateTo,
    });
  }
}
