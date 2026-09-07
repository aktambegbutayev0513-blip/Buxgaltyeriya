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
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './products.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { CurrentCompanyId } from '@/common/decorators/current-company.decorator';

@Controller('api/v1/products')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(
    @CurrentCompanyId() companyId: string,
    @Query('search') search?: string,
  ) {
    return this.productsService.findAll(companyId, search);
  }

  @Get('ikpu/search')
  async searchIkpu(@Query('q') q: string) {
    return this.productsService.searchIkpu(q);
  }

  @Get(':id')
  async findOne(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
  ) {
    return this.productsService.findOne(companyId, id);
  }

  @Post()
  async create(
    @CurrentCompanyId() companyId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(companyId, dto);
  }

  @Put(':id')
  async update(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(companyId, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
  ) {
    return this.productsService.remove(companyId, id);
  }
}
