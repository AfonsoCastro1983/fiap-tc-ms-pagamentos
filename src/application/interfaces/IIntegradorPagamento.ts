import { IPedido } from "./IPedido";
import { IQRCodePagamento } from "./IQRCodePagamento"
import { IWebhookResposta } from "./IWebhookResposta";

export interface IIntegradorPagamentoGateway {
    gerarQRCode(pedido: IPedido, descricao: string ) : Promise<IQRCodePagamento>;
    tratarRetorno(body: string): Promise<IWebhookResposta>;
}