import PagamentoController from '../src/infra/http/controllers/PagamentoController';
import { PagamentoGateway } from '../src/infra/database/gateways/PagamentoGateway';
import { IEnvioFilaMensageria } from '../src/application/interfaces/IEnvioFilaMensageria';
import { IIntegradorPagamentoGateway } from '../src/application/interfaces/IIntegradorPagamento';
import { StatusPagamento } from '../src/shared/enums/StatusPagamento';
import { IPedido } from '../src/application/interfaces/IPedido';
import { Preco } from '../src/shared/valueobjects/Preco';
import { Quantidade } from '../src/shared/valueobjects/Quantidade';
import { ExecutarPagamentoUseCase } from '../src/application/usecases/ExecutarPagamentoUseCase';
import { Pagamento } from '../src/domain/entities/Pagamento';
import { ITransacaoMercadoPago } from '../src/infra/mercadopago/MercadoPagoService'

const pagamento: Pagamento = new Pagamento(123,'1',new Preco(10));

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

const mockQRCodeResponse = {
    identificador_pedido: '123456789789',
    qrcode: 'qrcode321321354564897987',
};

const MockRetornotransacaoMercadoPago: ITransacaoMercadoPago = {
    id: 123456789789,
    status: "approved",
    external_reference: "order_001",
    preference_id: "12345678-1234-1234-1234-123456789012",
    payments: [
        {
            id: "987654321",
            transaction_amount: 10.00,
            total_paid_amount: 10.00,
            shipping_cost: 0.00,
            currency_id: "BRL",
            status: "approved",
            status_detail: "accredited",
            date_approved: "2024-11-23T12:34:56Z",
            date_created: "2024-11-23T11:34:56Z",
            last_modified: "2024-11-23T12:00:00Z",
            amount_refunded: 0.00
        }
    ],
    collector: {
        id: 987654321,
        email: "vendedor@mercadopago.com",
        nickname: "VendedorTop"
    },
    marketplace: "MERCADOLIVRE",
    date_created: "2024-11-23T11:30:00Z",
    last_updated: "2024-11-23T12:35:00Z",
    shipping_cost: 0.00,
    total_amount: 10.00,
    site_id: "MLB",
    paid_amount: 10.00,
    refunded_amount: 0.00,
    payer: {
        id: 123456789
    },
    cancelled: false,
    order_status: "delivered"
};

describe('PagamentoController', () => {
    let pagamentoController: PagamentoController;
    let mockEnvioFilaMensageria: jest.Mocked<IEnvioFilaMensageria>;
    let mockIntegradorPagamentos: jest.Mocked<IIntegradorPagamentoGateway>;
    let mockPagamentoGateway: jest.Mocked<PagamentoGateway>;
    let mockExecutarPagamentoUseCase: jest.Mocked<ExecutarPagamentoUseCase>;

    beforeEach(() => {
        mockPagamentoGateway = {
            iniciarPagamento: jest.fn(),
            atualizarPagamento: jest.fn(),
            buscarPagamento: jest.fn(),
            buscarPagamentoPeloIntegrador: jest.fn(),
        } as unknown as jest.Mocked<PagamentoGateway>;

        mockEnvioFilaMensageria = {
            envioFila: jest.fn(),
        } as unknown as jest.Mocked<IEnvioFilaMensageria>;

        mockIntegradorPagamentos = {
            gerarQRCode: jest.fn(),
            tratarRetorno: jest.fn(),
        } as unknown as jest.Mocked<IIntegradorPagamentoGateway>;

        mockExecutarPagamentoUseCase = {
            iniciar: jest.fn(),
            cancelar: jest.fn(),
            consultaStatus: jest.fn(),
            consultaPedidoIntegrador: jest.fn(),
        } as unknown as jest.Mocked<ExecutarPagamentoUseCase>;

        pagamentoController = new PagamentoController(mockPagamentoGateway,mockIntegradorPagamentos,mockEnvioFilaMensageria);
    });

    it('deve criar um pagamento com sucesso', async () => {
        let mockResponseUseCase: Pagamento = pagamento;
        mockResponseUseCase.identificadorPedido = mockQRCodeResponse.identificador_pedido;
        mockResponseUseCase.qrCode = mockQRCodeResponse.qrcode;

        mockExecutarPagamentoUseCase.iniciar.mockResolvedValue(mockResponseUseCase);
        mockPagamentoGateway.iniciarPagamento.mockResolvedValue(pagamento);
        mockPagamentoGateway.atualizarPagamento.mockResolvedValue(mockResponseUseCase);
        mockIntegradorPagamentos.gerarQRCode.mockResolvedValue(mockQRCodeResponse);

        const resultado = await pagamentoController.iniciarPagamento(pedido);

        expect(resultado).toHaveProperty('status', StatusPagamento.AGUARDANDO_RESPOSTA);
    });

    it('deve consultar o status de um pagamento com sucesso', async () => {
        const mockPagamentoId = '1';
        
        let mockResponseUseCase: Pagamento = pagamento;
        mockResponseUseCase.identificadorPedido = mockQRCodeResponse.identificador_pedido;
        mockResponseUseCase.qrCode = mockQRCodeResponse.qrcode;
        mockResponseUseCase.status = StatusPagamento.PAGO;

        mockExecutarPagamentoUseCase.consultaStatus.mockResolvedValue(mockResponseUseCase);
        mockPagamentoGateway.buscarPagamento.mockResolvedValue(mockResponseUseCase);

        const resultado = await pagamentoController.buscarStatusPedido(mockPagamentoId);

        expect(resultado).toHaveProperty('status', StatusPagamento.PAGO);
    });

    it('deve receber a resposta de um integrador aprovando a operacao', async () => {
        const mock_payload_webhook = JSON.stringify({resource: 'www.mercadopago.com.br/gettopic', topic: 'topic123'});
        const mock_resposta_tratamento = {
            id_pagamento: mockQRCodeResponse.identificador_pedido,
            status: 'closed',
            pago: true
        };
        let mockPagamento: Pagamento = pagamento;
        mockPagamento.identificadorPedido = mockQRCodeResponse.identificador_pedido;
        mockPagamento.qrCode = mockQRCodeResponse.qrcode;

        mockIntegradorPagamentos.tratarRetorno.mockResolvedValue(mock_resposta_tratamento);
        mockPagamentoGateway.buscarPagamento.mockResolvedValue(mockPagamento);
        mockPagamentoGateway.buscarPagamentoPeloIntegrador.mockResolvedValue(mockPagamento);
        mockExecutarPagamentoUseCase.consultaPedidoIntegrador.mockResolvedValue(mockPagamento);

        const resultado = await pagamentoController.receberStatusPagamentoIntegrador(mock_payload_webhook);

        expect(resultado).toHaveProperty('ok', true);
    });

    it('deve receber a resposta de um integrador rejeitando a operacao', async () => {
        const mock_payload_webhook = JSON.stringify({resource: 'www.mercadopago.com.br/gettopic', topic: 'topic123'});
        const mock_resposta_tratamento = {
            id_pagamento: mockQRCodeResponse.identificador_pedido,
            status: 'closed',
            pago: false
        };
        let mockPagamento: Pagamento = pagamento;
        mockPagamento.identificadorPedido = mockQRCodeResponse.identificador_pedido;
        mockPagamento.qrCode = mockQRCodeResponse.qrcode;

        mockIntegradorPagamentos.tratarRetorno.mockResolvedValue(mock_resposta_tratamento);
        mockExecutarPagamentoUseCase.consultaPedidoIntegrador.mockResolvedValue(mockPagamento);
        mockPagamentoGateway.buscarPagamento.mockResolvedValue(mockPagamento);
        mockPagamentoGateway.buscarPagamentoPeloIntegrador.mockResolvedValue(mockPagamento);

        const resultado = await pagamentoController.receberStatusPagamentoIntegrador(mock_payload_webhook);

        expect(resultado).toHaveProperty('ok', true);
    });

    /*it('deve receber a resposta de um integrador de um pedido não encontrado', async () => {
        const mock_payload_webhook = JSON.stringify({resource: 'www.mercadopago.com.br/gettopic', topic: 'topic123'});
        const mock_resposta_tratamento = {
            id_pagamento: mockQRCodeResponse.identificador_pedido,
            status: 'closed',
            pago: false
        };
        let mockPagamento: Pagamento = pagamento;
        mockPagamento.identificadorPedido = mockQRCodeResponse.identificador_pedido;
        mockPagamento.qrCode = mockQRCodeResponse.qrcode;

        mockIntegradorPagamentos.tratarRetorno.mockResolvedValue(mock_resposta_tratamento);
        mockPagamentoGateway.buscarPagamentoPeloIntegrador.mockResolvedValue(mockPagamento);

        await expect(pagamentoController.receberStatusPagamentoIntegrador(mock_payload_webhook)).toThrow('Pagamento não encontrado');
    });*/
});
