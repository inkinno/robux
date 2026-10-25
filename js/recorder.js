// 화면 녹화: canvas.captureStream + MediaRecorder (.webm 다운로드)
let activeRecorder = null;
let recordingChunks = [];

function pickRecordMime() {
  const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return types.find(t => MediaRecorder.isTypeSupported(t));
}

function startRecording() {
  if (activeRecorder) return;
  if (!window.MediaRecorder || !canvas.captureStream) {
    alert('현재 브라우저 환경에서는 캔버스 화면 녹화를 지원하지 않습니다.');
    return;
  }
  recordingChunks = [];
  const mime = pickRecordMime();
  const rec = new MediaRecorder(
    canvas.captureStream(30),
    mime ? { mimeType: mime, videoBitsPerSecond: 16000000 } : {}
  );
  rec.ondataavailable = e => {
    if (e.data && e.data.size > 0) recordingChunks.push(e.data);
  };
  rec.onstop = () => {
    if (!recordingChunks.length) return;
    const blob = new Blob(recordingChunks, { type: 'video/webm' });
    const link = document.createElement('a');
    link.download = `art_split_record_${Date.now()}.webm`;
    link.href = URL.createObjectURL(blob);
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 10000);
  };
  rec.start(500);
  activeRecorder = rec;

  const btn = $('btn-record');
  if (btn) {
    btn.textContent = '⏹️ 녹화 중지 & 저장';
    btn.style.backgroundColor = '#ef4444';
    btn.style.color = '#ffffff';
  }
}

function stopRecording() {
  if (!activeRecorder) return;
  const rec = activeRecorder;
  activeRecorder = null;
  if (rec.state !== 'inactive') {
    rec.stop();
  }
  const btn = $('btn-record');
  if (btn) {
    btn.textContent = '🎥 화면 녹화 시작 (.webm)';
    btn.style.backgroundColor = '';
    btn.style.color = '';
  }
}

function toggleRecording() {
  if (activeRecorder) stopRecording();
  else startRecording();
}
