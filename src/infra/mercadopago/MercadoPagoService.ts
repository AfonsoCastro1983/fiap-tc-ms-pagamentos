import { IPedido } from "../../application/interfaces/IPedido";
import { IQRCodePagamento } from "../../application/interfaces/IQRCodePagamento";
import { IWebhookResposta } from "../../application/interfaces/IWebhookResposta";
import { IIntegradorPagamentoGateway } from "../../application/interfaces/IIntegradorPagamento";
import axios from 'axios';
import { Request } from "express";

export interface ITransacaoMercadoPago {
    id: number;
    status: string;
    external_reference: string;
    preference_id: string;
    payments?: {
        id: string;
        transaction_amount: number;
        total_paid_amount: number;
        shipping_cost: number;
        currency_id: string;
        status: string;
        status_detail: string;
        date_approved: string;
        date_created: string;
        last_modified: string;
        amount_refunded: number;
    }[];
    collector: {
        id: number;
        email: string;
        nickname: string;
    };
    marketplace: string;
    date_created: string;
    last_updated: string;
    shipping_cost: number;
    total_amount: number;
    site_id: string;
    paid_amount: number;
    refunded_amount: number;
    payer: {
        id: number;
    };
    cancelled: boolean;
    order_status: string;
}

export interface IRetornoWebhookMercadoPago {
    resource: string,
    topic: string
}

export class MercadoPagoService implements IIntegradorPagamentoGateway {
    private _UserID = 1869980712;
    private _ExternalPOSID = 'LANCHONETECAIXA01';
    private _HeadersPadrao = {
        'Content-type': 'application/json',
        'Authorization': 'Bearer APP_USR-6715474558730028-062805-771a3ab307055374f172539d3eb50052-1869980712'
    }
    private _TempoPagamento = 2; //em minutos
    private _URLCallback: string = "";

    constructor(requisicao: Request, path_webhook: string) {
        const protocolo = requisicao.headers['x-forwarded-proto'] || requisicao.protocol;
        const host = requisicao.headers['host'];
        this._URLCallback = protocolo + "://" + host + "/" + path_webhook;
        console.log(this._URLCallback);
    }

    private geracaoPayload(pedido: IPedido, descricao: string): string {
        let expiracao: Date = new Date();
        expiracao.setMinutes(expiracao.getMinutes() + this._TempoPagamento);
        expiracao.setHours(expiracao.getHours() - 3);
        console.log('expiração:', expiracao);
        console.log('pedido recebido:',pedido);

        const payload = {
            cash_out: { amount: 0 },
            description: descricao,
            external_reference: "Pedido:" + pedido.id.toString().padStart(10, '0'),
            expiration_date: expiracao.toISOString().replace(/Z$/, '-03:00'),
            items: pedido.itens === undefined ? [] : pedido.itens.map(item => ({
                sku_number: item.item.id.toString(),
                category: item.item.categoria,
                title: item.item.nome,
                description: item.item.descricao,
                unit_price: Number(item.item.preco),
                unit_measure: "UNIDADE",
                quantity: item.quantidade,
                total_amount: item.total
            })),
            notification_url: this._URLCallback,
            title: "Lanchonete TechChallenge",
            total_amount: pedido.valorTotal
        }
        return JSON.stringify(payload)
    }

    public async gerarQRCode(pedido: IPedido, descricao: string): Promise<IQRCodePagamento> {
        const payload: string = this.geracaoPayload(pedido, descricao);
        const url: string = 'https://api.mercadopago.com/instore/orders/qr/seller/collectors/' + this._UserID + '/pos/' + this._ExternalPOSID + '/qrs';

        let resposta = {
            identificador_pedido: '',
            qrcode: ''
        }

        const headers = this._HeadersPadrao;

        try {
            console.log('MP - payload=>', payload);
            const resposta_mp = await axios.post(url, payload, { headers });
            console.log('MP - resposta =>', resposta_mp)
            resposta.identificador_pedido = resposta_mp.data.in_store_order_id;
            resposta.qrcode = resposta_mp.data.qr_data;
        }
        catch (error) {
            throw new Error('Erro ao gerar QR-Code:' + error);
        }

        return resposta
    }

    public async tratarRetorno(body: any): Promise<IWebhookResposta> {
        const headers = this._HeadersPadrao;
        try {
            const retorno_webhook: IRetornoWebhookMercadoPago = body;
            console.log(retorno_webhook);
            if (retorno_webhook.resource != "") {
                const resposta_mp = await axios.get(retorno_webhook.resource, { headers });
                const transacao: ITransacaoMercadoPago = resposta_mp.data;
                console.log(transacao.id, transacao.status, transacao.order_status);
                return {
                    id_pagamento: transacao.id.toString(),
                    status: transacao.status,
                    pago: transacao.order_status == "paid"
                }
            }
            else {
                throw new Error('Retorno não mapeado');
            }
        }
        catch (erro) {
            return {
                id_pagamento: "",
                status: "",
                pago: false
            }
        }
    }
}