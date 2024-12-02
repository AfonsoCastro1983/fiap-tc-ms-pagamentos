import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { FilaSQS as FilaSQS } from '../src/infra/sqs/sqs';
import { StatusPedido } from "../src/shared/enums/StatusPedido";
import dotenv from "dotenv";

jest.mock("@aws-sdk/client-sqs");

describe("filaSQS", () => {
    let mockSend: jest.Mock;
    let filaSQSInstance: FilaSQS;

    beforeEach(() => {
        mockSend = jest.fn();
        (SQSClient as jest.Mock).mockImplementation(() => ({
            send: mockSend,
        }));

        filaSQSInstance = new FilaSQS();
    });

    it("deve enviar uma mensagem para a fila com sucesso", async () => {
        const pedido = '123';
        const status = StatusPedido.ENVIAR_PARA_PAGAMENTO;

        // Simula uma resposta bem-sucedida do SQS
        mockSend.mockResolvedValue({ MessageId: "12345" });

        const resultado = await filaSQSInstance.envioFila(pedido, status);
        expect(mockSend).toHaveBeenCalledTimes(1);
        expect(resultado).toBe(true);
    });

    it("deve retornar false ao falhar no envio para a fila", async () => {
        const pedido = '123';
        const status = StatusPedido.ENVIAR_PARA_PAGAMENTO;

        // Simula uma falha no envio
        mockSend.mockRejectedValue(new Error("Erro ao enviar mensagem"));

        const resultado = await filaSQSInstance.envioFila(pedido, status);

        expect(mockSend).toHaveBeenCalledTimes(1);
        expect(resultado).toBe(false);
    });

    it("deve instanciar corretamente o cliente SQS", () => {
        expect(filaSQSInstance).toHaveProperty("_sqsClient");
        expect(SQSClient).toHaveBeenCalledWith({
            region: "us-east-2",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
        });
    });
});
