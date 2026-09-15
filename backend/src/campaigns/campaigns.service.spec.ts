import { Test, TestingModule } from '@nestjs/testing';
import { CampaignsService } from './campaigns.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Campaign } from './campaign.entity';
import { EmailLog } from './email-log.entity';
import { Contact } from '../contacts/contact.entity';
import { Client } from '../clients/client.entity';
import { EmailService } from '../notifications/email.service';
import { User } from '../auth/user.entity';

describe('CampaignsService', () => {
  let service: CampaignsService;

  const mockCampaign: Partial<Campaign> = {
    id: 1,
    subject: 'Novedades Perfilgranos para {client_name}',
    content: '<p>Estimado {contact_name}, le escribimos de Perfilgranos.</p>',
    createdAt: new Date(),
  };

  const mockCampaignRepository = {
    find: jest.fn().mockResolvedValue([mockCampaign]),
    findOne: jest.fn().mockResolvedValue(mockCampaign),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((entity) =>
      Promise.resolve({ id: 1, ...entity }),
    ),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockLogRepository = {
    countBy: jest.fn().mockResolvedValue(10),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((entity) =>
      Promise.resolve({ id: 'log-uuid-123', ...entity }),
    ),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(5),
    })),
  };

  const mockContactQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([
      {
        id: 1,
        name: 'Juan Pérez',
        email: 'juan@cliente.com',
        client: { businessName: 'Agro del Norte' },
      },
    ]),
  };

  const mockContactRepository = {
    createQueryBuilder: jest.fn(() => mockContactQueryBuilder),
  };

  const mockClientRepository = {
    find: jest.fn().mockResolvedValue([]),
  };

  const mockEmailService = {
    sendEmail: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        {
          provide: getRepositoryToken(Campaign),
          useValue: mockCampaignRepository,
        },
        {
          provide: getRepositoryToken(EmailLog),
          useValue: mockLogRepository,
        },
        {
          provide: getRepositoryToken(Contact),
          useValue: mockContactRepository,
        },
        {
          provide: getRepositoryToken(Client),
          useValue: mockClientRepository,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list all campaigns with aggregated statistics', async () => {
    const campaigns = await service.findAll();
    expect(campaigns).toBeDefined();
    expect(campaigns).toHaveLength(1);
    expect(campaigns[0].stats).toBeDefined();
    expect(campaigns[0].stats.total).toBe(10);
  });

  it('should create campaign and initialize email logs', async () => {
    const mockUser = { id: 1, name: 'Admin', email: 'admin@perfil.com' } as User;
    const campaignData = {
      subject: 'Oferta Especial Granos',
      content: '<p>Hola {contact_name}</p>',
      segments: ['all'],
      statuses: ['all'],
    };

    const result = await service.createCampaign(
      campaignData,
      mockUser,
      'http://localhost:3001',
    );

    expect(result).toBeDefined();
    expect(result.subject).toBe('Oferta Especial Granos');
    expect(mockCampaignRepository.save).toHaveBeenCalled();
  });
});
