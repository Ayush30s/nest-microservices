import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class RpcToHttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const error = exception?.response || exception;

    const statusCode =
      typeof error?.statusCode === 'number'
        ? error.statusCode
        : HttpStatus.BAD_REQUEST;

    response.status(statusCode).json({
      statusCode,
      type: error?.type || 'error',
      message: error?.message || 'Internal server error',
      data: null,
    });
  }
}
