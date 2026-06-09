import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LinksService } from './links.service';
import { CreateLinkDto, UpdateLinkDto, QueryLinksDto, BulkActionDto } from './links.dto';

@ApiTags('Links')
@ApiBearerAuth()
@Controller('links')
@UseGuards(AuthGuard('jwt'))
export class LinksController {
  constructor(private linksService: LinksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a link' })
  create(@Req() req: any, @Body() dto: CreateLinkDto) {
    return this.linksService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List links', description: 'Supports search, scope, sort, pagination, and filtering' })
  findAll(@Req() req: any, @Query() query: QueryLinksDto) {
    return this.linksService.findAll(req.user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single link by ID' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.linksService.findOne(req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a link' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateLinkDto) {
    return this.linksService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a link' })
  delete(@Req() req: any, @Param('id') id: string) {
    return this.linksService.delete(req.user.userId, id);
  }

  @Post('bulk/delete')
  @ApiOperation({ summary: 'Bulk delete links' })
  bulkDelete(@Req() req: any, @Body() dto: BulkActionDto) {
    return this.linksService.bulkDelete(req.user.userId, dto.ids);
  }

  @Post('bulk/move')
  @ApiOperation({ summary: 'Bulk move links to a collection' })
  bulkMove(@Req() req: any, @Body() dto: BulkActionDto & { collectionId: string }) {
    return this.linksService.bulkMove(req.user.userId, dto.ids, dto.collectionId);
  }
}
