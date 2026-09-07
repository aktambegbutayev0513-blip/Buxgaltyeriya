import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty({ message: 'MXIK (IKPU) kodi kiritilishi shart' })
  ikpuCode: string;

  @IsOptional()
  packageCode?: string;

  @IsNotEmpty({ message: 'Mahsulot yoki xizmat nomi kiritilishi shart' })
  name: string;

  @IsNotEmpty({ message: 'O\'lchov birligi kodi kiritilishi shart' })
  unitCode: string;

  @IsOptional()
  unitName?: string;

  @IsOptional()
  barcode?: string;

  @IsOptional()
  @IsNumber()
  vatRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sellingPrice?: number;

  @IsOptional()
  @IsNumber()
  stockQuantity?: number;

  @IsOptional()
  @IsBoolean()
  isService?: boolean;
}

export class UpdateProductDto {
  @IsOptional()
  ikpuCode?: string;

  @IsOptional()
  packageCode?: string;

  @IsOptional()
  name?: string;

  @IsOptional()
  unitCode?: string;

  @IsOptional()
  unitName?: string;

  @IsOptional()
  barcode?: string;

  @IsOptional()
  @IsNumber()
  vatRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sellingPrice?: number;

  @IsOptional()
  @IsNumber()
  stockQuantity?: number;

  @IsOptional()
  @IsBoolean()
  isService?: boolean;
}
