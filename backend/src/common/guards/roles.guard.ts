import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const currentRole = request.userRole || user?.activeRole;

    if (user?.isSuperAdmin) {
      return true;
    }

    if (!currentRole || !requiredRoles.includes(currentRole)) {
      throw new ForbiddenException(
        `Ushbu amalni bajarish uchun ruxsat etilgan rollar: [${requiredRoles.join(', ')}]. Sizning rolingiz: ${currentRole || 'NOMA\'LUM'}`
      );
    }

    return true;
  }
}
