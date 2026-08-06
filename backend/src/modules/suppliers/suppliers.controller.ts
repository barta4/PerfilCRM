import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ModuleGuard } from '../../core/modules-registry/guards/module.guard';
import { RequiresModule } from '../../core/modules-registry/decorators/requires-module.decorator';
import { Client } from '../../clients/client.entity';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule('procurement_suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  async findAll(): Promise<Client[]> {
    return this.suppliersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Client | null> {
    return this.suppliersService.findOne(id);
  }

  @Post()
  async create(@Body() dto: Partial<Client>): Promise<Client> {
    return this.suppliersService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<Client>,
  ): Promise<Client | null> {
    return this.suppliersService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.suppliersService.remove(id);
    return { success: true };
  }
}
