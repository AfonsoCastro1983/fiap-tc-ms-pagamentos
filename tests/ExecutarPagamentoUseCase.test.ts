import { ExecutarPagamentoUseCase } from '../src/application/usecases/ExecutarPagamentoUseCase';
import { StatusPagamento } from '../src/shared/enums/StatusPagamento';
import { IIntegradorPagamentoGateway } from '../src/application/interfaces/IIntegradorPagamento';
import { IEnvioFilaMensageria } from '../src/application/interfaces/IEnvioFilaMensageria';
import { IPagamentoGateway } from '../src/application/interfaces/IPagamentoGateway';
import { IPedido } from '../src/application/interfaces/IPedido';
import { Preco } from '../src/shared/valueobjects/Preco';
import { Quantidade } from '../src/shared/valueobjects/Quantidade';
import { Pagamento } from '../src/domain/entities/Pagamento';

const pagamento: Pagamento = new Pagamento(123,1,new Preco(10));

const pedido: IPedido = {
    id: 1,
    data: new Date(),
    status: 'ENVIAR_PARA_PAGAMENTO',
    cliente: {
        id: 1,
        nome: "Teste Cliente",
        email: "email@teste.com",
        cpf: "58787826003"
    },
    valorTotal: new Preco(10),
    itens: [
        {
            item: {
                id: 14,
                nome: "Teste Produto",
                descricao: "Teste de Produto",
                categoria: "Lanche",
                preco: new Preco(10)
            },
            quantidade: new Quantidade(1),
            total: new Preco(10)
        }
    ],
};

describe('ExecutarPagamentoUseCase', () => {
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

    it('deve iniciar um pagamento com sucesso', async () => {
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

    it('deve iniciar um pagamento, mas não conseguir gerar qr-code', async() => {
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

    it('deve marcar um pagamento como pago com sucesso', async () => {
        const mockPagamento: Pagamento = pagamento;
        mockPagamento.status = StatusPagamento.PAGO;
    
        mockPagamentoGateway.buscarPagamento.mockResolvedValue(pagamento);
        mockPagamentoGateway.atualizarPagamento.mockResolvedValue(mockPagamento);
    
        const resultado = await executarPagamentoUseCase.pago(pagamento.id);
    
        expect(resultado).toHaveProperty('status', StatusPagamento.PAGO);
        expect(mockPagamentoGateway.buscarPagamento).toHaveBeenCalledWith(pagamento.id);
        expect(mockPagamentoGateway.atualizarPagamento).toHaveBeenCalledWith(mockPagamento);
    });

    it('deve dar erro ao efetivar um pagamento não encontrado', async () => {
        const mockPagamento: Pagamento = pagamento;
        mockPagamento.status = StatusPagamento.CANCELADO;
    
        mockPagamentoGateway.atualizarPagamento.mockResolvedValue(mockPagamento);
    
        await expect(executarPagamentoUseCase.pago(pagamento.id))
        .rejects
        .toThrow('Pagamento não encontrado');

        expect(mockPagamentoGateway.buscarPagamento).toHaveBeenCalledWith(pagamento.id);
        expect(mockPagamentoGateway.atualizarPagamento).not.toHaveBeenCalled();
    });
    
    it('deve cancelar um pagamento com sucesso', async () => {
        const mockPagamento: Pagamento = pagamento;
        mockPagamento.status = StatusPagamento.CANCELADO;
    
        mockPagamentoGateway.buscarPagamento.mockResolvedValue(pagamento);
        mockPagamentoGateway.atualizarPagamento.mockResolvedValue(mockPagamento);
    
        const resultado = await executarPagamentoUseCase.cancelar(pagamento.id);
    
        expect(resultado).toHaveProperty('status', StatusPagamento.CANCELADO);
        expect(mockPagamentoGateway.buscarPagamento).toHaveBeenCalledWith(pagamento.id);
        expect(mockPagamentoGateway.atualizarPagamento).toHaveBeenCalledWith(mockPagamento);
    });

    it('deve dar erro ao cancelar um pagamento não encontrado', async () => {
        const mockPagamento: Pagamento = pagamento;
        mockPagamento.status = StatusPagamento.CANCELADO;
    
        mockPagamentoGateway.atualizarPagamento.mockResolvedValue(mockPagamento);
    
        await expect(executarPagamentoUseCase.cancelar(pagamento.id))
        .rejects
        .toThrow('Pagamento não encontrado');

        expect(mockPagamentoGateway.buscarPagamento).toHaveBeenCalledWith(pagamento.id);
        expect(mockPagamentoGateway.atualizarPagamento).not.toHaveBeenCalled();
    });

    it('deve consultar o status de um pagamento com sucesso', async () => {
        const mockPagamento: Pagamento = pagamento;
        mockPagamento.status = StatusPagamento.AGUARDANDO_RESPOSTA;
    
        mockPagamentoGateway.buscarPagamento.mockResolvedValue(mockPagamento);
    
        const resultado = await executarPagamentoUseCase.consultaStatus(pagamento.id);
    
        expect(resultado).toHaveProperty('status', StatusPagamento.AGUARDANDO_RESPOSTA);
        expect(mockPagamentoGateway.buscarPagamento).toHaveBeenCalledWith(pagamento.id);
    });

    it('deve consultar um pedido no integrador com sucesso', async () => {
        const mockPedidoId = '1234567897895464546';
    
        let mockPagamento: Pagamento = pagamento;
        mockPagamento.identificadorPedido = mockPedidoId;
    
        mockPagamentoGateway.buscarPagamentoPeloIntegrador.mockResolvedValue(mockPagamento);
    
        const resultado = await executarPagamentoUseCase.consultaPedidoIntegrador(mockPedidoId);
    
        expect(resultado).toHaveProperty('status', StatusPagamento.AGUARDANDO_RESPOSTA);
        expect(resultado.identificadorPedido).toBe(mockPedidoId);
        expect(mockPagamentoGateway.buscarPagamentoPeloIntegrador).toHaveBeenCalledWith(mockPedidoId);
    });
});
