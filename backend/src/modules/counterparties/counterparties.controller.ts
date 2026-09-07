import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CounterpartiesService } from './counterparties.service';
import { CreateCounterpartyDto, UpdateCounterpartyDto } from './counterparties.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { CurrentCompanyId } from '@/common/decorators/current-company.decorator';

@Controller('api/v1/counterparties')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CounterpartiesController {
  constructor(private readonly counterpartiesService: CounterpartiesService) {}

  @Get()
  async findAll(
    @CurrentCompanyId() companyId: string,
    @Query('search') search?: string,
  ) {
    return this.counterpartiesService.findAll(companyId, search);
  }

  @Get('lookup/:tin')
  async lookupByTin(@Param('tin') tin: string) {
    return this.counterpartiesService.lookupByTin(tin);
  }

  @Get(':id')
  async findOne(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
  ) {
    return this.counterpartiesService.findOne(companyId, id);
  }

  @Post()
  async create(
    @CurrentCompanyId() companyId: string,
    @Body() dto: CreateCounterpartyDto,
  ) {
    return this.counterpartiesService.create(companyId, dto);
  }

  @Put(':id')
  async update(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCounterpartyDto,
  ) {
    return this.counterpartiesService.update(companyId, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
  ) {
    return this.counterpartiesService.remove(companyId, id);
  }
}
