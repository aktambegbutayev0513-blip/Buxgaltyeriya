import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateCompanyDto {
  @IsNotEmpty({ message: 'STIR (TIN) kiritilishi shart' })
  @Length(9, 9, { message: 'STIR 9 xonali son bo\'lishi kerak' })
  tin: string;

  @IsOptional()
  pinfl?: string;

  @IsNotEmpty({ message: 'Kompaniya nomi kiritilishi shart' })
  name: string;

  @IsOptional()
  shortName?: string;

  @IsOptional()
  directorName?: string;

  @IsOptional()
  address?: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  email?: string;

  @IsOptional()
  bankAccount?: string;

  @IsOptional()
  bankMfo?: string;

  @IsOptional()
  bankName?: string;

  @IsOptional()
  @IsBoolean()
  vatPayer?: boolean;

  @IsOptional()
  vatNumber?: string;

  @IsOptional()
  businessType?: string;
}

export class UpdateCompanyDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  shortName?: string;

  @IsOptional()
  directorName?: string;

  @IsOptional()
  address?: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  email?: string;

  @IsOptional()
  bankAccount?: string;

  @IsOptional()
  bankMfo?: string;

  @IsOptional()
  bankName?: string;

  @IsOptional()
  @IsBoolean()
  vatPayer?: boolean;

  @IsOptional()
  vatNumber?: string;
}

export class InviteUserDto {
  @IsNotEmpty()
  @Matches(/^\+998[0-9]{9}$/)
  phone: string;

  @IsNotEmpty()
  fullName: string;

  @IsNotEmpty()
  role: UserRole;
}
