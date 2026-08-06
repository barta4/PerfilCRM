import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_MODULE_KEY } from './require-module.decorator';

@Injectable()
export class ModulesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredModule = this.reflector.getAllAndOverride<string>(REQUIRE_MODULE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredModule) {
      return true; // Si no hay módulo requerido, pasamos
    }

    const { user } = context.switchToHttp().getRequest();
    
    // Si no hay usuario logueado, es un error de auth anterior, devolvemos false para asegurar
    if (!user) return false;

    // Si el usuario tiene allowedModules = null, tiene acceso total
    if (user.allowedModules === null || user.allowedModules === undefined) {
      return true;
    }

    // Comprobar si el módulo requerido está en el array de permitidos
    if (Array.isArray(user.allowedModules) && user.allowedModules.includes(requiredModule)) {
      return true;
    }

    throw new ForbiddenException(`No tienes permisos para acceder al módulo: ${requiredModule}`);
  }
}
