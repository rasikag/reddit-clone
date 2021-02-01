import { MikroORM } from "@mikro-orm/core";
import { Post } from "./entities/Post";
import microConfig from "./mikro-orm.config";
import express from "express";

const main = async () => {
  const orm = await MikroORM.init(microConfig);
  // run migration
  await orm.getMigrator().up();

  const port = 4001;

  const app = express();

  app.get("/", (req, res) => {
    res.json({ hello: "world" });
  });

  app.listen(port, () => {
    console.log(`Server Start to Listen Port ${port}`);
  });

  // const post = orm.em.create(Post, {
  //   title: "Let's learn react",
  // });
  // await orm.em.persistAndFlush(post);
};

main().catch((err) => console.log(err));
