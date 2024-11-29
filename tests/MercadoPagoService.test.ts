
import { MercadoPagoService } from "../src/infra/mercadopago/MercadoPagoService";
import axios from "axios";
import { Request } from "express";
import { IPedido } from "../src/application/interfaces/IPedido";
import { Preco } from "../src/shared/valueobjects/Preco";
import { Quantidade } from "../src/shared/valueobjects/Quantidade";

jest.mock("axios");
const mockAxios = axios as jest.Mocked<typeof axios>;

describe("MercadoPagoService", () => {
    let mercadoPagoService: MercadoPagoService;
    let mockRequest: Partial<Request>;

    beforeEach(() => {
        mockRequest = {
            headers: {
                "x-forwarded-proto": "https",
                host: "example.com",
            },
            protocol: "https",
        };

        mercadoPagoService = new MercadoPagoService(
            mockRequest as Request,
            "webhook-path"
        );
    });

    describe("gerarQRCode", () => {
        it("deve gerar um QR Code com sucesso", async () => {
            const pedido: IPedido = {
                id: '1',
                data: new Date(),
                status: "ENVIAR_PARA_PAGAMENTO",
                cliente: {
                    id: 1,
                    nome: "Cliente Teste",
                    email: "teste@email.com",
                    cpf: "12345678900",
                },
                valorTotal: new Preco(100),
                itens: [
                    {
                        item: {
                            id: 1,
                            nome: "Produto Teste",
                            descricao: "Descrição Teste",
                            categoria: "Categoria Teste",
                            preco: new Preco(100),
                        },
                        quantidade: new Quantidade(1),
                        total: new Preco(100),
                    },
                ],
            };

            const mockResponse = {
                data: {
                    in_store_order_id: "12345",
                    qr_data: "qr_code_data",
                },
            };

            mockAxios.post.mockResolvedValue(mockResponse);

            const resultado = await mercadoPagoService.gerarQRCode(pedido, "Descrição Teste");

            expect(mockAxios.post).toHaveBeenCalledWith(
                expect.stringContaining("https://api.mercadopago.com/instore/orders/qr/seller"),
                expect.any(String),
                expect.objectContaining({
                    headers: expect.any(Object),
                })
            );
            expect(resultado).toEqual({
                identificador_pedido: "12345",
                qrcode: "qr_code_data",
            });
        });

        it("deve lançar erro ao falhar na geração do QR Code", async () => {
            const pedido: IPedido = {
                id: '1',
                data: new Date(),
                status: "ENVIAR_PARA_PAGAMENTO",
                cliente: {
                    id: 1,
                    nome: "Cliente Teste",
                    email: "teste@email.com",
                    cpf: "12345678900",
                },
                valorTotal: new Preco(100),
                itens: [],
            };

            mockAxios.post.mockRejectedValue(new Error("Erro no Mercado Pago"));

            await expect(mercadoPagoService.gerarQRCode(pedido, "Descrição Teste")).rejects.toThrow(
                "Erro ao gerar QR-Code:Error: Erro no Mercado Pago"
            );
        });
    });

    describe("tratarRetorno", () => {
        it("deve processar o retorno do webhook com sucesso", async () => {
            const body = {
                resource: "https://api.mercadopago.com/resource/12345",
                topic: "payment",
            };

            const mockResponse = {
                data: {
                    id: 12345,
                    status: "approved",
                    order_status: "paid",
                },
            };

            mockAxios.get.mockResolvedValue(mockResponse);

            const resultado = await mercadoPagoService.tratarRetorno(body);

            expect(mockAxios.get).toHaveBeenCalledWith(
                "https://api.mercadopago.com/resource/12345",
                expect.objectContaining({
                    headers: expect.any(Object),
                })
            );
            expect(resultado).toEqual({
                id_pagamento: "12345",
                status: "approved",
                pago: true,
            });
        });

        it("deve retornar valores padrão ao falhar no processamento do webhook", async () => {
            const body = {
                resource: "",
                topic: "payment",
            };

            const resultado = await mercadoPagoService.tratarRetorno(body);

            expect(resultado).toEqual({
                id_pagamento: "",
                status: "",
                pago: false,
            });
        });

        it("deve lançar erro ao retornar resposta não mapeada", async () => {
            const body = {
                resource: "https://api.mercadopago.com/resource/12345",
                topic: "payment",
            };

            mockAxios.get.mockRejectedValue(new Error("Erro no Mercado Pago"));

            const resultado = await mercadoPagoService.tratarRetorno(body);

            expect(resultado).toEqual({
                id_pagamento: "",
                status: "",
                pago: false,
            });
        });
    });
});
