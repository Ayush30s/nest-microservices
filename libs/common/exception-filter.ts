import { Catch, ArgumentsHost } from '@nestjs/common';
import { RpcException, BaseRpcExceptionFilter } from '@nestjs/microservices';
import { throwError } from 'rxjs';

@Catch(RpcException)
export class MicroserviceExceptionFilter extends BaseRpcExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost) {
    const error = exception.getError();

    return throwError(() => ({
      statusCode: 400,
      message: error,
      timestamp: new Date().toISOString(),
    }));
  }
}
