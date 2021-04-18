import "reflect-metadata";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./reslovers/Hello";
import { PostResolver } from "./reslovers/post";
import { UserResolver } from "./reslovers/user";
import { createConnection } from "typeorm";

import Redis from "ioredis";
import session from "express-session";
import connectRedis, { RedisStoreOptions } from "connect-redis";
import { COOKIE_NAME, __prod__ } from "./constants";
import { RedditDbContext } from "./types";
import mySecretKeys from "./secretkeys";
import path from "path";

import cors from "cors";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import { Upvote } from "./entities/UpVote";
// import { sendEmail } from "./utils/sendEmail";
// import { User } from "./entities/User";

const main = async () => {
  // sendEmail("rasika@test.com", "hello");

  const conn = await createConnection({
    type: "postgres",
    database: "redditdev03",
    username: "postgres",
    password: mySecretKeys.myDbPassword,
    logging: true,
    synchronize: true,
    entities: [Post, User, Upvote],
    migrations: [path.join(__dirname, "./migrations/*")],
  } as any);

  // await Post.delete({})

  await conn.runMigrations();

  const port = 4001;

  // create a express server
  const app = express();

  const RedisStore = connectRedis(session);
  // const redis =  Redis();
  const redis = new Redis();

  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );

  const options: RedisStoreOptions = {
    disableTouch: true,
    client: redis as any,
  };
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore(options),
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
    context: ({ req, res }: RedditDbContext) => ({
      req,
      res,
      redis,
    }),
  });

  apolloServer.applyMiddleware({ app, cors: false });

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
