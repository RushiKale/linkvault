import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TagsService } from './tags.service';

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private tagsService: TagsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List tags', description: 'Returns tags matching the query. Includes tags from public links.' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query to filter tags' })
  findAll(@Req() req: any, @Query('q') q?: string) {
    return this.tagsService.findAll(req.user.userId, q);
  }
}
