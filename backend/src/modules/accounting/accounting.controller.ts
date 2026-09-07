import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { CreateJournalEntryDto } from './accounting.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { CurrentCompanyId } from '@/common/decorators/current-company.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('api/v1/accounting')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('chart-of-accounts')
  async getChartOfAccounts() {
    return this.accountingService.getChartOfAccounts();
  }

  @Get('journal')
  async getJournal(
    @CurrentCompanyId() companyId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.accountingService.getJournal(companyId, startDate, endDate);
  }

  @Post('journal')
  async createJournalEntry(
    @CurrentCompanyId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateJournalEntryDto,
  ) {
    return this.accountingService.createJournalEntry(companyId, userId, dto);
  }

  @Get('reports/osv')
  async getTurnoverBalanceSheet(
    @CurrentCompanyId() companyId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.accountingService.getTurnoverBalanceSheet(companyId, startDate, endDate);
  }

  @Get('dashboard-kpi')
  async getDashboardKpi(@CurrentCompanyId() companyId: string) {
    return this.accountingService.getCompanyDashboardSummary(companyId);
  }
}
