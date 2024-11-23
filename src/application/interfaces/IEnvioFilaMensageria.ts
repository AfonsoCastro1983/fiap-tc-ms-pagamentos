import { StatusPedido } from "../../shared/enums/StatusPedido";

export interface IEnvioFilaMensageria {
    envioFila(pedido: number, status: StatusPedido): Promise<boolean>;
}