import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { PdfGeneratorService } from './pdf-generator.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, PdfGeneratorService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
