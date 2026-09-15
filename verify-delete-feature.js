const fs = require('fs');
const src = fs.readFileSync('./app.js', 'utf8');

if (!src.includes('deleteStudent') || !src.includes('delete-btn')) {
    throw new Error('Função de exclusão não encontrada no código.');
}

console.log('Verificação de exclusão ok.');
