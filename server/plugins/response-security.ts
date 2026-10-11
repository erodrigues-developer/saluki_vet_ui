import { removeResponseHeader } from 'h3';

export default defineNitroPlugin((nitro) => {
  // The renderer can add its banner after request middleware has run.
  nitro.hooks.hook('beforeResponse', (event) => {
    removeResponseHeader(event, 'X-Powered-By');
  });
});
