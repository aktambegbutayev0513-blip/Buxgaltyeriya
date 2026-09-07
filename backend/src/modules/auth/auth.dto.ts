import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class SendOtpDto {
  @IsNotEmpty({ message: 'Telefon raqami kiritilishi shart' })
  @Matches(/^\+998[0-9]{9}$/, { message: 'Telefon formati: +998901234567 bo\'lishi kerak' })
  phone: string;
}

export class VerifyOtpDto {
  @IsNotEmpty()
  phone: string;

  @IsNotEmpty()
  @Length(4, 6, { message: 'SMS kod 4-6 xonali bo\'lishi kerak' })
  code: string;
}

export class RegisterDto {
  @IsNotEmpty()
  @Matches(/^\+998[0-9]{9}$/)
  phone: string;

  @IsNotEmpty()
  @Length(6, 50, { message: 'Parol kamida 6 belgidan iborat bo\'lishi kerak' })
  password: string;

  @IsNotEmpty()
  fullName: string;

  @IsOptional()
  email?: string;
}

export class LoginDto {
  @IsNotEmpty()
  @Matches(/^\+998[0-9]{9}$/)
  phone: string;

  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @IsNotEmpty()
  refreshToken: string;
}
