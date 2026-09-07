import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto, InviteUserDto } from './companies.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('api/v1/companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  async getMyCompanies(@CurrentUser('id') userId: string) {
    return this.companiesService.getUserCompanies(userId);
  }

  @Post()
  async createCompany(@CurrentUser('id') userId: string, @Body() dto: CreateCompanyDto) {
    return this.companiesService.createCompany(userId, dto);
  }

  @Get(':companyId')
  @UseGuards(TenantGuard)
  async getCompanyById(@Param('companyId') companyId: string) {
    return this.companiesService.getCompanyById(companyId);
  }

  @Put(':companyId')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DIRECTOR)
  async updateCompany(
    @Param('companyId') companyId: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.updateCompany(companyId, dto);
  }

  @Get(':companyId/users')
  @UseGuards(TenantGuard)
  async getCompanyMembers(@Param('companyId') companyId: string) {
    return this.companiesService.getCompanyMembers(companyId);
  }

  @Post(':companyId/users/invite')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DIRECTOR)
  async inviteUser(
    @Param('companyId') companyId: string,
    @Body() dto: InviteUserDto,
  ) {
    return this.companiesService.inviteUser(companyId, dto);
  }

  @Put(':companyId/users/:userId/role')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DIRECTOR)
  async updateUserRole(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
    @Body('role') role: UserRole,
  ) {
    return this.companiesService.updateUserRole(companyId, userId, role);
  }

  @Delete(':companyId/users/:userId')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.DIRECTOR)
  async removeUser(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
  ) {
    return this.companiesService.removeUser(companyId, userId);
  }
}
