import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/** Mock auth: mutating requests need header `x-role: admin`. */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    if (req.method === 'GET') return true;
    if (req.headers['x-role'] !== 'admin') throw new ForbiddenException('Admin role required');
    return true;
  }
}
