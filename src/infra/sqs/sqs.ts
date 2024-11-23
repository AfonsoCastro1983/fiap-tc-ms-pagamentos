import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { IEnvioFilaMensageria } from "../../application/interfaces/IEnvioFilaMensageria";
import { StatusPedido } from "../../shared/enums/StatusPedido";

export class filaSQS implements IEnvioFilaMensageria{
    private _sqsClient: SQSClient;
    
    constructor () {
        this._sqsClient = new SQSClient({ region: "us-region-2" });
    }

    public async envioFila(pedido: number, status: StatusPedido): Promise<boolean> {
        const params = {
            QueueUrl: 'https://sqs.us-east-2.amazonaws.com/992382363343/lanchonete-fiap-status-pedido.fifo',
            MessageBody: JSON.stringify({'pedido': pedido, 'status': status})
        };

        console.log(params);
    
        try {
            const data = await this._sqsClient.send(new SendMessageCommand(params));
            console.log("Messagem enviada corretamente:", data.MessageId);
            return true;
        } catch (err) {
            console.log("Erro ao enviar mensagem:", err);
            return false;
        }
    }

}