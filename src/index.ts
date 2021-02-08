import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import microConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./reslovers/Hello";
import { PostResolver } from "./reslovers/post";
import { UserResolver } from "./reslovers/user";

import redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";
import { __prod__ } from "./constants";
import { RedditDbContext } from "./types";

const main = async () => {
  const orm = await MikroORM.init(microConfig);
  // run migration 
  await orm.getMigrator().up();

  const port = 4001;

  // create a express server
  const app = express();

  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient();

  app.use(
    session({
      name: "qid",
      store: new RedisStore({ client: redisClient, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365,
        httpOnly: true,
        sameSite: "lax", // protect from csrf
        secure: __prod__,
      },
      secret: "L^DZLhrrO@npmBbp7@nZOUH$3oUA!f",
      saveUninitialized: false,
      resave: false,
    })
  );

  // create an Apollo Object with configurations
  // register the resolvers in here
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }: RedditDbContext) => ({ em: orm.em, req, res }),
  });

  apolloServer.applyMiddleware({ app });

  // app.get("/", (req, res) => {
  //   res.json({ hello: "world" });
  // });

  app.listen(port, () => {
    console.log(`Server Start to Listen Port ${port}`);
  });

  // const post = orm.em.create(Post, {
  //   title: "Let's learn react",
  // });
  // await orm.em.persistAndFlush(post);
};

main().catch((err) => console.log(err));
