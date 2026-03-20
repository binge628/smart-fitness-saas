declare module '../swagger' {
  import { Express } from 'express';
  export default function SwaggerDoc(app: Express): void;
}