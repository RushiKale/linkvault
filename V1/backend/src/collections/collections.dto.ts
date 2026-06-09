import { IsString, IsOptional, IsArray, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCollectionDto {
  @ApiProperty({ example: 'Work' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '#6366f1' })
  @IsString()
  @IsOptional()
  color?: string;
}

export class UpdateCollectionDto {
  @ApiPropertyOptional({ example: 'Work' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '#6366f1' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'Sort order position' })
  @IsInt()
  @IsOptional()
  order?: number;
}

export class ReorderDto {
  @ApiProperty({ example: ['col-id-1', 'col-id-2', 'col-id-3'] })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
