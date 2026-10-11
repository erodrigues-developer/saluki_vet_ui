import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';

for (const [file, field, handler] of [
  ['app/pages/consultas/novo-atendimento.vue', 'originalComplaint', 'onOriginalComplaintChange'],
  ['app/components/consultations/ConsultationForm.vue', 'mainComplaint', 'handleChiefComplaintInput'],
]) {
  test(`${file}: live partials, final corrections, pause/resume and text-only submission`, async () => {
    const source = readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
    const instances = [];
    class Recognition {
      start() { instances.push(this); }
      stop() { this.stopped = true; }
      emit(text, final = false) { this.onresult({ resultIndex: 0, results: [{ isFinal: final, 0: { transcript: text } }] }); }
    }
    const ref = value => ({ value });
    let sent;
    const model = { id: 12, [field]: 'Relato inicial.' };
    const context = {
      model, speechRecognition: null, hasBrowserTranscript: ref(false),
      isRecording: ref(false), isRecordingPaused: ref(false), canUseAudioCapture: ref(true),
      recordingTicker: null, recordingStartedAt: null, recordingElapsedSeconds: ref(0),
      isOriginalTranscriptReadonly: ref(true), isConsultationReadOnly: ref(false),
      isHydratingConsultation: ref(false), lastSubmittedSuggestionText: ref(''),
      aiInputDirty: ref(false), dismissedSuggestionId: ref(null), aiErrorMessage: ref(''),
      canAutoGenerate: ref(true), hasPendingSuggestion: ref(false), sendingDictation: ref(false),
      normalizedAutoSuggestionText: { get value() { return model[field]; } },
      cleanedMainComplaint: { get value() { return model[field]; } },
      normalizeSuggestionText: value => value, clearAutoSuggestionTimer() {}, scheduleAutoSuggestion() {},
      message: { warning() {}, error() {}, success() {} }, setInterval: () => 1, clearInterval() {},
      FormData, useApi: () => async (_url, options) => { sent = options.body; }, loadDictations: async () => {},
      getSpeechRecognitionCtor: () => Recognition,
    };
    const section = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
    const handlerCode = handler === 'onOriginalComplaintChange'
      ? section('const onOriginalComplaintChange =', 'const onAiOrganizedComplaintChange =')
      : section('const handleChiefComplaintInput =', 'const submitDictation =');
    const code = section('const cleanupRecordingResources =', 'const getSpeechRecognitionCtor =') || '';
    const cleanup = file.includes('/pages/') ? code : section('const cleanupRecordingResources =', 'const startSpeechRecognitionSession =');
    runInNewContext(stripTypeScriptTypes(cleanup + section('const startSpeechRecognitionSession =', 'const handleMicrophoneAction =') + handlerCode + section('const submitDictation =', 'const scheduleAutoSuggestion =') + '\nglobalThis.controls = { startRecording, stopRecording, toggleRecordingPause, submitDictation };'), context);
    await context.controls.startRecording();
    const first = instances[0];
    assert.equal(first.lang, 'pt-BR');
    assert.equal(first.interimResults, true);
    first.emit('Tutor relata vom');
    assert.equal(model[field], 'Relato inicial. Tutor relata vom');
    first.emit('Tutor relata vômito desde ontem', true);
    assert.equal(model[field], 'Relato inicial. Tutor relata vômito desde ontem');
    await context.controls.submitDictation();
    assert.equal(sent, undefined, 'must wait until dictation stops');
    context.controls.toggleRecordingPause();
    first.onend();
    assert.equal(instances.length, 1);
    context.controls.toggleRecordingPause();
    const second = instances[1];
    second.emit('e apatia', true);
    second.onend();
    assert.equal(instances.length, 3, 'restart when browser ends an active session');
    context.controls.stopRecording();
    instances[2].onend();
    await context.controls.submitDictation();
    assert.equal(sent.get('transcriptDraft'), 'Relato inicial. Tutor relata vômito desde ontem e apatia');
    assert.equal(sent.get('language'), 'pt-BR');
    assert.equal(sent.get('captureSource'), 'BROWSER_AUDIO');
    assert.equal(sent.has('audioFile'), false);
    await context.controls.startRecording();
    const failed = instances.at(-1);
    failed.onerror({ error: 'not-allowed' });
    const count = instances.length;
    failed.onend();
    assert.equal(context.isRecording.value, false);
    assert.equal(instances.length, count, 'permission errors must not restart recognition');
    context.canUseAudioCapture.value = false;
    await context.controls.startRecording();
    assert.equal(instances.length, count, 'unsupported browsers must not attempt capture');
  });
}

test('manual anamnesis can be used without dictation or AI approval', async () => {
  const source = readFileSync(new URL('../../app/pages/consultas/novo-atendimento.vue', import.meta.url), 'utf8');
  const section = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
  const model = { originalComplaint: '', anamnesisApproved: false };
  let persisted = false;
  const context = {
    model, manualAnamnesis: { value: false }, isConsultationReadOnly: { value: false },
    canSaveConsultation: { value: true }, currentStep: { value: 2 }, completedSteps: { value: new Set() },
    steps: { length: 6 }, persist: async () => { persisted = true; return true; },
    message: { warning() { throw new Error('Manual anamnesis must not require AI review'); } },
  };
  runInNewContext(stripTypeScriptTypes(section('const onAiOrganizedComplaintChange =', 'const openConsultationChat =') + section('const saveAndContinue =', 'const finalizeAttendance =') + '\nglobalThis.controls = { onAiOrganizedComplaintChange, saveAndContinue };'), context);
  context.controls.onAiOrganizedComplaintChange('Tutor relata inapetência desde ontem.');
  assert.equal(model.originalComplaint, '', 'manual anamnesis must not create a transcript');
  assert.equal(model.mainComplaint, model.aiOrganizedComplaint);
  assert.equal(model.anamnesisApproved, true);
  await context.controls.saveAndContinue();
  assert.equal(persisted, true);
  assert.equal(context.currentStep.value, 3);
});
