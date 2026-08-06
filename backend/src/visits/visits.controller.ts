import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { VisitsService } from './visits.service';
import { Visit } from './visit.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModulesGuard } from '../auth/modules.guard';
import { RequireModule } from '../auth/require-module.decorator';

@Controller('visits')
@RequireModule('visits')
@UseGuards(JwtAuthGuard, ModulesGuard)
export class VisitsController {
  constructor(private readonly service: VisitsService) {}

  @Get()
  findAll(@Query('clientId') clientId?: string) {
    return this.service.findAll(clientId ? +clientId : undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  create(@Body() data: Partial<Visit>, @Req() req: any) {
    return this.service.create({
      ...data,
      createdBy: req.user ? { id: req.user.id } as any : undefined,
    });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<Visit>) {
    return this.service.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
