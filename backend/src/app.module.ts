import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { EriModule } from './modules/eri/eri.module';
import { CounterpartiesModule } from './modules/counterparties/counterparties.module';
import { ProductsModule } from './modules/products/products.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CompaniesModule,
    EriModule,
    CounterpartiesModule,
    ProductsModule,
    DocumentsModule,
    AccountingModule,
    IntegrationsModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
