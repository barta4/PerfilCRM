import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ModuleRegistryService } from './module-registry.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '../../auth/user.entity';

@Controller('core/modules')
export class ModuleRegistryController {
  constructor(private readonly moduleRegistryService: ModuleRegistryService) {}

  @Get()
  async getAllModules() {
    return this.moduleRegistryService.getAllModules();
  }

  @Get('enabled')
  async getEnabledModules() {
    return this.moduleRegistryService.getEnabledModules();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/toggle')
  async toggleModule(
    @Param('id') id: string,
    @Body('isEnabled') isEnabled: boolean,
  ) {
    return this.moduleRegistryService.toggleModule(id, isEnabled);
  }
}
