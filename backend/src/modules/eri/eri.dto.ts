import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AttachEriCertificateDto {
  @IsNotEmpty()
  tin: string; // Kompaniya yoki shaxs STIRi

  @IsOptional()
  pinfl?: string;

  @IsNotEmpty()
  serialNumber: string;

  @IsNotEmpty()
  ownerName: string;

  @IsOptional()
  companyName?: string;

  @IsNotEmpty()
  validFrom: string; // ISO Date string

  @IsNotEmpty()
  validTo: string; // ISO Date string

  @IsOptional()
  publicKeyFingerprint?: string;
}

export class VerifyEriAuthDto {
  @IsNotEmpty()
  challenge: string;

  @IsNotEmpty()
  pkcs7Signature: string; // Detached PKCS#7 imzo

  @IsNotEmpty()
  serialNumber: string;

  @IsNotEmpty()
  tin: string;
}
