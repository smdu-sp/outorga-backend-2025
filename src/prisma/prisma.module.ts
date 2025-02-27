import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { BiService } from './bi.service';
import { SguService } from './sgu.service';

@Global()
@Module({
  providers: [PrismaService, BiService, SguService],
  exports: [PrismaService, BiService, SguService],
})
export class PrismaModule {}
