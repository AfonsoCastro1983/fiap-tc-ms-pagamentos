import { Preco } from '../src/shared/valueobjects/Preco';

describe('Preco', () => {
  describe('Quando o objeto é criado', () => {
    it('Deve lançar um erro se o valor inicial for negativo', () => {
      expect(() => new Preco(-10)).toThrow('Valor do preço não pode ser negativo.');
    });

    it('Deve criar o objeto corretamente se o valor inicial for positivo', () => {
      const preco = new Preco(100);
      expect(preco.valor).toBe(100);
    });
  });

  describe('Quando somar dois preços', () => {
    it('Deve retornar um novo objeto com a soma dos valores', () => {
      const preco1 = new Preco(100);
      const preco2 = new Preco(50);
      const resultado = preco1.somar(preco2);

      expect(resultado.valor).toBe(150);
      expect(resultado).not.toBe(preco1); // Verifica se é um novo objeto
      expect(resultado).not.toBe(preco2);
    });
  });

  describe('Quando subtrair dois preços', () => {
    it('Deve retornar um novo objeto com o valor restante', () => {
      const preco1 = new Preco(100);
      const preco2 = new Preco(30);
      const resultado = preco1.subtrair(preco2);

      expect(resultado.valor).toBe(70);
      expect(resultado).not.toBe(preco1); // Verifica se é um novo objeto
      expect(resultado).not.toBe(preco2);
    });

    it('Deve lançar um erro se o valor a subtrair for maior que o atual', () => {
      const preco1 = new Preco(50);
      const preco2 = new Preco(100);

      expect(() => preco1.subtrair(preco2)).toThrow(
        'Não é possível subtrair um valor maior do que o valor atual.'
      );
    });
  });

  describe('Quando chamar o método toString', () => {
    it('Deve retornar uma string formatada corretamente', () => {
      const preco = new Preco(123.456);
      expect(preco.toString()).toBe('R$ 123.46');
    });
  });
});
