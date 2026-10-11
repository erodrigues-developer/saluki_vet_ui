export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('render:html', (html, { event }) => {
    const nonce = event.context.cspNonce;
    if (!nonce) return;
    for (const key of ['head', 'bodyPrepend', 'body', 'bodyAppend'] as const) {
      html[key] = html[key].map((fragment: string) => fragment.replace(/<script\b(?![^>]*\bnonce=)/gi, `<script nonce="${nonce}"`));
    }
  });
});
