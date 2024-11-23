import { Body, Get, Path, Post, Route, Tags } from "tsoa";
import { ExecutarPagamentoUseCase } from "../../../application/usecases/ExecutarPagamentoUseCase";
import { IIntegradorPagamentoGateway } from "../../../application/interfaces/IIntegradorPagamento";
import { PagamentoGateway } from "../../database/gateways/PagamentoGateway";
import { IPedido } from "../../../application/interfaces/IPedido";
import { IEnvioFilaMensageria } from "../../../application/interfaces/IEnvioFilaMensageria";

export interface PagamentoRequest extends IPedido { }

interface PagamentoResponse {
    id: number;
    status: string;
    qrCode: string;
}

interface WebhookResponse {
    ok: boolean;
}

@Route("pagamento")
@Tags("Pagamento")
export default class PagamentoController {
    private pagamentoUseCase: ExecutarPagamentoUseCase;
    private integradorPagamentos: IIntegradorPagamentoGateway;

    constructor(pagamentoGateway: PagamentoGateway, integradorPagamentos: IIntegradorPagamentoGateway, filaMensageria: IEnvioFilaMensageria) {
        this.pagamentoUseCase = new ExecutarPagamentoUseCase(pagamentoGateway, filaMensageria);
        this.integradorPagamentos = integradorPagamentos;
    }
    /**
     * Iniciar processo de pagamento
     * @param body 
     */
    @Post("/iniciar")
    public async iniciarPagamento(@Body() body: PagamentoRequest): Promise<PagamentoResponse> {
        const pagamento = await this.pagamentoUseCase.iniciar(body, this.integradorPagamentos);
        return {
            id: pagamento.id,
            status: pagamento.status,
            qrCode: pagamento.qrCode
        }
    }
    /**
     * Buscar o status de pagamento de um pedido
     */
    @Get("/status/:pedido")
    public async buscarStatusPedido(@Path() pedido: number): Promise<PagamentoResponse> {
        const pagamento = await this.pagamentoUseCase.consultaStatus(pedido);
        return {
            id: pagamento.id,
            status: pagamento.status,
            qrCode: pagamento.qrCode
        }

    }
    /**
     * Receber confirmação de pagamento do Integrador
     */
    @Post("/webhook")
    public async receberStatusPagamentoIntegrador(@Body() payload: string): Promise<WebhookResponse> {
        try {
            const respostaIntegrador = await this.integradorPagamentos.tratarRetorno(payload);
            console.log('respostaIntegrador ->', respostaIntegrador);
            if (respostaIntegrador) {
                if (respostaIntegrador.status == "closed") {
                    const pagto = await this.pagamentoUseCase.consultaPedidoIntegrador(respostaIntegrador.id_pagamento);
                    console.log('Pagamento encontrado?', pagto);
                    if (pagto) {
                        if (respostaIntegrador.pago) {
                            this.pagamentoUseCase.pago(pagto.pedido);
                        }
                        else {
                            this.pagamentoUseCase.cancelar(pagto.pedido);
                        }
                    }
                }
            }

            return {
                ok: true
            }
        }
        catch {
            throw new Error('Erro no tratamento do payload de retorno do integrador');
        }
    }
}