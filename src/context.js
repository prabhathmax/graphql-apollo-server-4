import Knex from 'knex';
import 'dotenv/config';
import { SecretsCache, DbSecrets, JwtSecret } from './helpers/secretsCache';
import AccountRepository from './domain/account/repository';
import AccountService from './domain/account/service';
import AuthenticationService from './domain/authentication/service';
import RoleRepository from './domain/role/repository';
import RoleService from './domain/role/service';
import PermissionRepository from './domain/permission/repository';
import PermissionService from './domain/permission/service';

const { createLogger, format, transports } = require('winston');

const createContext = async () => {
  const secretsCache = new SecretsCache();
  const dbSecrets = new DbSecrets(secretsCache);
  const jwtSecret = new JwtSecret(secretsCache);
  const knex = Knex({
    client: 'mysql',
    connection: await dbSecrets.getAsKnex(),
    pool: { min: 0, max: 7 },
    useNullAsDefault: true,
  });
  const access = createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    exitOnError: false,
    format: format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.errors({ stack: true }),
        format.splat(),
        format.json(),
    ),
    transports: [new transports.Console()],
  });
  const accountRepository = new AccountRepository(knex);
  const accountService = new AccountService(accountRepository);
  const authenticationService = new AuthenticationService(accountService, jwtSecret);
  const roleRepository = new RoleRepository(knex);
  const roleService = new RoleService(roleRepository);
  const permissionRepository = new PermissionRepository(knex);
  const permissionService = new PermissionService(permissionRepository);
  return {
    log: {
      access,
    },
    secrets: {
      db: dbSecrets,
      jwt: jwtSecret,
    },
    repositories: {
      account: accountRepository,
      role: roleRepository,
      permission: permissionRepository,
    },
    services: {
      account: accountService,
      authentication: authenticationService,
      role: roleService,
      permission: permissionService,
    },
  };
};

export default createContext;
