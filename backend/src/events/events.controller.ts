import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { Event } from './event.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModulesGuard } from '../auth/modules.guard';
import { RequireModule } from '../auth/require-module.decorator';

@Controller('events')
@RequireModule('events')
@UseGuards(JwtAuthGuard, ModulesGuard)
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  create(@Body() data: Partial<Event>, @Request() req: any) {
    return this.service.create(data, req?.user?.userId || req?.user?.id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<Event>, @Request() req: any) {
    return this.service.update(+id, data, req?.user?.userId || req?.user?.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(+id, req?.user?.userId || req?.user?.id);
  }
}
