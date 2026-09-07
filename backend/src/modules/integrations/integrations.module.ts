import { Module } from '@nestjs/common';
import { DidoxAdapter } from './didox.adapter';
import { SoliqAdapter } from './soliq.adapter';
import { IntegrationsController } from './integrations.controller';

@Module({
  controllers: [IntegrationsController],
  providers: [DidoxAdapter, SoliqAdapter],
  exports: [DidoxAdapter, SoliqAdapter],
})
export class IntegrationsModule {}
