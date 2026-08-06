import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (request.query && request.query.token && !request.headers.authorization) {
      request.headers.authorization = `Bearer ${request.query.token}`;
    }
    if (
      process.env.AUTH_BYPASS === 'true' &&
      process.env.NODE_ENV !== 'production'
    )
      return true;
    return super.canActivate(context);
  }
}
