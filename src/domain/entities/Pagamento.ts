import { Preco } from "../../shared/valueobjects/Preco";
import { StatusPagamento } from "../../shared/enums/StatusPagamento";
import { IPagamento } from "../../application/interfaces/IPagamento";


export class Pagamento implements IPagamento {
  private _id: number;
  private _pedido: string;
  private _valor: Preco;
  private _status: StatusPagamento;
  private _dataCriacao: Date;
  private _identificador_pedido: string;
  private _qrCodeCodigo: string;

  constructor(id: number, pedido: string,valor: Preco) {
    this._id = id;
    this._pedido = pedido;
    this._valor = valor;
    this._status = StatusPagamento.AGUARDANDO_RESPOSTA;
    this._dataCriacao = new Date();
    this._identificador_pedido = "";
    this._qrCodeCodigo = "";
  }

  get id(): number {
    return this._id;
  }

  get valor(): Preco {
    return this._valor;
  }

  get status(): StatusPagamento {
    return this._status;
  }

  set status(value: StatusPagamento) {
    this._status = value;
  }

  get dataCriacao(): Date {
    return this._dataCriacao;
  }

  get pedido(): string {
    return this._pedido;
  }

  set identificadorPedido(value: string) {
    this._identificador_pedido = value;
  }

  get identificadorPedido(): string {
    return this._identificador_pedido;
  }

  set qrCode(value: string) {
    this._qrCodeCodigo = value;
  }

  get qrCode(): string {
    return this._qrCodeCodigo;
  }
}