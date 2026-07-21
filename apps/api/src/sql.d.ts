/** Migration SQL is bundled as text modules (wrangler.toml `[[rules]]`). */
declare module "*.sql" {
  const content: string;
  export default content;
}
