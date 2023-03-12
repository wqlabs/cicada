import Koa, { DefaultState } from 'koa';
import parasite from '@/middlewares/parasite';
import catcher from '@/middlewares/catcher';
import authorize from '@/middlewares/authorize';
import { Context } from './constants';
import router from './router';

export function getApiApp() {
  const app = new Koa<DefaultState, Context>();
  app.use(parasite);
  app.use(catcher);
  app.use(authorize);
  app.use(router.routes()).use(router.allowedMethods());
  return app;
}
