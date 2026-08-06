import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersRepository = {
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(() => 'mock_token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw exception on invalid login', async () => {
    mockUsersRepository.findOne.mockResolvedValue(null);
    await expect(service.login('test@test.com', 'wrongpass')).rejects.toThrow(
      'Credenciales inválidas',
    );
  });
});
