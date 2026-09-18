const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const API_KEY = 'mota-api-key-123';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve os arquivos do frontend

// Configuração do Multer (Upload de arquivos)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'doc-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Formato de arquivo inválido. Aceitos: PDF, JPG, PNG.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10 MB
    fileFilter: fileFilter
});

// Banco de dados em memória
let clientsData = [
    {
        id: 1,
        nome: "João da Silva",
        cpf: "111.222.333-44",
        email: "joao.silva@email.com",
        numero_processo: "0001234-56.2023.8.00.0000",
        status: "completo",
        documentos: [
            { nome: "Identidade", tem: true },
            { nome: "CPF", tem: true },
            { nome: "Certidão de Casamento", tem: true },
            { nome: "Comprovante de Residência", tem: true }
        ]
    },
    {
        id: 2,
        nome: "Maria Oliveira",
        cpf: "555.666.777-88",
        email: "maria.oliveira@email.com",
        numero_processo: "0009876-54.2023.8.00.0000",
        status: "pendente",
        documentos: [
            { nome: "Identidade", tem: false },
            { nome: "CPF", tem: true },
            { nome: "Certidão de Nascimento", tem: false },
            { nome: "Declaração de Bens", tem: false }
        ]
    },
    {
        id: 3,
        nome: "Carlos Souza",
        cpf: "999.888.777-66",
        email: "carlos.souza@email.com",
        numero_processo: "0004567-89.2022.8.00.0000",
        status: "pendente",
        documentos: [
            { nome: "Identidade", tem: true },
            { nome: "CPF", tem: true },
            { nome: "Declaração de Bens", tem: false },
            { nome: "Certidão de Casamento", tem: true }
        ]
    },
    {
        id: 4,
        nome: "Ana Costa",
        cpf: "222.333.444-55",
        email: "ana.costa@email.com",
        numero_processo: "0003333-22.2021.8.00.0000",
        status: "completo",
        documentos: [
            { nome: "CNH", tem: true },
            { nome: "Certidão de Casamento", tem: true },
            { nome: "Declaração de Bens", tem: true }
        ]
    },
    {
        id: 5,
        nome: "Roberto Alves",
        cpf: "444.555.666-77",
        email: "roberto.alves@email.com",
        numero_processo: "0007777-88.2023.8.00.0000",
        status: "pendente",
        documentos: [
            { nome: "Identidade", tem: false },
            { nome: "CPF", tem: false },
            { nome: "Certidão de Casamento", tem: false },
            { nome: "Comprovante de Residência", tem: false }
        ]
    }
];

let unassignedDocuments = [];

// Middleware de API KEY
const checkApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey === API_KEY) {
        next();
    } else {
        res.status(401).json({ error: 'Não autorizado. Chave de API inválida.' });
    }
};

// Rotas da API

// 1. Obter lista de clientes (Usada pelo frontend)
app.get('/api/clientes', (req, res) => {
    res.json(clientsData);
});

// 2. Obter lista de novos documentos (Usada pelo frontend)
app.get('/api/documentos-novos', (req, res) => {
    res.json(unassignedDocuments);
});

// 3. Upload de Documento Novo (API Externa Segura)
// Aceita um form-data com:
// - documento: arquivo (File)
// - remetente: string (opcional)
app.post('/api/upload-documento', checkApiKey, upload.single('documento'), (req, res) => {
    try {
        const { remetente } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ 
                error: 'Faltam parâmetros. Necessário o arquivo em "documento".' 
            });
        }

        const newDoc = {
            id: Date.now(),
            fileName: file.originalname,
            savedName: file.filename,
            remetente: remetente || 'Desconhecido',
            dataRecebimento: new Date().toISOString()
        };

        // Adiciona no início da lista (mais recentes primeiro)
        unassignedDocuments.unshift(newDoc);

        res.status(200).json({
            success: true,
            message: 'Documento recebido e salvo na caixa de entrada com sucesso.',
            document: newDoc
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Tratamento de erros do Multer
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `Erro no upload: ${err.message}` });
    } else if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
});

// Inicia servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse a interface em: http://localhost:${PORT}`);
});
