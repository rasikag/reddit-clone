import "reflect-metadata"
import { MikroORM } from "@mikro-orm/core";
import microConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./reslovers/Hello";
import { PostResolver } from "./reslovers/post";

const main = async () => {
  const orm = await MikroORM.init(microConfig);
  // run migration
  await orm.getMigrator().up();

  const port = 4001;

  // create a express server 
  const app = express();

  // create an Apollo Object with configurations 
  // register the resolvers in here
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver],
      validate: false,
    }),
    context: () => ({ em: orm.em }),
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
