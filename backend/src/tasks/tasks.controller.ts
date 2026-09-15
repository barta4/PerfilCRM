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
import { TasksService } from './tasks.service';
import { Task } from './task.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModulesGuard } from '../auth/modules.guard';
import { RequireModule } from '../auth/require-module.decorator';

@Controller('tasks')
@RequireModule('tasks')
@UseGuards(JwtAuthGuard, ModulesGuard)
export class TasksController {
  constructor(private readonly service: TasksService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  create(@Body() data: Partial<Task>, @Request() req: any) {
    return this.service.create(data, req?.user?.userId || req?.user?.id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<Task>, @Request() req: any) {
    return this.service.update(+id, data, req?.user?.userId || req?.user?.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(+id, req?.user?.userId || req?.user?.id);
  }
}
