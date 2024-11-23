import { PagamentoGateway } from '../src/infra/database/gateways/PagamentoGateway';
import { Repository } from 'typeorm';
import { Pagamento } from '../src/domain/entities/Pagamento';
import { PagamentoRepository } from '../src/infra/database/repositories/Pagamento';
import { Preco } from '../src/shared/valueobjects/Preco';
import { StatusPagamento } from '../src/shared/enums/StatusPagamento';
import { IPedido } from '../src/application/interfaces/IPedido';
import { AppDataSource } from '../src/infra/database/data-source';

jest.mock('../src/infra/database/data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn(),
    },
}));

describe('PagamentoGateway', () => {
    let pagamentoGateway: PagamentoGateway;
    let mockRepository: jest.Mocked<Repository<PagamentoRepository>>;

    beforeEach(() => {
        mockRepository = {
            findOne: jest.fn(),
            save: jest.fn(),
        } as unknown as jest.Mocked<Repository<PagamentoRepository>>;

        (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);

        pagamentoGateway = new PagamentoGateway();
    });

    it('deve buscar um pagamento com sucesso', async () => {
        const mockPagamentoRepository = {
            id: 1,
            pedido: 123,
            valor: 100,
            status: StatusPagamento.AGUARDANDO_RESPOSTA,
            identificador_pedido: '123ABC',
            qrcode: 'qrcode123',
        };

        mockRepository.findOne.mockResolvedValue(mockPagamentoRepository);

        const resultado = await pagamentoGateway.buscarPagamento(123);

        expect(mockRepository.findOne).toHaveBeenCalledWith({
            where: { pedido: 123 },
            relations: ['pedido'],
            order: { id: 'DESC' },
        });
        expect(resultado).toBeInstanceOf(Pagamento);
        expect(resultado.id).toBe(1);
        expect(resultado.identificadorPedido).toBe('123ABC');
    });

    it('deve lançar erro se pagamento não for encontrado', async () => {
        mockRepository.findOne.mockResolvedValue(null);

        await expect(pagamentoGateway.buscarPagamento(123)).rejects.toThrow('Pagamento não encontrado');
    });

    it('deve atualizar um pagamento com sucesso', async () => {
        const mockPagamentoRepository = {
            id: 1,
            pedido: 123,
            valor: 100,
            status: StatusPagamento.AGUARDANDO_RESPOSTA,
            identificador_pedido: '123ABC',
            qrcode: 'qrcode123',
        };

        const mockPagamento = new Pagamento(1, 123, new Preco(150));
        mockPagamento.status = StatusPagamento.PAGO;
        mockPagamento.identificadorPedido = '123XYZ';
        mockPagamento.qrCode = 'qrcode456';

        mockRepository.findOne.mockResolvedValue(mockPagamentoRepository);
        mockRepository.save.mockResolvedValue({
            ...mockPagamentoRepository,
            valor: 150,
            status: StatusPagamento.PAGO,
            identificador_pedido: '123XYZ',
            qrcode: 'qrcode456',
        });

        const resultado = await pagamentoGateway.atualizarPagamento(mockPagamento);

        expect(mockRepository.findOne).toHaveBeenCalledWith({
            where: { id: 1 },
            relations: ['pedido'],
            order: { id: 'DESC' },
        });
        expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            id: 1,
            valor: 150,
            status: StatusPagamento.PAGO,
            identificador_pedido: '123XYZ',
            qrcode: 'qrcode456',
        }));
        expect(resultado).toBeInstanceOf(Pagamento);
        expect(resultado.status).toBe(StatusPagamento.PAGO);
    });

    it('deve lançar erro se pagamento não for encontrado para atualizar', async () => {
        const mockPagamento = new Pagamento(1, 123, new Preco(150));

        mockRepository.findOne.mockResolvedValue(null);

        await expect(pagamentoGateway.atualizarPagamento(mockPagamento)).rejects.toThrow('Pagamento não encontrado');
    });

    it('deve lançar erro se pagamento não possuir id preenchido', async () => {
        const mockPagamento = new Pagamento(0, 123, new Preco(150));

        mockRepository.findOne.mockResolvedValue(null);

        await expect(pagamentoGateway.atualizarPagamento(mockPagamento)).rejects.toThrow('Pagamento não gravado');
    });

    it('deve buscar um código do integrador com sucesso', async () => {
        const mockPagamentoRepository = {
            id: 1,
            pedido: 123,
            valor: 100,
            status: StatusPagamento.AGUARDANDO_RESPOSTA,
            identificador_pedido: '123ABC',
            qrcode: 'qrcode123',
        };

        mockRepository.findOne.mockResolvedValue(mockPagamentoRepository);

        const resultado = await pagamentoGateway.buscarPagamentoPeloIntegrador('123ABC');

        expect(mockRepository.findOne).toHaveBeenCalledWith({
            where: { identificador_pedido: '123ABC' }
        });
        expect(resultado).toBeInstanceOf(Pagamento);
        expect(resultado.id).toBe(1);
        expect(resultado.identificadorPedido).toBe('123ABC');
    });

    it('deve lançar erro se código de integrador não for encontrado', async () => {
        mockRepository.findOne.mockResolvedValue(null);

        await expect(pagamentoGateway.buscarPagamentoPeloIntegrador('123ABC')).rejects.toThrow('Pedido integrador não encontrado');
    });

    it('deve iniciar um pagamento com sucesso', async () => {
        const mockPedido: IPedido = {
            id: 123,
            data: new Date(),
            status: 'ENVIAR_PARA_PAGAMENTO',
            cliente: { id: 1, nome: 'Cliente Teste', email: 'teste@email.com', cpf: '12345678900' },
            valorTotal: new Preco(100),
            itens: [],
        };

        const mockPagamentoRepository = {
            id: 1,
            pedido: 123,
            valor: 100,
            status: StatusPagamento.AGUARDANDO_RESPOSTA,
            identificador_pedido: '',
            qrcode: '',
        };

        mockRepository.save.mockResolvedValue(mockPagamentoRepository);

        const resultado = await pagamentoGateway.iniciarPagamento(mockPedido);

        expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            pedido: 123,
            valor: 100,
            status: StatusPagamento.AGUARDANDO_RESPOSTA,
        }));
        expect(resultado).toBeInstanceOf(Pagamento);
        expect(resultado.status).toBe(StatusPagamento.AGUARDANDO_RESPOSTA);
    });
});
