import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateCounterpartyDto, UpdateCounterpartyDto } from './counterparties.dto';

@Injectable()
export class CounterpartiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, search?: string) {
    return this.prisma.counterparty.findMany({
      where: {
        companyId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { tin: { contains: search } },
              ],
            }
          : {}),
      },
      include: {
        _count: {
          select: { documents: true, contracts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const counterparty = await this.prisma.counterparty.findFirst({
      where: { id, companyId },
      include: {
        contracts: true,
        documents: {
          take: 20,
          orderBy: { docDate: 'desc' },
        },
      },
    });

    if (!counterparty) {
      throw new NotFoundException('Kontragent topilmadi');
    }

    return counterparty;
  }

  async create(companyId: string, dto: CreateCounterpartyDto) {
    const existing = await this.prisma.counterparty.findUnique({
      where: {
        companyId_tin: {
          companyId,
          tin: dto.tin,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Ushbu STIRli kontragent allaqachon mavjud');
    }

    return this.prisma.counterparty.create({
      data: {
        companyId,
        ...dto,
      },
    });
  }

  async update(companyId: string, id: string, dto: UpdateCounterpartyDto) {
    await this.findOne(companyId, id);

    return this.prisma.counterparty.update({
      where: { id },
      data: dto,
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);

    return this.prisma.counterparty.delete({
      where: { id },
    });
  }

  // STIR bo'yicha davlat reestri yoki Didox/Soliqdan avto-lookup (mock/fallback)
  async lookupByTin(tin: string) {
    return {
      tin,
      name: `"${tin}" STIRli korxona`,
      directorName: 'Rahbar Test',
      address: 'Toshkent shahri, Yunusobod tumani',
      bankAccount: '20208000900000000001',
      bankMfo: '00444',
      bankName: 'AT "Aloqabank"',
      vatPayer: true,
    };
  }
}
