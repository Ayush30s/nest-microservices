import { Module } from '@nestjs/common';
import { ProductServiceController } from './product-service.controller';
import { ProductServiceService } from './product-service.service';
import { PrimsaModule } from 'libs/common/prismaService/primsa.module';

@Module({
  imports: [PrimsaModule],
  controllers: [ProductServiceController],
  providers: [ProductServiceService],
})
export class ProductServiceModule {}
