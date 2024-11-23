export class Quantidade {
    private _valor: number = 1;

    constructor(value: number) {
        this.alterarQuantidade(value);
    }

    get valor(): number {
        return this._valor;
    }

    alterarQuantidade(value: number) {
        if (value <= 0) {
            throw new Error('Quantidade não pode ser menor ou igual a zero');
        }
        this._valor = value;
    }
}