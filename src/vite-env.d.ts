/// <reference types="vite/client" />

declare module '*.css' {
  const content: string;
  export default content;
}

declare module 'figma:asset/*' {
  const url: string;
  export default url;
}
