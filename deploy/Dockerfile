FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3001 NODE_OPTIONS=--max-old-space-size=160
RUN addgroup -S nuxt && adduser -S nuxt -G nuxt
COPY --chown=nuxt:nuxt .output ./.output
USER nuxt
EXPOSE 3001
CMD ["node", ".output/server/index.mjs"]
