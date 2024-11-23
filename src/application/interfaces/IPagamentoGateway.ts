import { Pagamento } from "../../domain/entities/Pagamento";
import { IPedido } from "./IPedido";

export interface IPagamentoGateway {
    iniciarPagamento(pedido: IPedido): Promise<Pagamento>;
    atualizarPagamento(pagamento: Pagamento): Promise<Pagamento>;
    buscarPagamento(pedido: number): Promise<Pagamento>;
    buscarPagamentoPeloIntegrador(codigo: string): Promise<Pagamento>;
}