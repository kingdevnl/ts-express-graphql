import { Resolvers, User } from '../../graphql/types';
import { pubsub } from '../../server';
var crypto = require('crypto');


const USERS: Array<User> = [
    {
        id: 0,
        firstName: 'James',
        lastName: 'Potter',
    },
    {
        id: 1,
        firstName: 'Jonny',
        lastName: 'Green',
    },
];

export const UsersResolver: Resolvers = {
    /**
     * Resolves a field
     */
    User: {
        md5: (parent, args, context) => {
            return crypto.createHash('md5').update(parent.firstName+parent.lastName).digest("hex");
        }
    },
    /**
     * Resolves a query
     */
    Query: {
        users: (parent, args, context) => {
            // console.log(context.req.headers.authorization);
            return USERS;
        },
    },
    /**
     * Resolves a mutation
     */
    Mutation: {
        createUser: async (parent, args, context) => {
            const user = {
                id: USERS.length + 1,
                ...args,
            };
            USERS.push(user);

            await pubsub.publish('USER_CREATED', user)
            return user.id;
        },
    },
    /**
     * Resolves a subscription
     */
    Subscription: {
        userCreated: {
            subscribe: ()=> pubsub.asyncIterator(['USER_CREATED']),
            resolve: (data) => data
        }
    }

};
