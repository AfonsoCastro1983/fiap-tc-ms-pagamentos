import { Preco } from "../../shared/valueobjects/Preco";
import { StatusPagamento } from "../../shared/enums/StatusPagamento";

export interface IPagamento {
    id: number;
    valor: Preco;
    status: StatusPagamento;
    dataCriacao: Date;
    pedido: number;
    identificadorPedido: string;
    qrCode: string;
}