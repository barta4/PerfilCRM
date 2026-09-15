import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Client } from './client.entity';

describe('ClientsService', () => {
  let service: ClientsService;

  const mockClient: Partial<Client> = {
    id: 1,
    code: 'TER-00123',
    businessName: 'Agropecuaria del Este SRL',
    taxId: '219998880011',
    isClient: true,
    isSupplier: false,
    status: 'Activo',
  };

  const mockClientRepository = {
    find: jest.fn().mockResolvedValue([mockClient]),
    findOneBy: jest.fn().mockResolvedValue(mockClient),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((entity) =>
      Promise.resolve({ id: 1, ...entity }),
    ),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: getRepositoryToken(Client),
          useValue: mockClientRepository,
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all clients with default filter', async () => {
    const result = await service.findAll();
    expect(result).toHaveLength(1);
    expect(mockClientRepository.find).toHaveBeenCalled();
  });

  it('should auto-generate client code if omitted during creation', async () => {
    const newClientData = {
      businessName: 'Molinos del Sur SA',
      taxId: '211234560012',
    };

    const created = await service.create(newClientData);
    expect(created.code).toBeDefined();
    expect(created.code).toMatch(/^TER-/);
    expect(created.businessName).toBe('Molinos del Sur SA');
  });

  it('should find a client by id', async () => {
    const client = await service.findOne(1);
    expect(client).toBeDefined();
    expect(client?.id).toBe(1);
  });

  it('should delete a client by id', async () => {
    await service.remove(1);
    expect(mockClientRepository.delete).toHaveBeenCalledWith(1);
  });
});
