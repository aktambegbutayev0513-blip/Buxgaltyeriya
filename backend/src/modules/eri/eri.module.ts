import { Module } from '@nestjs/common';
import { EriService } from './eri.service';
import { EriController } from './eri.controller';

@Module({
  controllers: [EriController],
  providers: [EriService],
  exports: [EriService],
})
export class EriModule {}
