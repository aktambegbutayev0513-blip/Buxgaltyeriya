import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new UnauthorizedException('Avtorizatsiyadan o\'tilmagan');
    }

    if (user.isSuperAdmin) {
      return true; // Super admin barcha kompaniyalarni boshqara oladi
    }

    const companyId = request.headers['x-company-id'] || request.params.companyId || request.body?.companyId;

    if (!companyId) {
      // Ba'zi global marshrutlar uchun (masalan /companies ro'yxati) company_id talab qilinmaydi
      return true;
    }

    // Foydalanuvchi ushbu kompaniyaga a'zomi?
    const membership = await this.prisma.companyUser.findUnique({
      where: {
        companyId_userId: {
          companyId: String(companyId),
          userId: user.id,
        },
      },
      include: {
        company: true,
      },
    });

    if (!membership || !membership.isActive) {
      throw new ForbiddenException('Sizda ushbu kompaniya ma\'lumotlariga kirish huquqi mavjud emas');
    }

    if (membership.company.status === 'BLOCKED') {
      throw new ForbiddenException('Ushbu kompaniya akkaunti bloklangan');
    }

    // Requestga joriy tenant kontekstini biriktiramiz
    request.companyId = membership.companyId;
    request.userRole = membership.role;
    request.userPermissions = membership.permissions;

    return true;
  }
}
