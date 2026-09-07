import { IsBoolean, IsNotEmpty, IsOptional, Length } from 'class-validator';

export class CreateCounterpartyDto {
  @IsNotEmpty({ message: 'STIR kiritilishi shart' })
  @Length(9, 9, { message: 'STIR 9 xonali bo\'lishi kerak' })
  tin: string;

  @IsOptional()
  pinfl?: string;

  @IsNotEmpty({ message: 'Kontragent nomi kiritilishi shart' })
  name: string;

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
  type?: string; // CUSTOMER, SUPPLIER, BOTH
}

export class UpdateCounterpartyDto {
  @IsOptional()
  name?: string;

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
  type?: string;
}
