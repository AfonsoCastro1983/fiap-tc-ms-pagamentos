import { Preco } from "../../shared/valueobjects/Preco";
import { Quantidade } from "../../shared/valueobjects/Quantidade";

export interface IPedido {
    id: string;
    data: Date;
    status: string;
    cliente?: {
        id: number;
        nome: string;
        email: string;
        cpf: string;
    },
    valorTotal: number;
    itens: IPedidoItem[];
}

export interface IPedidoItem {
    item: {
        id: number;
        nome: string;
        descricao: string;
        ingredientes: string;
        categoria: string;
        preco: number;
    },
    quantidade: number;
    total: number;
}