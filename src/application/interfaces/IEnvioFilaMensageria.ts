import { StatusPedido } from "../../shared/enums/StatusPedido";

export interface IEnvioFilaMensageria {
    envioFila(pedido: string, status: StatusPedido): Promise<boolean>;
}