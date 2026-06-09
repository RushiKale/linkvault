import {
  IsString,
  IsOptional,
  IsUrl,
  IsArray,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLinkDto {
  @ApiProperty({ example: 'https://react.dev' })
  @IsUrl({ require_tld: false })
  url: string;

  @ApiPropertyOptional({ example: 'React Documentation' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Collection ID' })
  @IsString()
  collectionId: string;

  @ApiPropertyOptional({ example: 'Official React docs' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  faviconUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'Great resource for React' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: ['react', 'frontend'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Override duplicate URL check' })
  @IsBoolean()
  @IsOptional()
  forceSave?: boolean;
}

export class UpdateLinkDto {
  @ApiPropertyOptional({ example: 'React Documentation' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'https://react.dev' })
  @IsUrl({ require_tld: false })
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ description: 'Collection ID' })
  @IsString()
  @IsOptional()
  collectionId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  faviconUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: ['react', 'frontend'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class QueryLinksDto {
  @ApiPropertyOptional({ description: 'Search query (title, url, notes, tags)' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by collection ID' })
  @IsString()
  @IsOptional()
  collectionId?: string;

  @ApiPropertyOptional({ description: 'Filter by tag name' })
  @IsString()
  @IsOptional()
  tag?: string;

  @ApiPropertyOptional({ enum: ['mine', 'public', 'all'], default: 'mine' })
  @IsString()
  @IsOptional()
  scope?: 'mine' | 'public' | 'all';

  @ApiPropertyOptional({ description: 'Only favorites' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  favorites?: boolean;

  @ApiPropertyOptional({ enum: ['newest', 'oldest', 'alphabetical', 'most_opened', 'recently_opened'], default: 'newest' })
  @IsString()
  @IsOptional()
  sort?: 'newest' | 'oldest' | 'alphabetical' | 'most_opened' | 'recently_opened';

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}

export class BulkActionDto {
  @ApiProperty({ example: ['link-id-1', 'link-id-2'] })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
