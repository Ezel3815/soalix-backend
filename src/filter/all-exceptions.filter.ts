import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
  import { Request, Response } from 'express';
  
  @Catch()
  export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
  
      let status = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Internal server error';
      let details: string[] = [];
  
      if (exception instanceof HttpException) {
        status = exception.getStatus();
        const res = exception.getResponse();
  
        if (typeof res === 'string') {
          message = res;
          details = [res];
        } else if (typeof res === 'object' && res !== null) {
          const body: any = res;
  
          if (Array.isArray(body.details) && body.details.length > 0) {
            // If details exist, use them
            details = body.details.flat();
            message = details[0]; // show first detail in message
          } else if (Array.isArray(body.message) && body.message.length > 0) {
            // No details but message is array
            details = body.message;
            message = body.message[0];
          } else if (body.message) {
            // message is string or other
            message = String(body.message);
            details = [message];
          }
        }
      }
  
            response.status(status).json({
        status,
        message,
        details,
        path: request.url,
        timestamp: new Date().toISOString(),
      });

      console.log(`ERROR ${status} on ${request.method} ${request.url}:`, message, details);
    }
  }
  
