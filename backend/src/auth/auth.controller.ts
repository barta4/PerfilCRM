import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Param,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { UserRole } from './user.entity';

import { RolesGuard } from './roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: any) {
    return this.authService.findById(req.user?.id ?? 0);
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body.token, body.password);
  }
}

// Users CRUD (Admin only)
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private authService: AuthService) {}

  @Get()
  findAll() {
    return this.authService.findAll();
  }

  @Post()
  create(
    @Body()
    body: {
      name: string;
      email: string;
      password: string;
      role?: UserRole;
      allowedModules?: string[] | null;
      imageUrl?: string;
    },
  ) {
    return this.authService.register(
      body.name,
      body.email,
      body.password,
      body.role,
      body.allowedModules,
      body.imageUrl,
    );
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.authService.update(+id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.authService.remove(+id);
    return { success: true };
  }
}
