import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FavoritesService } from './favorites.service';

@ApiTags('Favorites')
@ApiBearerAuth()
@Controller('favorites')
@UseGuards(AuthGuard('jwt'))
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Post(':linkId')
  @ApiOperation({ summary: 'Toggle favorite', description: 'If the link is already favorited, it will be unfavorited and vice versa' })
  toggle(@Req() req: any, @Param('linkId') linkId: string) {
    return this.favoritesService.toggle(req.user.userId, linkId);
  }

  @Get()
  @ApiOperation({ summary: 'List all favorited links' })
  findAll(@Req() req: any) {
    return this.favoritesService.findAll(req.user.userId);
  }

  @Delete(':linkId')
  @ApiOperation({ summary: 'Remove a favorite' })
  remove(@Req() req: any, @Param('linkId') linkId: string) {
    return this.favoritesService.remove(req.user.userId, linkId);
  }
}
