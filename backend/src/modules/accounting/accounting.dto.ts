import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, ValidateNested } from 'class-validator';

export class JournalEntryLineDto {
  @IsNotEmpty({ message: 'Debet schoti kiritilishi shart (masalan, 5110)' })
  debitAccount: string;

  @IsNotEmpty({ message: 'Kredit schoti kiritilishi shart (masalan, 6010)' })
  creditAccount: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  currency?: string;

  @IsOptional()
  counterpartyId?: string;

  @IsOptional()
  productId?: string;

  @IsOptional()
  comment?: string;
}

export class CreateJournalEntryDto {
  @IsNotEmpty({ message: 'Provodka raqami kiritilishi shart' })
  entryNumber: string;

  @IsDateString()
  entryDate: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  documentId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  lines: JournalEntryLineDto[];
}
