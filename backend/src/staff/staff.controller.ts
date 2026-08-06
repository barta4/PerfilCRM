import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModulesGuard } from '../auth/modules.guard';
import { RequireModule } from '../auth/require-module.decorator';

import { Cleaner } from './cleaner.entity';
import { Schedule } from './schedule.entity';

@Controller('staff')
@RequireModule('staff')
@UseGuards(JwtAuthGuard, ModulesGuard)
export class StaffController {
  constructor(private readonly service: StaffService) {}

  @Get('cleaners')
  findAllCleaners() {
    return this.service.findAllCleaners();
  }

  @Post('cleaners')
  createCleaner(@Body() data: Partial<Cleaner>) {
    return this.service.createCleaner(data);
  }

  @Put('cleaners/:id')
  updateCleaner(@Param('id') id: string, @Body() data: Partial<Cleaner>) {
    return this.service.updateCleaner(+id, data);
  }

  @Delete('cleaners/:id')
  deleteCleaner(@Param('id') id: string) {
    return this.service.deleteCleaner(+id);
  }

  @Get('schedules')
  findAllSchedules(
    @Query('clientId') clientId?: string,
    @Query('cleanerId') cleanerId?: string,
  ) {
    if (clientId) {
      return this.service.findSchedulesByClient(+clientId);
    }
    if (cleanerId) {
      return this.service.findSchedulesByCleaner(+cleanerId);
    }
    return this.service.findAllSchedules();
  }

  @Post('schedules')
  createSchedule(@Body() data: Partial<Schedule>) {
    return this.service.createSchedule(data);
  }

  @Delete('schedules/:id')
  deleteSchedule(@Param('id') id: string) {
    return this.service.deleteSchedule(+id);
  }
}
