import { MikroORM } from "@mikro-orm/core";
import { Post } from "./entities/Post";
import microConfig from "./mikro-orm.config";

const main = async () => {
  const orm = await MikroORM.init(microConfig);
  // run migration
  await orm.getMigrator().up();

  const post = orm.em.create(Post, {
    title: "Let's learn react",
  });
  await orm.em.persistAndFlush(post);
};

main().catch((err) => console.log(err));
