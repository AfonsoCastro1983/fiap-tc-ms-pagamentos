# Lanchonete API - Pós-Tech FIAP - Arquitetura de Software

Este repositório contém o código-fonte para as APIs de gerenciamento de pagamentos da Lanchonete, desenvolvido durante o primeiro módulo da Pós-Tech FIAP de Arquitetura de Software. O projeto foi atualizado para usar uma arquitetura baseada em micro serviços e implementado com tecnologias modernas para escalabilidade e manutenção.

## Tecnologias Utilizadas

- **TypeScript**: Linguagem de programação.
- **PostgreSQL**: Sistema de gerenciamento de banco de dados.
- **Docker**: Ferramenta de virtualização e orquestração de containers.
- **Docker Compose**: Ferramenta para orquestrar múltiplos serviços Docker.
- **Swagger**: Ferramenta de documentação de APIs.
- **TypeORM**: ORM (Object-Relational Mapping) para qualquer banco de dados.
- **Amazon ECS**: Serviço gerenciado para execução de containers.
- **Código QR Mercado Pago**: Desenvolvimento da integração com o Mercado Pago para geração de QR-Codes e captura do pagamento.
- **AWS Lambda**: Serviço de computação serverless que executa código em resposta a eventos, sem necessidade de gerenciar servidores.
- **API Gateway**: Serviço gerenciado que permite criar, publicar e gerenciar APIs seguras e escaláveis para acessar aplicações backend.

## APIs de Pagamentos

### Domínios e Entidades

A API de gerenciamento de pagamentos inclui as seguintes classes de domínio:

- **Pagamento**: Representa o pagamento de um pedido realizado na lanchonete.

### Endpoints

- **POST /pagamento/iniciar**: Inicia o pagamento para um pedido e muda o status do pedido para `ENVIAR_PARA_PAGAMENTO`.
  - Exemplo de payload:
    ```json
    {
      "pedidoId": "12345",
      "valor": 50.00,
      "qrcode": "https://mercadopago.com/qrcode/12345"
    }
    ```
- **GET /pagamento/status/{pedidoId}**: Busca o status de pagamento de um pedido específico.
- **POST /pagamento/webhook**: Endpoint que recebe notificações do integrador de pagamento (Mercado Pago) sobre o status de um pagamento.

### Documentação da API

A documentação da API pode ser acessada através do Swagger no ambiente local:

```bash
http://localhost:8000/docs
Para o ambiente em produção na AWS, utilize o link abaixo:
```

### Documentação na AWS.

Regras de Negócio Aplicadas
Validação de Pedido: Antes de iniciar um pagamento, é validado se o pedido existe e se está em um estado elegível para pagamento.
Notificação de Pagamento: Após a conclusão de um pagamento, o sistema atualiza o status do pedido automaticamente.
Reembolso: Integração prevista para processar reembolsos quando necessário.
Arquitetura AWS para Micro Serviços
A aplicação foi implementada usando Amazon ECS para orquestração de containers, garantindo escalabilidade e facilidade de gerenciamento. A arquitetura segue os princípios de uma implementação baseada em micro serviços.

### Descrição da Arquitetura
#### ECS Cluster
O ECS Cluster gerencia os serviços e tasks, orquestrando os containers e garantindo alta disponibilidade.

#### VPC e Subnets
Uma VPC foi configurada com subnets públicas e privadas para isolar os recursos e garantir a segurança dos dados.

#### RDS PostgreSQL
Um banco de dados relacional gerenciado pela AWS RDS armazena os dados de pagamentos, com backups automáticos e alta disponibilidade.

#### API Gateway
O API Gateway gerencia e protege os endpoints das APIs, integrando-se ao AWS Cognito para autenticação e autorização.

#### AWS Lambda
Funções Lambda foram criadas para processar notificações assíncronas de pagamento e para realizar auditorias.

#### Comandos para Inicializar o Serviço na Máquina Local
Clonar o repositório:

```bash
git clone https://github.com/AfonsoCastro1983/fiap-techchallenge.git
Instalar as dependências:
```

```bash
cd lanchonete-api
npm install
Iniciar os serviços Docker:
```

```bash
docker-compose up -d
Acessar a documentação da API Swagger: http://localhost:8000/docs
```

### Observações
Este projeto foi atualizado para usar Amazon ECS e arquitetura de micro serviços.
Foco exclusivo no gerenciamento de APIs de Pagamentos para simplificação e escalabilidade.
Para mais informações sobre o código e a arquitetura do projeto, consulte os arquivos de código-fonte e a documentação interna.