import { ExecutarPagamentoUseCase } from '../src/application/usecases/ExecutarPagamentoUseCase';
import { StatusPagamento } from '../src/shared/enums/StatusPagamento';
import { IIntegradorPagamentoGateway } from '../src/application/interfaces/IIntegradorPagamento';
import { IEnvioFilaMensageria } from '../src/application/interfaces/IEnvioFilaMensageria';
import { IPagamentoGateway } from '../src/application/interfaces/IPagamentoGateway';
import { IPedido } from '../src/application/interfaces/IPedido';
import { Preco } from '../src/shared/valueobjects/Preco';
import { Pagamento } from '../src/domain/entities/Pagamento';

const pagamento: Pagamento = new Pagamento(123, '1', new Preco(10));

const pedido: IPedido = {
    id: '1',
    data: new Date(),
    status: 'ENVIAR_PARA_PAGAMENTO',
    cliente: {
        id: 1,
        nome: "Teste Cliente",
        email: "email@teste.com",
        cpf: "58787826003"
    },
    valorTotal: 10,
    itens: [
        {
            item: {
                id: 14,
                nome: "Teste Produto",
                descricao: "Teste de Produto",
                ingredientes: "Ingredientes do produto",
                categoria: "Lanche",
                preco: 10
            },
            quantidade: 1,
            total: 10
        }
    ],
};

describe('Executar pagamentos', () => {
    let executarPagamentoUseCase: ExecutarPagamentoUseCase;
    let mockPagamentoGateway: jest.Mocked<IPagamentoGateway>;
    let mockEnvioFilaMensageria: jest.Mocked<IEnvioFilaMensageria>;
    let mockIntegradorPagamentos: jest.Mocked<IIntegradorPagamentoGateway>;

    beforeEach(() => {
        mockPagamentoGateway = {
            iniciarPagamento: jest.fn(),
            atualizarPagamento: jest.fn(),
            buscarPagamento: jest.fn(),
            buscarPagamentoPeloIntegrador: jest.fn(),
        } as unknown as jest.Mocked<IPagamentoGateway>;

        mockEnvioFilaMensageria = {
            envioFila: jest.fn(),
        } as unknown as jest.Mocked<IEnvioFilaMensageria>;

        mockIntegradorPagamentos = {
            gerarQRCode: jest.fn(),
            tratarRetorno: jest.fn(),
        } as unknown as jest.Mocked<IIntegradorPagamentoGateway>;

        executarPagamentoUseCase = new ExecutarPagamentoUseCase(mockPagamentoGateway, mockEnvioFilaMensageria);
    });

    describe("Cenário: Iniciar um pagamento com sucesso", () => {
        it("DADO um pedido válido, QUANDO eu iniciar o pagamento, ENTÃO o pagamento deve ser iniciado com sucesso e retornar o QR Code", async () => {
            const mockQRCodeResponse = {
                identificador_pedido: '1234567897895464546',
                qrcode: 'qrcode321321354564897987',
            };

            let mockPagamento: Pagamento = pagamento;
            mockPagamento.identificadorPedido = mockQRCodeResponse.identificador_pedido;
            mockPagamento.qrCode = mockQRCodeResponse.qrcode;

            mockIntegradorPagamentos.gerarQRCode.mockResolvedValue(mockQRCodeResponse);
            mockPagamentoGateway.iniciarPagamento.mockResolvedValue(pagamento);
            mockPagamentoGateway.atualizarPagamento.mockResolvedValue(mockPagamento);

            const resultado = await executarPagamentoUseCase.iniciar(pedido, mockIntegradorPagamentos);

            console.log(resultado);

            expect(resultado).toHaveProperty('status', StatusPagamento.AGUARDANDO_RESPOSTA);
            expect(resultado.identificadorPedido).toBe(mockQRCodeResponse.identificador_pedido);
        });
    });

    describe("Cenário: Iniciar um pagamento e não conseguir gerar o QR Code", () => {
        it("DADO um pedido válido, QUANDO eu tentar iniciar o pagamento e falhar ao gerar o QR Code, ENTÃO o pagamento deve ser cancelado", async () => {

            const mockQRCodeResponse = {
                identificador_pedido: '',
                qrcode: '',
            };

            let mockPagamento: Pagamento = pagamento;
            mockPagamento.identificadorPedido = mockQRCodeResponse.identificador_pedido;
            mockPagamento.qrCode = mockQRCodeResponse.qrcode;
            mockPagamento.status = StatusPagamento.CANCELADO;

            mockIntegradorPagamentos.gerarQRCode.mockResolvedValue(mockQRCodeResponse);
            mockPagamentoGateway.iniciarPagamento.mockResolvedValueOnce(pagamento);
            mockPagamentoGateway.buscarPagamento.mockResolvedValue(pagamento);
            mockPagamentoGateway.atualizarPagamento.mockResolvedValue(mockPagamento);

            const resultado = await executarPagamentoUseCase.iniciar(pedido, mockIntegradorPagamentos);

            console.log(resultado);

            expect(resultado).toHaveProperty('status', StatusPagamento.CANCELADO);
            expect(resultado.identificadorPedido).toBe(mockQRCodeResponse.identificador_pedido);
        });
    });

    describe("Cenário: Marcar um pagamento como pago com sucesso", () => {
        it("DADO um pagamento em processamento, QUANDO eu confirmá-lo como pago, ENTÃO o status do pagamento deve ser atualizado para PAGO", async () => {

            const mockPagamento: Pagamento = pagamento;
            mockPagamento.status = StatusPagamento.PAGO;

            mockPagamentoGateway.buscarPagamento.mockResolvedValue(pagamento);
            mockPagamentoGateway.atualizarPagamento.mockResolvedValue(mockPagamento);

            const resultado = await executarPagamentoUseCase.pago(pagamento.pedido);

            expect(resultado).toHaveProperty('status', StatusPagamento.PAGO);
            expect(mockPagamentoGateway.buscarPagamento).toHaveBeenCalledWith(pagamento.pedido);
            expect(mockPagamentoGateway.atualizarPagamento).toHaveBeenCalledWith(mockPagamento);
        });
    });

    describe("Cenário: Tentar efetivar um pagamento não encontrado", () => {
        it("DADO um pagamento inexistente, QUANDO eu tentar confirmá-lo como pago, ENTÃO deve lançar um erro dizendo 'Pagamento não encontrado'", async () => {
            const mockPagamento: Pagamento = pagamento;
            mockPagamento.status = StatusPagamento.CANCELADO;

            mockPagamentoGateway.atualizarPagamento.mockResolvedValue(mockPagamento);

            await expect(executarPagamentoUseCase.pago(pagamento.pedido))
                .rejects
                .toThrow('Pagamento não encontrado');

            expect(mockPagamentoGateway.buscarPagamento).toHaveBeenCalledWith(pagamento.pedido);
            expect(mockPagamentoGateway.atualizarPagamento).not.toHaveBeenCalled();
        });
    });

    describe("Cenário: Cancelar um pagamento com sucesso", () => {
        it("DADO um pagamento em processamento, QUANDO eu cancelar o pagamento, ENTÃO o status do pagamento deve ser atualizado para CANCELADO", async () => {
            const mockPagamento: Pagamento = pagamento;
            mockPagamento.status = StatusPagamento.CANCELADO;

            mockPagamentoGateway.buscarPagamento.mockResolvedValue(pagamento);
            mockPagamentoGateway.atualizarPagamento.mockResolvedValue(mockPagamento);

            const resultado = await executarPagamentoUseCase.cancelar(pagamento.pedido);

            expect(resultado).toHaveProperty('status', StatusPagamento.CANCELADO);
            expect(mockPagamentoGateway.buscarPagamento).toHaveBeenCalledWith(pagamento.pedido);
            expect(mockPagamentoGateway.atualizarPagamento).toHaveBeenCalledWith(mockPagamento);
        });
    });

    describe("Cenário: Tentar cancelar um pagamento não encontrado", () => {
        it("DADO um pagamento inexistente, QUANDO eu tentar cancelá-lo, ENTÃO deve lançar um erro dizendo 'Pagamento não encontrado'", async () => {
            const mockPagamento: Pagamento = pagamento;
            mockPagamento.status = StatusPagamento.CANCELADO;

            mockPagamentoGateway.atualizarPagamento.mockResolvedValue(mockPagamento);

            await expect(executarPagamentoUseCase.cancelar(pagamento.pedido))
                .rejects
                .toThrow('Pagamento não encontrado');

            expect(mockPagamentoGateway.buscarPagamento).toHaveBeenCalledWith(pagamento.pedido);
            expect(mockPagamentoGateway.atualizarPagamento).not.toHaveBeenCalled();
        });
    });

    describe("Cenário: Consultar o status de um pagamento com sucesso", () => {
        it("DADO um pagamento existente, QUANDO eu consultar o status do pagamento, ENTÃO o status atual deve ser retornado com sucesso", async () => {
            const mockPagamento: Pagamento = pagamento;
            mockPagamento.status = StatusPagamento.AGUARDANDO_RESPOSTA;

            mockPagamentoGateway.buscarPagamento.mockResolvedValue(mockPagamento);

            const resultado = await executarPagamentoUseCase.consultaStatus(pagamento.pedido);

            expect(resultado).toHaveProperty('status', StatusPagamento.AGUARDANDO_RESPOSTA);
            expect(mockPagamentoGateway.buscarPagamento).toHaveBeenCalledWith(pagamento.pedido);
        });
    });

    describe("Cenário: Consultar um pedido no integrador com sucesso", () => {
        it("DADO um identificador de pedido válido, QUANDO eu consultar o pedido no integrador, ENTÃO os dados do pagamento devem ser retornados com sucesso", async () => {
            const mockPedidoId = '1234567897895464546';

            let mockPagamento: Pagamento = pagamento;
            mockPagamento.identificadorPedido = mockPedidoId;

            mockPagamentoGateway.buscarPagamento.mockResolvedValue(mockPagamento);

            const resultado = await executarPagamentoUseCase.consultaStatus(mockPedidoId);

            expect(resultado).toHaveProperty('status', StatusPagamento.AGUARDANDO_RESPOSTA);
            expect(resultado.identificadorPedido).toBe(mockPedidoId);
            expect(mockPagamentoGateway.buscarPagamento).toHaveBeenCalledWith(mockPedidoId);
        });
    });
});
