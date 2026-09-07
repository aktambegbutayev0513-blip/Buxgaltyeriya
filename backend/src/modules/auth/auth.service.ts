import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
import { RegisterDto, LoginDto, SendOtpDto, VerifyOtpDto, RefreshTokenDto } from './auth.dto';

@Injectable()
export class AuthService {
  // In-memory OTP cache (production uchun Redis ishlatiladi)
  private otpMap = new Map<string, { code: string; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async sendOtp(dto: SendOtpDto) {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 xonali kod
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 daqiqa amal qiladi
    
    this.otpMap.set(dto.phone, { code, expiresAt });
    console.log(`[SMS-SERVICE] OTP yuborildi: ${dto.phone} -> Kod: ${code}`);

    return {
      success: true,
      message: 'Tasdiqlash kodi telefoningizga yuborildi',
      // Test muhitida tezkor sinov uchun:
      debugCode: process.env.NODE_ENV === 'production' ? undefined : code,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const record = this.otpMap.get(dto.phone);
    if (!record || record.expiresAt < Date.now() || record.code !== dto.code) {
      throw new BadRequestException('Kiritilgan tasdiqlash kodi noto\'g\'ri yoki muddati o\'tgan');
    }

    this.otpMap.delete(dto.phone);
    return {
      success: true,
      verified: true,
      phone: dto.phone,
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (existing) {
      throw new BadRequestException('Ushbu telefon raqami bilan foydalanuvchi allaqachon mavjud');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        passwordHash,
        fullName: dto.fullName,
        email: dto.email || null,
      },
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      throw new UnauthorizedException('Telefon raqam yoki parol noto\'g\'ri');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Telefon raqam yoki parol noto\'g\'ri');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Akkaunt bloklangan');
    }

    return this.generateTokens(user);
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'buxgalteriya_refresh_super_secret_2026',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Foydalanuvchi topilmadi');
      }

      return this.generateTokens(user);
    } catch (e) {
      throw new UnauthorizedException('Refresh token yaroqsiz yoki muddati o\'tgan');
    }
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      phone: user.phone,
      fullName: user.fullName,
      isSuperAdmin: user.isSuperAdmin,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'buxgalteriya_secret_key_2026_super_secure',
      expiresIn: '1d',
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'buxgalteriya_refresh_super_secret_2026',
        expiresIn: '7d',
      },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
      },
    };
  }
}
