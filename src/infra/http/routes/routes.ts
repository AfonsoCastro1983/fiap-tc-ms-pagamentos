import express from "express";
import PagamentoController from "../controllers/PagamentoController";
import { MercadoPagoService } from "../../mercadopago/MercadoPagoService";
import { PagamentoGateway } from "../../database/gateways/PagamentoGateway";
import { filaSQS } from "../../sqs/sqs";

const router = express.Router()

//Pagamento
///1ªFase - Entregáveis 2 - v. Fake checkout
////Iniciar pagamento
router.post("/pagamento/iniciar", async (req, res) => {
    try {
        const controller = new PagamentoController(new PagamentoGateway(), new MercadoPagoService(req,'pagamento/webhook'), new filaSQS());
        const resposta = await controller.iniciarPagamento(req.body);

        return res.status(200).json(resposta);
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({ erro: error.message });
        }
    }
});

////Webhook de atualização de status de pagamento
router.post("/pagamento/webhook", async (req, res) => {
    try {
        console.log(req.body);
        const controller = new PagamentoController(new PagamentoGateway(), new MercadoPagoService(req,'pagamento/webhook'), new filaSQS());
        const resposta = await controller.receberStatusPagamentoIntegrador(req.body);
        console.log('respostaWebhook:',resposta);
        return res.status(200).json(resposta);
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({ erro: error.message });
        }
    }
});

///2ªFase - Entregáveis 1 - a.iii Webhook para receber confirmação de pagamento aprovado ou recusado

////2ªFase - Entregáveis 1 - a.ii
router.get("/pagamento/status/:pedido", async (req, res) => {
    try {
        const controller = new PagamentoController(new PagamentoGateway(), new MercadoPagoService(req,'pagamento/webhook'), new filaSQS());
        const resposta = await controller.buscarStatusPedido(Number(req.params.pedido));

        return res.status(200).json(resposta);
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({ erro: error.message });
        }
    }
});

export default router;