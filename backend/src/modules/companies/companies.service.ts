import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto, InviteUserDto } from './companies.dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Foydalanuvchi a'zo bo'lgan barcha kompaniyalarni olish
  async getUserCompanies(userId: string) {
    const memberships = await this.prisma.companyUser.findMany({
      where: { userId, isActive: true },
      include: {
        company: {
          include: {
            eriCertificates: {
              where: { status: 'VALID' },
              select: { id: true, serialNumber: true, validTo: true, ownerName: true },
            },
            connections: {
              select: { provider: true, status: true, lastSyncedAt: true },
            },
            _count: {
              select: {
                documents: true,
                counterparties: true,
                products: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => ({
      companyId: m.company.id,
      tin: m.company.tin,
      name: m.company.name,
      shortName: m.company.shortName,
      directorName: m.company.directorName,
      phone: m.company.phone,
      address: m.company.address,
      status: m.company.status,
      userRole: m.role,
      hasEri: m.company.eriCertificates.length > 0,
      activeCertificates: m.company.eriCertificates,
      integrations: m.company.connections,
      counts: m.company._count,
    }));
  }

  // 2. Yangi kompaniya yaratish (va yaratuvchini COMPANY_ADMIN qilib biriktirish)
  async createCompany(userId: string, dto: CreateCompanyDto) {
    const existing = await this.prisma.company.findUnique({
      where: { tin: dto.tin },
    });

    if (existing) {
      // Kompaniya allaqachon mavjud bo'lsa
      const isAlreadyMember = await this.prisma.companyUser.findUnique({
        where: {
          companyId_userId: {
            companyId: existing.id,
            userId,
          },
        },
      });

      if (isAlreadyMember) {
        throw new BadRequestException('Siz ushbu kompaniyaga allaqachon a\'zosiz');
      }

      throw new BadRequestException('Ushbu STIR (TIN) bilan kompaniya ro\'yxatdan o\'tgan. Kompaniya rahbaridan taklif so\'rang.');
    }

    // Kompaniya yaratamiz va avtomatik ravishda userga COMPANY_ADMIN rolini beramiz
    const company = await this.prisma.$transaction(async (tx) => {
      const comp = await tx.company.create({
        data: {
          tin: dto.tin,
          pinfl: dto.pinfl || null,
          name: dto.name,
          shortName: dto.shortName || dto.name,
          directorName: dto.directorName || null,
          address: dto.address || null,
          phone: dto.phone || null,
          email: dto.email || null,
          bankAccount: dto.bankAccount || null,
          bankMfo: dto.bankMfo || null,
          bankName: dto.bankName || null,
          vatPayer: dto.vatPayer ?? false,
          vatNumber: dto.vatNumber || null,
          businessType: dto.businessType || 'MCHJ',
        },
      });

      await tx.companyUser.create({
        data: {
          companyId: comp.id,
          userId,
          role: UserRole.COMPANY_ADMIN,
        },
      });

      // Boshlang'ich standart integratsiya yozuvlarini yaratish
      await tx.integrationConnection.createMany({
        data: [
          { companyId: comp.id, provider: 'DIDOX', status: 'DISCONNECTED' },
          { companyId: comp.id, provider: 'SOLIQ', status: 'DISCONNECTED' },
        ],
      });

      return comp;
    });

    return company;
  }

  // 3. Kompaniya tafsilotlari
  async getCompanyById(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        eriCertificates: true,
        connections: true,
        companyUsers: {
          include: {
            user: {
              select: { id: true, fullName: true, phone: true, email: true },
            },
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Kompaniya topilmadi');
    }

    return company;
  }

  // 4. Kompaniyani tahrirlash
  async updateCompany(companyId: string, dto: UpdateCompanyDto) {
    return this.prisma.company.update({
      where: { id: companyId },
      data: dto,
    });
  }

  // 5. Kompaniya a'zolarini ko'rish
  async getCompanyMembers(companyId: string) {
    return this.prisma.companyUser.findMany({
      where: { companyId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
      },
    });
  }

  // 6. Yangi xodim/buxgalter taklif qilish
  async inviteUser(companyId: string, dto: InviteUserDto) {
    let user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      // Agar tizimda ro'yxatdan o'tmagan bo'lsa, vaqtinchalik hisob yaratamiz
      const temporaryPasswordHash = await bcrypt.hash('123456', 10);
      user = await this.prisma.user.create({
        data: {
          phone: dto.phone,
          fullName: dto.fullName,
          passwordHash: temporaryPasswordHash,
        },
      });
    }

    const existingMember = await this.prisma.companyUser.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      throw new BadRequestException('Bu xodim ushbu kompaniyaga allaqachon qo\'shilgan');
    }

    const membership = await this.prisma.companyUser.create({
      data: {
        companyId,
        userId: user.id,
        role: dto.role,
      },
      include: {
        user: { select: { id: true, fullName: true, phone: true } },
      },
    });

    return membership;
  }

  // 7. Xodim rolini o'zgartirish
  async updateUserRole(companyId: string, targetUserId: string, newRole: UserRole) {
    return this.prisma.companyUser.update({
      where: {
        companyId_userId: {
          companyId,
          userId: targetUserId,
        },
      },
      data: { role: newRole },
    });
  }

  // 8. Xodimni kompaniyadan o'chirish
  async removeUser(companyId: string, targetUserId: string) {
    return this.prisma.companyUser.delete({
      where: {
        companyId_userId: {
          companyId,
          userId: targetUserId,
        },
      },
    });
  }
}
