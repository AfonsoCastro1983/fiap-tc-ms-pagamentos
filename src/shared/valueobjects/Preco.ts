export class Preco {
    private _valor: number;
  
    constructor(valor: number) {
      if (valor < 0) {
        throw new Error('Valor do preço não pode ser negativo.');
      }
      this._valor = valor;
    }
  
    get valor(): number {
      return this._valor;
    }
  
    somar(outroDinheiro: Preco): Preco {
      return new Preco(this._valor + outroDinheiro.valor);
    }
  
    subtrair(outroDinheiro: Preco): Preco {
      if (this._valor < outroDinheiro.valor) {
        throw new Error(
          'Não é possível subtrair um valor maior do que o valor atual.'
        );
      }
      return new Preco(this._valor - outroDinheiro.valor);
    }
  
    toString(): string {
      return `R$ ${this._valor.toFixed(2)}`;
    }
  }