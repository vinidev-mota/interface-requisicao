# Documentação da API de Documentos

Esta API permite o upload de documentos de clientes para o sistema. 

## Autenticação

Todas as requisições devem incluir o cabeçalho `x-api-key`.
**Chave atual para testes:** `mota-api-key-123`

---

## 1. Upload de Documento

**Endpoint:** `POST /api/upload-documento`

Realiza o upload de um arquivo para um cliente específico, informando o tipo de documento. Se o documento faltante for recebido e o cliente completar a documentação, o sistema atualiza seu status para `completo`.

### Cabeçalhos Requeridos
- `x-api-key`: Sua chave de API.
- O formato do corpo deve ser `multipart/form-data`.

### Parâmetros do Corpo (Form Data)
| Parâmetro | Tipo | Descrição | Obrigatório |
| :--- | :--- | :--- | :--- |
| `cpf` | String | CPF do cliente (formato: `XXX.XXX.XXX-XX`) | Sim |
| `nome_documento` | String | Nome do documento (ex: `Identidade`, `Certidão de Casamento`) | Sim |
| `documento` | Arquivo (File) | O arquivo em si (PDF, JPG, JPEG ou PNG). Max 10MB. | Sim |

### Resposta de Sucesso (200 OK)
```json
{
  "success": true,
  "message": "Documento recebido e salvo com sucesso.",
  "fileName": "doc-1726000000000-12345.pdf",
  "client_status": "completo"
}
```

### Respostas de Erro

**400 Bad Request - Parâmetros Faltantes**
```json
{
  "error": "Faltam parâmetros. Necessário: \"cpf\", \"nome_documento\", e o arquivo em \"documento\"."
}
```

**400 Bad Request - Arquivo Inválido ou Grande**
```json
{
  "error": "Formato de arquivo inválido. Aceitos: PDF, JPG, PNG."
}
```
*(Ou erros gerados pelo limite de tamanho do arquivo).*

**401 Unauthorized - API Key Inválida**
```json
{
  "error": "Não autorizado. Chave de API inválida."
}
```

**404 Not Found - Cliente Não Encontrado**
```json
{
  "error": "Cliente não encontrado com o CPF informado."
}
```
