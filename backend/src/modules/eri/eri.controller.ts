import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { EriService } from './eri.service';
import { AttachEriCertificateDto, VerifyEriAuthDto } from './eri.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentCompanyId } from '@/common/decorators/current-company.decorator';

@Controller('api/v1/eri')
export class EriController {
  constructor(private readonly eriService: EriService) {}

  @Post('challenge')
  getChallenge() {
    return this.eriService.generateChallenge();
  }

  @Post('verify-auth')
  async verifyAuth(@Body() dto: VerifyEriAuthDto) {
    return this.eriService.verifyEriAuth(dto);
  }

  @Post('attach-certificate')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async attachCertificate(
    @CurrentCompanyId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AttachEriCertificateDto,
  ) {
    return this.eriService.attachCertificate(companyId, userId, dto);
  }

  @Get('certificates')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getCertificates(@CurrentCompanyId() companyId: string) {
    return this.eriService.getCompanyCertificates(companyId);
  }

  @Delete('certificates/:id')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async deleteCertificate(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
  ) {
    return this.eriService.deleteCertificate(companyId, id);
  }
}
