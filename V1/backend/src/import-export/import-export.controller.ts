import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ImportExportService } from './import-export.service';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ImportLinkDto {
  @ApiProperty({ example: 'https://react.dev' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ example: 'React Documentation' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Learning' })
  @IsOptional()
  @IsString()
  collection?: string;

  @ApiPropertyOptional({ example: ['react', 'frontend'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdAt?: string;
}

class ImportDto {
  @ApiProperty({ type: [ImportLinkDto] })
  @IsArray()
  links: ImportLinkDto[];
}

@ApiTags('Import / Export')
@Controller()
@UseGuards(AuthGuard('jwt'))
export class ImportExportController {
  constructor(private importExportService: ImportExportService) {}

  @Get('export')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export data', description: 'Downloads all links (excluding Private collection) as JSON' })
  async exportData(@Req() req: any, @Res() res: Response) {
    const data = await this.importExportService.exportData(req.user.userId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=linkvault-export-${Date.now()}.json`,
    );
    res.json(data);
  }

  @Post('import')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Import data', description: 'Import links from a JSON export file. Duplicate URLs are skipped.' })
  importData(@Req() req: any, @Body() body: ImportDto) {
    return this.importExportService.importData(req.user.userId, body);
  }
}
