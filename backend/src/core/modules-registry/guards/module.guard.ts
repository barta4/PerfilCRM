import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MODULE_KEY } from '../decorators/requires-module.decorator';
import { ModuleRegistryService } from '../module-registry.service';

@Injectable()
export class ModuleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private moduleRegistryService: ModuleRegistryService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.getAllAndOverride<string>(
      MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredModule) {
      return true; // No module required for this endpoint
    }

    const isEnabled = await this.moduleRegistryService.isModuleEnabled(requiredModule);
    if (!isEnabled) {
      throw new ForbiddenException(
        `El módulo '${requiredModule}' está desactivado para esta organización. Actívelo en Administración > Módulos.`,
      );
    }

    return true;
  }
}
