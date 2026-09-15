import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsObject,
} from 'class-validator';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del contacto es obligatorio' })
  name: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsEmail({}, { message: 'El correo electrónico del contacto debe ser válido' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  personalPhone?: string;

  @IsString()
  @IsOptional()
  birthDate?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  hobbies?: string;

  @IsString()
  @IsOptional()
  preferredChannel?: string;

  @IsObject()
  @IsOptional()
  socialInsights?: any;

  @IsOptional()
  client?: any;

  @IsOptional()
  clientId?: number;
}
