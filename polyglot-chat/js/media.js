// js/media.js — image/video picking + base64 upload through the backend.
window.PC = window.PC || {};
PC.media = {
  pickAndSend(kind, me, conversationId, onDone) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = kind === 'image' ? 'image/jpeg,image/png,image/webp,image/gif' : 'video/mp4,video/webm';
    input.onchange = async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      if (file.size > 20 * 1024 * 1024) { PC.ui.toast('File too large (max 20MB)'); return; }
      PC.ui.toast('Sending ' + kind + '…');
      try {
        const dataBase64 = await PC.media.toBase64(file);
        await PC.api.post('upload-media', {
          userId: me.userId,
          conversationId,
          clientMessageId: crypto.randomUUID(),
          kind,
          fileName: file.name,
          mimeType: file.type,
          dataBase64,
        });
        onDone && onDone();
      } catch (err) {
        PC.ui.toast(err.message);
      }
    };
    input.click();
  },
  toBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1]);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
};
