import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const CurrentCompanyId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const companyId = request.headers['x-company-id'] || request.companyId;
    if (!companyId) {
      throw new UnauthorizedException('Faol kompaniya tanlanmagan (X-Company-Id headeri talab qilinadi)');
    }
    return companyId as string;
  },
);
