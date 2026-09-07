import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body, headers } = request;
    const ip = request.ip || headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = headers['user-agent'] || '';

    // Faqat o'zgartiruvchi operatsiyalarni (POST, PUT, PATCH, DELETE) audit qilamiz
    const isModifying = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    return next.handle().pipe(
      tap(async (responseBody) => {
        if (isModifying && user) {
          try {
            await this.prisma.auditLog.create({
              data: {
                companyId: request.companyId || null,
                userId: user.id || null,
                action: `${method} ${url}`,
                entityName: url.split('/')[3] || 'GENERAL',
                entityId: responseBody?.id || request.params?.id || null,
                newData: body ? JSON.parse(JSON.stringify(body)) : null,
                ipAddress: String(ip),
                userAgent: String(userAgent),
              },
            });
          } catch (err) {
            console.error('AuditLog yozishda xatolik:', err);
          }
        }
      }),
    );
  }
}
