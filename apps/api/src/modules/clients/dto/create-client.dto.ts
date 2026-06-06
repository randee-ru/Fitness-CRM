import { IsString, IsOptional, IsEmail, IsDateString, IsBoolean } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateClientDto {
  @ApiProperty() @IsString() firstName: string
  @ApiProperty() @IsString() lastName: string
  @ApiPropertyOptional() @IsOptional() @IsString() middleName?: string
  @ApiProperty() @IsString() phone: string
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string
  @ApiPropertyOptional() @IsOptional() @IsDateString() birthDate?: string
  @ApiPropertyOptional() @IsOptional() @IsString() gender?: string
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string
  @ApiPropertyOptional() @IsOptional() @IsString() telegram?: string
  @ApiPropertyOptional() @IsOptional() @IsString() instagram?: string
  @ApiPropertyOptional() @IsOptional() @IsString() salesChannel?: string
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string
}

export class UpdateClientDto extends CreateClientDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean
  @ApiPropertyOptional() @IsOptional() @IsString() photoUrl?: string
}

export class ClientQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string
  @ApiPropertyOptional() @IsOptional() page?: number
  @ApiPropertyOptional() @IsOptional() limit?: number
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean
}
