import { SecretsManager } from 'aws-sdk';

const SECRETS_NAME = 'secret/name'; // - you need to add secret name here.
const has = Object.prototype.hasOwnProperty;

export const DEFAULT_TTL = 3600;

async function simpleDecode(json, keys) {
  const obj = typeof json === 'string' ? JSON.parse(json) : json;

  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new Error(`Expected secret store JSON to parse to an object, but got the JSON: ${json}`);
  }
  const result = {};

  for (const key of keys) {
    if (
      (has.call(obj, key) && !obj[key]) ||
      typeof obj[key] === 'string' ||
      typeof obj[key] === 'number'
    ) {
      result[key] = obj[key];
    } else {
      throw new Error(
        `Missing key "${key}" in secret parsed from this JSON: ${JSON.stringify(obj)}`,
      );
    }
  }

  return result;
}

const smRegion = process.env.AWS_REGION;

if (!/^[\w\d-]+$/.test(smRegion)) {
  throw new Error(`Invalid AWS_REGION env var of ${JSON.stringify(process.env.AWS_REGION)}`);
}

const manager = new SecretsManager({
  region: smRegion,
});

// Simple TTL cache with concurrent calls to .get() sharing
// a lookup.
export class SecretsCache {
  constructor() {
    this.state = { expiresAt: null, promise: null, ttl: DEFAULT_TTL };
    this.key = SECRETS_NAME;

    this.fetches = 0;
  }

  async get() {
    let { expiresAt, promise, ttl } = this.state;

    if (expiresAt && Date.now() > expiresAt) {
      promise = null;
    }

    if (!promise) {
      // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SecretsManager.html#getSecretValue-property
      promise = manager
        .getSecretValue({
          SecretId: SECRETS_NAME,
        })
        .promise()
        .then((res) => {
          const decoded = simpleDecode(
            res.SecretString,
            [].concat(DbSecrets.keys(), JwtSecret.keys()),
          );
          ttl = Number(decoded.TTL) || DEFAULT_TTL;
          this.state.ttl = ttl;

          return decoded;
        })
        .catch(() => {
          //eslint-disable-line
          const envVars = [...DbSecrets.keys(), ...JwtSecret.keys()];
          throw new Error(`Missing some required env variables \n\t${envVars.join(`\n\t`)}`);
        });

      this.fetches += 1;

      expiresAt = Date.now() + ttl;
      this.state = { promise, expiresAt, ttl };
    }

    const secret = await promise;
    return secret;
  }
}

export class DbSecrets {
  constructor(cache) {
    this.cache = cache;
  }

  static keys() {
    return ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  }

  // Returns `{ host: string, username: string, password: string, database: string }`;
  async get() {
    const useEnv = DbSecrets.keys().every((key) => !!process.env[key]);

    const obj = useEnv ? process.env : await this.cache.get();
    return {
      host: obj.DB_HOST,
      username: obj.DB_USER,
      password: obj.DB_PASSWORD,
      database: obj.DB_NAME,
    };
  }

  async getAsKnex() {
    const { host, username: user, password, database } = await this.get();
    return { host, user, password, database };
  }
}

export class JwtSecret {
  constructor(cache) {
    this.cache = cache;
  }

  static keys() {
    return ['JWT_SECRET'];
  }

  async get() {
    if (process.env.JWT_SECRET) {
      return process.env.JWT_SECRET;
    }
    return this.cache.get().then((secrets) => secrets.JWT_SECRET);
  }
}
