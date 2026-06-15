// Script utilitário (FASE 1): gera 4 arquivos MP3 silenciosos como placeholders
// para assets/audio/. Cada arquivo é um MP3 mono 32kbps/44.1kHz válido, com
// frames preenchidos de zeros (silêncio). Servem apenas para satisfazer o
// critério "4 arquivos de áudio carregam sem erro" até que os sons reais
// (suspense, baú, vitória, tesouro) sejam definidos na FASE 5.
//
// Executar: node _gerar-audio-placeholder.cjs
// Pode ser apagado após a geração dos arquivos.

const fs = require('fs');
const path = require('path');

const FRAME_HEADER = Buffer.from([0xff, 0xfb, 0x10, 0xc4]);
const FRAME_BODY = Buffer.alloc(100, 0x00); // 17 (side info) + 83 (main data), mono
const FRAME = Buffer.concat([FRAME_HEADER, FRAME_BODY]); // 104 bytes ~26.1ms
const FRAMES = 20; // ~0.52s

const mp3 = Buffer.concat(Array.from({ length: FRAMES }, () => FRAME));

const outDir = path.join(__dirname, 'assets', 'audio');
const arquivos = ['suspense.mp3', 'bau.mp3', 'vitoria.mp3', 'tesouro.mp3'];

for (const nome of arquivos) {
  fs.writeFileSync(path.join(outDir, nome), mp3);
  console.log('Gerado:', nome, `(${mp3.length} bytes)`);
}
