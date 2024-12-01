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

describe('Gateway de pagamentos', () => {
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

    describe("Cenário: Buscar um pagamento com sucesso", () => {
        it("DADO um identificador de pedido válido, QUANDO eu buscar o pagamento, ENTÃO o pagamento deve ser retornado com sucesso", async () => {
            const mockPagamentoRepository = {
                id: 1,
                pedido: '123',
                valor: 100,
                status: StatusPagamento.AGUARDANDO_RESPOSTA,
                identificador_pedido: '123ABC',
                qrcode: 'qrcode123',
            };

            mockRepository.findOne.mockResolvedValue(mockPagamentoRepository);

            const resultado = await pagamentoGateway.buscarPagamento('123');

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { pedido: '123' },
                order: { id: 'DESC' },
            });
            expect(resultado).toBeInstanceOf(Pagamento);
            expect(resultado.id).toBe(1);
            expect(resultado.identificadorPedido).toBe('123ABC');
        });
    });

    describe("Cenário: Lançar erro se pagamento não for encontrado", () => {
        it("DADO um identificador de pedido inválido, QUANDO eu buscar o pagamento, ENTÃO deve lançar um erro dizendo 'Pagamento não encontrado'", async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(pagamentoGateway.buscarPagamento('123')).rejects.toThrow('Pagamento não encontrado');
        });
    });

    describe("Cenário: Atualizar um pagamento com sucesso", () => {
        it("DADO um pagamento existente, QUANDO eu atualizar suas informações, ENTÃO o pagamento deve ser atualizado com sucesso", async () => {
            const mockPagamentoRepository = {
                id: 1,
                pedido: '123',
                valor: 100,
                status: StatusPagamento.AGUARDANDO_RESPOSTA,
                identificador_pedido: '123ABC',
                qrcode: 'qrcode123',
            };

            const mockPagamento = new Pagamento(1, '123', new Preco(150));
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
    });

    describe("Cenário: Lançar erro ao atualizar um pagamento não encontrado", () => {
        it("DADO um pagamento inexistente, QUANDO eu tentar atualizá-lo, ENTÃO deve lançar um erro dizendo 'Pagamento não encontrado'", async () => {
            const mockPagamento = new Pagamento(1, '123', new Preco(150));

            mockRepository.findOne.mockResolvedValue(null);

            await expect(pagamentoGateway.atualizarPagamento(mockPagamento)).rejects.toThrow('Pagamento não encontrado');
        });
    });

    describe("Cenário: Lançar erro ao tentar atualizar um pagamento sem ID preenchido", () => {
        it("DADO um pagamento sem ID preenchido, QUANDO eu tentar atualizá-lo, ENTÃO deve lançar um erro dizendo 'Pagamento não gravado'", async () => {
            const mockPagamento = new Pagamento(0, '123', new Preco(150));

            mockRepository.findOne.mockResolvedValue(null);

            await expect(pagamentoGateway.atualizarPagamento(mockPagamento)).rejects.toThrow('Pagamento não gravado');
        });
    });

    describe("Cenário: Buscar um pagamento pelo integrador com sucesso", () => {
        it("DADO um identificador do integrador válido, QUANDO eu buscar o pagamento, ENTÃO o pagamento deve ser retornado com sucesso", async () => {
            const mockPagamentoRepository = {
                id: 1,
                pedido: '123',
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
    });

    describe("Cenário: Lançar erro se código de integrador não for encontrado", () => {
        it("DADO um identificador do integrador inválido, QUANDO eu buscar o pagamento, ENTÃO deve lançar um erro dizendo 'Pedido integrador não encontrado'", async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(pagamentoGateway.buscarPagamentoPeloIntegrador('123ABC')).rejects.toThrow('Pedido integrador não encontrado');
        });
    });

    describe("Cenário: Iniciar um pagamento com sucesso", () => {
        it("DADO um pedido válido, QUANDO eu iniciar o pagamento, ENTÃO o pagamento deve ser criado com status 'Aguardando Resposta'", async () => {
            const mockPedido: IPedido = {
                id: '123',
                data: new Date(),
                status: 'ENVIAR_PARA_PAGAMENTO',
                cliente: { id: 1, nome: 'Cliente Teste', email: 'teste@email.com', cpf: '12345678900' },
                valorTotal: 100,
                itens: [],
            };

            const mockPagamentoRepository = {
                id: 1,
                pedido: '123',
                valor: 100,
                status: StatusPagamento.AGUARDANDO_RESPOSTA,
                identificador_pedido: '',
                qrcode: '',
            };

            mockRepository.save.mockResolvedValue(mockPagamentoRepository);

            const resultado = await pagamentoGateway.iniciarPagamento(mockPedido);

            expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                pedido: '123',
                valor: 100,
                status: StatusPagamento.AGUARDANDO_RESPOSTA,
            }));
            expect(resultado).toBeInstanceOf(Pagamento);
            expect(resultado.status).toBe(StatusPagamento.AGUARDANDO_RESPOSTA);
        });
    });
});
