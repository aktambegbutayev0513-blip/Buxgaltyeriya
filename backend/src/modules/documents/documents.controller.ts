import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { PdfGeneratorService } from './pdf-generator.service';
import {
  CreateDocumentDto,
  SignDocumentDto,
  RejectDocumentDto,
} from './documents.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { CurrentCompanyId } from '@/common/decorators/current-company.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { DocumentStatus, DocumentType } from '@prisma/client';

@Controller('api/v1/documents')
@UseGuards(JwtAuthGuard, TenantGuard)
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly pdfGeneratorService: PdfGeneratorService,
  ) {}

  @Get()
  async findAll(
    @CurrentCompanyId() companyId: string,
    @Query('status') status?: DocumentStatus,
    @Query('type') type?: DocumentType,
    @Query('search') search?: string,
  ) {
    return this.documentsService.findAll(companyId, { status, type, search });
  }

  @Get(':id')
  async findOne(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
  ) {
    return this.documentsService.findOne(companyId, id);
  }

  @Post()
  async create(
    @CurrentCompanyId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.documentsService.create(companyId, userId, dto);
  }

  @Get(':id/sign-hash')
  async getSignHash(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
  ) {
    return this.documentsService.getDocumentSignHash(companyId, id);
  }

  @Post(':id/sign')
  async sign(
    @CurrentCompanyId() companyId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: SignDocumentDto,
  ) {
    return this.documentsService.signDocument(companyId, userId, id, dto);
  }

  @Post(':id/send')
  async send(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
  ) {
    return this.documentsService.sendDocument(companyId, id);
  }

  @Post(':id/reject')
  async reject(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body() dto: RejectDocumentDto,
  ) {
    return this.documentsService.rejectDocument(companyId, id, dto);
  }

  @Get(':id/pdf')
  async getPdf(
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const document = await this.documentsService.findOne(companyId, id);
    const pdfBuffer = await this.pdfGeneratorService.generateDocumentPdf(document);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Factura_${document.docNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
