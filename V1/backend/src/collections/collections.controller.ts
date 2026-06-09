import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto, UpdateCollectionDto, ReorderDto } from './collections.dto';

@ApiTags('Collections')
@ApiBearerAuth()
@Controller('collections')
@UseGuards(AuthGuard('jwt'))
export class CollectionsController {
  constructor(private collectionsService: CollectionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a collection', description: 'Creates a custom collection (system collections are created on registration)' })
  create(@Req() req: any, @Body() dto: CreateCollectionDto) {
    return this.collectionsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all collections', description: 'System collections (Private, Public, Learning) listed first, then custom collections' })
  findAll(@Req() req: any) {
    return this.collectionsService.findAll(req.user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a collection' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCollectionDto) {
    return this.collectionsService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a collection', description: 'Links in the deleted collection are moved to Learning. Locked collections cannot be deleted.' })
  delete(@Req() req: any, @Param('id') id: string) {
    return this.collectionsService.delete(req.user.userId, id);
  }

  @Put('reorder')
  @ApiOperation({ summary: 'Reorder collections' })
  reorder(@Req() req: any, @Body() dto: ReorderDto) {
    return this.collectionsService.reorder(req.user.userId, dto.ids);
  }
}
