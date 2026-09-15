import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuleRegistry } from './module-registry.entity';
import { ModuleRegistryService } from './module-registry.service';
import { ModuleRegistryController } from './module-registry.controller';
import { ModuleGuard } from './guards/module.guard';

import { AuthModule } from '../../auth/auth.module';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ModuleRegistry]), AuthModule],
  providers: [ModuleRegistryService, ModuleGuard],
  controllers: [ModuleRegistryController],
  exports: [ModuleRegistryService, ModuleGuard],
})
export class ModuleRegistryModule {}
