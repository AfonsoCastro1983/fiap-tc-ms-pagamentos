import { Entity, PrimaryGeneratedColumn, Column, JoinColumn } from 'typeorm';
import { StatusPagamento } from '../../../shared/enums/StatusPagamento';

@Entity()
export class PagamentoRepository {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'decimal' })
    valor!: number;

    @Column({
        type: 'enum',
        enum: StatusPagamento
    })
    status!: StatusPagamento;

    @Column()
    pedido!: number;

    @Column()
    identificador_pedido!: string;

    @Column()
    qrcode!: string;

}