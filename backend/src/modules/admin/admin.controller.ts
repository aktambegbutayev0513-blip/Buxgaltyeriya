import { Controller, Get, UseGuards, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('dashboard')
  async getSystemDashboard(@CurrentUser() user: any) {
    if (!user.isSuperAdmin) {
      throw new ForbiddenException('Faqat Super Admin kirishi mumkin');
    }

    const [companiesCount, usersCount, documentsCount, auditLogs] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.user.count(),
      this.prisma.document.count(),
      this.prisma.auditLog.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      systemHealth: 'OK',
      serverTime: new Date().toISOString(),
      stats: {
        totalCompanies: companiesCount,
        totalUsers: usersCount,
        totalDocuments: documentsCount,
      },
      recentLogs: auditLogs,
    };
  }

  @Get('companies')
  async getAllCompanies(@CurrentUser() user: any) {
    if (!user.isSuperAdmin) {
      throw new ForbiddenException('Faqat Super Admin kirishi mumkin');
    }

    return this.prisma.company.findMany({
      include: {
        _count: {
          select: { companyUsers: true, documents: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
