import { Repository } from "typeorm";
import { IPagamentoGateway } from "../../../application/interfaces/IPagamentoGateway";
import { AppDataSource } from "../data-source";
import { PagamentoRepository } from "../repositories/Pagamento";
import { Pagamento } from "../../../domain/entities/Pagamento";
import { Preco } from "../../../shared/valueobjects/Preco";
import { StatusPagamento } from "../../../shared/enums/StatusPagamento";
import { IPedido } from "../../../application/interfaces/IPedido";

export class PagamentoGateway implements IPagamentoGateway {
    private repPagamento: Repository<PagamentoRepository>;

    constructor() {
        this.repPagamento = AppDataSource.getRepository(PagamentoRepository);
    }

    private converterRepository(pagamentoRepository: PagamentoRepository): Pagamento {
        const pagamento = new Pagamento(pagamentoRepository.id, pagamentoRepository.pedido, new Preco(pagamentoRepository.valor));
        pagamento.status = pagamentoRepository.status;
        pagamento.identificadorPedido = pagamentoRepository.identificador_pedido;
        pagamento.qrCode = pagamentoRepository.qrcode;
        console.log(pagamento);
        return pagamento;
    }

    async buscarPagamento(pedido: number): Promise<Pagamento> {
        const pagRepository = await this.repPagamento.findOne({ where: { pedido: pedido }, relations: ["pedido"], order: { id: 'DESC' } });
        if (!pagRepository) {
            throw new Error('Pagamento não encontrado');
        }
        return this.converterRepository(pagRepository);
    }

    async buscarPagamentoPeloIntegrador(codigo: string): Promise<Pagamento> {
        //Registro do integrador existe?
        const pagRepository = await this.repPagamento.findOne({ where: { identificador_pedido: codigo } });
        if (!pagRepository) {
            throw new Error('Pedido integrador não encontrado');
        }
        return this.converterRepository(pagRepository);
    }

    async atualizarPagamento(pagamento: Pagamento): Promise<Pagamento> {
        if (pagamento.id == 0) {
            throw new Error('Pagamento não gravado');
        }
        const pagRepository = await this.repPagamento.findOne({ where: { id: pagamento.id }, relations: ["pedido"], order: { id: 'DESC' } });
        if (!pagRepository) {
            throw new Error('Pagamento não encontrado');
        }
        pagRepository.identificador_pedido = pagamento.identificadorPedido;
        pagRepository.qrcode = pagamento.qrCode;
        pagRepository.status = pagamento.status;
        pagRepository.valor = pagamento.valor.valor;
        const new_rep = await this.repPagamento.save(pagRepository);

        return this.converterRepository(new_rep);
    }

    async iniciarPagamento(pedido: IPedido): Promise<Pagamento> {
        let rep = new PagamentoRepository();
        rep.pedido = pedido.id;
        rep.status = StatusPagamento.AGUARDANDO_RESPOSTA;
        rep.valor = pedido.valorTotal.valor;
        rep.identificador_pedido = "";
        rep.qrcode = "";
        console.log('Pagamento a cadastrar');
        rep = await this.repPagamento.save(rep);
        console.log('Pagamento cadastrado');

        const pagamento = this.converterRepository(rep);
        return pagamento;
    }
}