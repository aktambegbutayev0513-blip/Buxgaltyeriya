import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DocumentType, DocumentStatus } from '@prisma/client';

export class DocumentItemDto {
  @IsOptional()
  productId?: string;

  @IsNotEmpty({ message: 'MXIK (IKPU) kodi kiritilishi shart' })
  ikpuCode: string;

  @IsOptional()
  packageCode?: string;

  @IsNotEmpty({ message: 'Mahsulot nomi kiritilishi shart' })
  name: string;

  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  unitCode: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  vatRate?: number;
}

export class CreateDocumentDto {
  @IsEnum(DocumentType)
  docType: DocumentType;

  @IsNotEmpty({ message: 'Hujjat raqami kiritilishi shart' })
  docNumber: string;

  @IsDateString()
  docDate: string;

  @IsOptional()
  contractId?: string;

  @IsNotEmpty({ message: 'Kontragent tanlanishi shart' })
  counterpartyId: string;

  @IsOptional()
  currency?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentItemDto)
  items: DocumentItemDto[];
}

export class SignDocumentDto {
  @IsNotEmpty({ message: 'PKCS#7 imzo kiritilishi shart' })
  pkcs7Signature: string;

  @IsNotEmpty({ message: 'Sertifikat seriya raqami kiritilishi shart' })
  certificateSerial: string;

  @IsNotEmpty({ message: 'Imzolovchi STIRi kiritilishi shart' })
  signerTin: string;

  @IsNotEmpty({ message: 'Imzolovchi F.I.Sh. kiritilishi shart' })
  signerName: string;

  @IsOptional()
  signerRole?: string;
}

export class RejectDocumentDto {
  @IsNotEmpty({ message: 'Rad etish sababi ko\'rsatilishi shart' })
  reason: string;
}
