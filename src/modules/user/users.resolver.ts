import { Resolvers, User } from '../../graphql/types';
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

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
    Query: {
        users: (parent, args, context) => {
            console.log(context.req.headers.authorization);
            return USERS;
        },
    },
    Mutation: {
        createUser: (parent, args, context) => {
            const user = {
                id: USERS.length + 1,
                ...args,
            };
            USERS.push(user);

            pubsub.publish('USER_CREATED', user)
            return user.id;
        },
    },
    Subscription: {
        userCreated: {
            subscribe: ()=> pubsub.asyncIterator(['USER_CREATED']),
            resolve: (data) => data
        }
    }

};
