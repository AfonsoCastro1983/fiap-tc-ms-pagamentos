import { Quantidade } from "../src/shared/valueobjects/Quantidade";

describe('Quantidade', () => {
    it('deve criar uma instância de Quantidade com valor válido', () => {
        const quantidade = new Quantidade(5);
        expect(quantidade.valor).toBe(5);
    });

    it('deve lançar erro ao tentar criar uma Quantidade com valor menor ou igual a zero', () => {
        expect(() => new Quantidade(0)).toThrow('Quantidade não pode ser menor ou igual a zero');
        expect(() => new Quantidade(-1)).toThrow('Quantidade não pode ser menor ou igual a zero');
    });

    it('deve alterar a quantidade para um valor válido', () => {
        const quantidade = new Quantidade(5);
        quantidade.alterarQuantidade(10);
        expect(quantidade.valor).toBe(10);
    });

    it('deve lançar erro ao tentar alterar a quantidade para um valor menor ou igual a zero', () => {
        const quantidade = new Quantidade(5);
        expect(() => quantidade.alterarQuantidade(0)).toThrow('Quantidade não pode ser menor ou igual a zero');
        expect(() => quantidade.alterarQuantidade(-3)).toThrow('Quantidade não pode ser menor ou igual a zero');
    });

    it('deve retornar o valor correto da quantidade', () => {
        const quantidade = new Quantidade(7);
        expect(quantidade.valor).toBe(7);
    });
});