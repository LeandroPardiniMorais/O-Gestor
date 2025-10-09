# O Gestor

## Quick Start
1. Copy .env.example to .env and adjust credentials if required.
2. Run docker compose up -d to start MySQL (port 3307) and phpMyAdmin (port 8081).
3. Copy ackend/.env.example to ackend/.env, then install dependencies with cd backend && npm install.
4. Boot the API: cd backend && npm start. Check GET /api/db/status to confirm database connectivity.
5. Launch the frontend: cd frontend && npm install followed by 
pm run dev.

## Database Credentials (defaults)
- Database: gestor
- App user: gestor_app
- Password: gestor_app
- Root password: gestor_root

Manage the schema via phpMyAdmin at http://localhost:8081 (use the credentials above). Stop services with docker compose down when finished.
### Banco de Dados
- O arquivo mysql/init.sql cria o esquema inicial (clientes, fornecedores, produtos, or�amentos e produ��o). Ajuste-o conforme suas necessidades antes do primeiro docker compose up.
- Se precisar recriar o esquema do zero, pare os containers com docker compose down -v (remove os volumes), ajuste o init.sql e suba novamente.
- As credenciais padr�es (gestor_app/gestor_app) est�o nos arquivos .env e podem ser trocadas em conjunto com o script SQL.

### API Endpoints
| Method | Endpoint                 | Description                                  |
|--------|--------------------------|----------------------------------------------|
| GET    | /api/clients           | Lista todos os clientes.                     |
| POST   | /api/clients           | Cria um cliente (
ome, endereco obrig.). |
| PUT    | /api/clients/:id       | Atualiza dados do cliente.                   |
| DELETE | /api/clients/:id       | Remove um cliente.                           |
| GET    | /api/suppliers         | Lista fornecedores.                          |
| POST   | /api/suppliers         | Cria fornecedor (
ome, contato).         |
| PUT    | /api/suppliers/:id     | Atualiza fornecedor existente.               |
| DELETE | /api/suppliers/:id     | Remove fornecedor.                           |
| GET    | /api/products          | Lista produtos cadastrados.                  |
| POST   | /api/products          | Cria produto (
ome, estoque opcional).     |
| PUT    | /api/products/:id      | Atualiza produto.                            |
| DELETE | /api/products/:id      | Remove produto.                              |
| GET    | /api/budgets           | Lista or�amentos com itens e partes.         |
| GET    | /api/budgets/:id       | Retorna um or�amento espec�fico.             |
| POST   | /api/budgets           | Cria or�amento completo (itens + produ��o).  |
| PATCH  | /api/budgets/:id/status| Atualiza apenas o status do or�amento.       |

Todas as rotas aceitam/retornam JSON. Consulte mysql/init.sql para verificar os campos dispon�veis em cada tabela.
