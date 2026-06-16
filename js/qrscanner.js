// Leitura de QR Code via câmera usando jsQR (js/vendor/jsQR.js, carregado
// como <script> não-módulo antes deste arquivo para expor `jsQR` no escopo
// global). Usado exclusivamente pela tela de Pescaria (FASE 9).

let streamAtivo = null;
let animFrameId = null;

// Inicia a câmera e lê frames continuamente até encontrar um QR Code.
// Chama `onLeitura(codigo)` na primeira leitura e para o scanner.
// Chama `onErro(mensagem)` se a câmera não puder ser iniciada.
export function iniciarScanner(videoEl, canvasEl, { onLeitura, onErro }) {
  const ctx = canvasEl.getContext('2d', { willReadFrequently: true });

  pararScanner(videoEl);

  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: { ideal: 'environment' } } })
    .then((stream) => {
      streamAtivo = stream;
      videoEl.srcObject = stream;
      videoEl.setAttribute('playsinline', '');
      videoEl.play();
      tick();
    })
    .catch((err) => onErro(`Câmera indisponível: ${err.message}`));

  function tick() {
    if (!streamAtivo) return;
    if (videoEl.readyState === videoEl.HAVE_ENOUGH_DATA) {
      canvasEl.width = videoEl.videoWidth;
      canvasEl.height = videoEl.videoHeight;
      ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
      const img = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
      // jsQR está no escopo global (carregado via <script src="../js/vendor/jsQR.js">)
      const code = jsQR(img.data, img.width, img.height);
      if (code?.data) {
        pararScanner(videoEl);
        onLeitura(code.data.trim());
        return;
      }
    }
    animFrameId = requestAnimationFrame(tick);
  }
}

// Para o scanner e libera a câmera.
export function pararScanner(videoEl) {
  cancelAnimationFrame(animFrameId);
  animFrameId = null;
  if (streamAtivo) {
    streamAtivo.getTracks().forEach((t) => t.stop());
    streamAtivo = null;
  }
  if (videoEl) videoEl.srcObject = null;
}
