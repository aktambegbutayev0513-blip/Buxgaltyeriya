import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { DidoxAdapter } from './didox.adapter';
import { SoliqAdapter } from './soliq.adapter';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { CurrentCompanyId } from '@/common/decorators/current-company.decorator';
import { PrismaService } from '@/prisma/prisma.service';

@Controller('api/v1/integrations')
@UseGuards(JwtAuthGuard, TenantGuard)
export class IntegrationsController {
  constructor(
    private readonly didoxAdapter: DidoxAdapter,
    private readonly soliqAdapter: SoliqAdapter,
    private readonly prisma: PrismaService,
  ) {}

  @Get('status')
  async getStatus(@CurrentCompanyId() companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { connections: true },
    });

    return {
      companyTin: company?.tin,
      connections: company?.connections || [],
    };
  }

  @Post('didox/test')
  async testDidox(@Body('apiKey') apiKey: string) {
    return this.didoxAdapter.checkConnection(apiKey || 'TEST_KEY');
  }

  @Get('soliq/debts')
  async getSoliqDebts(@CurrentCompanyId() companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    return this.soliqAdapter.getTaxDebts(company?.tin || '000000000');
  }
}
