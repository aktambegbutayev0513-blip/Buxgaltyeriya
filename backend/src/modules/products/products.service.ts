import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './products.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, search?: string) {
    return this.prisma.product.findMany({
      where: {
        companyId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { ikpuCode: { contains: search } },
                { barcode: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, companyId },
    });

    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi');
    }

    return product;
  }

  async create(companyId: string, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        companyId,
        ...dto,
      },
    });
  }

  async update(companyId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(companyId, id);

    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);

    return this.prisma.product.delete({
      where: { id },
    });
  }

  // MXIK (IKPU) klassifikatori bo'yicha tezkor qidiruv katalogi
  async searchIkpu(query: string) {
    const sampleCatalog = [
      { ikpuCode: '06201001001000000', name: 'Buxgalteriya va audit xizmatlari', unitCode: '1001', unitName: 'Xizmat' },
      { ikpuCode: '06209001001000000', name: 'Axborot texnologiyalari va dasturlash xizmatlari', unitCode: '1001', unitName: 'Xizmat' },
      { ikpuCode: '01111001001000000', name: 'Bug\'doy uni (1-nav)', unitCode: '166', unitName: 'kg' },
      { ikpuCode: '04791001001000000', name: 'Ofis jihozlari va kanselyariya mollari', unitCode: '796', unitName: 'dona' },
      { ikpuCode: '04932001001000000', name: 'Yuk tashish xizmatlari (avtotransport)', unitCode: '1001', unitName: 'Xizmat' },
    ];

    if (!query) return sampleCatalog;
    return sampleCatalog.filter(
      (item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.ikpuCode.includes(query),
    );
  }
}
