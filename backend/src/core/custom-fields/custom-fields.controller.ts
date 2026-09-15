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
import { CustomFieldsService } from './custom-fields.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '../../auth/user.entity';

@Controller('core/custom-fields')
@UseGuards(JwtAuthGuard)
export class CustomFieldsController {
  constructor(private readonly customFieldsService: CustomFieldsService) {}

  @Get()
  async getAllDefinitions() {
    return this.customFieldsService.getAllDefinitions();
  }

  @Get(':entityType')
  async getForEntity(@Param('entityType') entityType: string) {
    return this.customFieldsService.getDefinitionsForEntity(entityType);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createDefinition(@Body() dto: any) {
    return this.customFieldsService.createDefinition(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateDefinition(@Param('id') id: string, @Body() dto: any) {
    return this.customFieldsService.updateDefinition(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteDefinition(@Param('id') id: string) {
    return this.customFieldsService.deleteDefinition(id);
  }
}
