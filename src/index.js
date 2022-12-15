import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import jwt from 'jsonwebtoken';
import createSchema from './graphql';
import createContext from './context';

const port = /^\d+$/.test(process.env.PORT) ? Number(process.env.PORT) : 4000;
const getCurrentAccountId = async ({ headers }, jwtSecret) => {
  const matcher = /^Bearer .+$/gi;
  const { authorization = null } = headers;
  if (authorization && matcher.test(authorization)) {
    const [, token] = authorization.split(/\s+/);
    try {
      const secret = await jwtSecret.get();
      const { id: accountId = null } = jwt.verify(token, secret);
      return accountId;
    } catch (e) {
      // We do nothing so it returns null
    }
  }

  return null;
};
(async () => {
  const context = await createContext();
  const server = new ApolloServer({
    schema: createSchema,
  });
  const { url } = await startStandaloneServer(server, {
    context: async ({ req }) => {
      const currentAccountId = await getCurrentAccountId(req, context.secrets.jwt);
      return {
        ...context,
        currentAccountId,
      };
    },
    listen: { port },
  });
  /* eslint-disable no-console */
  console.log(`🚀 Server ready at ${url}`);
})().catch((error) => {
  /* eslint-disable no-console */
  console.log(error);
});
