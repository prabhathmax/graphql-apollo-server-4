/* eslint-disable no-param-reassign */
/* eslint-disable func-names */
/* eslint-disable  consistent-return */
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { defaultFieldResolver, GraphQLError } from 'graphql';

function AuthenticatedDirectiveTransformer(schema, directiveName) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authenticatedDirective = getDirective(schema, fieldConfig, directiveName)?.[0];

      if (authenticatedDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;
        fieldConfig.resolve = async function (source, args, context, info) {
          const result = await resolve(source, args, context, info);
          if (!context.currentAccountId) {
            throw new GraphQLError('Not authenticated.', {
              extensions: {
                code: 'UNAUTHENTICATED',
              },
            });
          }
          return result;
        };
        return fieldConfig;
      }
    },
  });
}

export default AuthenticatedDirectiveTransformer;
