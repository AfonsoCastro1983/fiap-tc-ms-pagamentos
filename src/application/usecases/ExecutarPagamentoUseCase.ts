import { Pagamento } from "../../domain/entities/Pagamento";
import { StatusPagamento } from "../../shared/enums/StatusPagamento";
import { StatusPedido } from "../../shared/enums/StatusPedido";
import { IEnvioFilaMensageria } from "../interfaces/IEnvioFilaMensageria";
import { IIntegradorPagamentoGateway } from "../interfaces/IIntegradorPagamento";
import { IPagamento } from "../interfaces/IPagamento";
import { IPagamentoGateway } from "../interfaces/IPagamentoGateway";
import { IPedido } from "../interfaces/IPedido";

export class ExecutarPagamentoUseCase {
    private pagamentoGateway: IPagamentoGateway;
    private envioFilaMensageria: IEnvioFilaMensageria;

    constructor(pagamentoGateway: IPagamentoGateway, filaMensageria: IEnvioFilaMensageria) {
        this.pagamentoGateway = pagamentoGateway;
        this.envioFilaMensageria = filaMensageria;
    }

    async iniciar(pedido: IPedido, integradorPagamentos: IIntegradorPagamentoGateway): Promise<Pagamento> {
        console.log('ExecutarPagamentoUseCase.iniciar()');
        let pagamento = await this.pagamentoGateway.iniciarPagamento(pedido);
        if (!pagamento) {
            throw new Error('Pagamento não foi criado');
        }
        this.envioFilaMensageria.envioFila(pedido.id, StatusPedido.ENVIAR_PARA_PAGAMENTO);
        
        const resposta = await integradorPagamentos.gerarQRCode(pedido, "Pedido Lanchonete");
        console.log(resposta);
        if (resposta.identificador_pedido != "") {
            pagamento.identificadorPedido = resposta.identificador_pedido;
            pagamento.qrCode = resposta.qrcode;
            pagamento = await this.pagamentoGateway.atualizarPagamento(pagamento);
            console.log('Pagamento atualizado com o qr-Code');
        }
        else {
            pagamento = await this.cancelar(pagamento.pedido);
        }

        return pagamento;
    }

    async pago(pedido: number): Promise<Pagamento> {
        const pagamento = await this.pagamentoGateway.buscarPagamento(pedido);
        if (!pagamento) {
            throw new Error('Pagamento não encontrado');
        }
        pagamento.status = StatusPagamento.PAGO;
        await this.pagamentoGateway.atualizarPagamento(pagamento);
        this.envioFilaMensageria.envioFila(pedido,StatusPedido.ENVIADO_PARA_A_COZINHA);

        return pagamento;
    }

    async cancelar(pedido: number): Promise<Pagamento> {
        console.log('ExecutarPagamentoUseCase.cancelar()');
        const pagamento = await this.pagamentoGateway.buscarPagamento(pedido);
        if (!pagamento) {
            throw new Error('Pagamento não encontrado');
        }

        pagamento.status = StatusPagamento.CANCELADO;
        await this.pagamentoGateway.atualizarPagamento(pagamento);
        this.envioFilaMensageria.envioFila(pedido,StatusPedido.CANCELADO);

        return pagamento;
    }

    async consultaStatus(nro_pedido: number): Promise<IPagamento> {
        const pagamento = await this.pagamentoGateway.buscarPagamento(nro_pedido);
        return pagamento;
    }

    async consultaPedidoIntegrador(id: string): Promise<Pagamento> {
        const pagamento = await this.pagamentoGateway.buscarPagamentoPeloIntegrador(id);
        return pagamento;
    }
}