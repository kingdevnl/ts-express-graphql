import { loadSchemaSync } from '@graphql-tools/load';
import { addResolversToSchema } from '@graphql-tools/schema';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { merge } from 'lodash';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { execute, subscribe } from 'graphql';
import { PubSub } from 'graphql-subscriptions';

import { UsersResolver } from './modules/user/users.resolver';

const baseSchema = loadSchemaSync(__dirname + '/**/*.graphql', {
    loaders: [new GraphQLFileLoader()],
});

export const schema = addResolversToSchema({
    schema: baseSchema,
    resolvers: merge(UsersResolver),
});

export const pubsub = new PubSub();

async function start() {
    const app = express();
    const httpServer = createServer(app);
    const subscriptionServer = SubscriptionServer.create({
        // This is the `schema` we just created.
        schema,
        // These are imported from `graphql`.
        execute,
        subscribe,
    }, {
        // This is the `httpServer` we created in a previous step.
        server: httpServer,
        // This `server` is the instance returned from `new ApolloServer`.
        path: "/graphql",
    });

    const server = new ApolloServer({
        schema: schema,
        plugins: [{
            async serverWillStart() {
                return {
                    async drainServer() {
                        subscriptionServer.close();
                    }
                };
            }
        }],
        context: ({ req, res }) => {
            const token = req.headers.authorization || '';
            return { req, res };
        },
    });



    await server.start();

    app.use(cors());

    server.applyMiddleware({
        app,
        cors: false,
    });

    httpServer.listen(3000, () => {
        console.log('Server is running at http://localhost:3000/graphql');
    });
}

start().catch(reason => console.error(reason));
