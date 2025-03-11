import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUsuarioDto {
  @MinLength(10, { message: 'Nome tem de ter ao menos 10 caracteres.' })
  @IsString({ message: 'Tem de ser texto.' })
  @ApiProperty()
  nome: string;

  @IsString({ message: 'Login inválido!' })
  @MinLength(7, { message: 'Login tem de ter ao menos 7 caracteres.' })
  @ApiProperty()
  login: string;

  @IsString({ message: 'Login inválido!' })
  @IsEmail({}, { message: 'Login tem de ter ao menos 7 caracteres.' })
  @ApiProperty()
  email: string;

  @IsString({ message: 'Unidade inválida!' })
  @ApiProperty()
  unidade_id?: string;

  @IsNumber({}, { message: 'Status inválido!' })
  @ApiProperty()
  status?: boolean;

  @IsString({ message: 'Avatar inválido!' })
  @ApiProperty()
  avatar?: string;

  @IsBoolean({ message: 'Permissão inválida!' })
  @ApiProperty()
  dev?: boolean;
}
