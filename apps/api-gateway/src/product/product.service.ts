import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
@Injectable()
export class ProductService {
  constructor(
    @Inject('PRODUCT_SERVICE') private readonly productClient: ClientProxy,
  ) {}

  async getAllProducts() {
    return lastValueFrom(this.productClient.send({ cmd: 'get_all_products' }, {}));
  }
}
