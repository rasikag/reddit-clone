import { Post } from "../entities/Post";
import { RedditDbContext } from "src/types";
import { Arg, Ctx, Int, Mutation, Query, Resolver } from "type-graphql";
// import { sleep } from "./sleep";



@Resolver()
export class PostResolver {
  @Query(() => [Post])
  async posts(@Ctx() { em }: RedditDbContext): Promise<Post[]> {
    // await sleep(3000);
    return em.find(Post, {});
  }

  // return a post or null
  @Query(() => Post, { nullable: true })
  post(
    @Arg("id", () => Int) id: number,
    @Ctx() { em }: RedditDbContext
  ): Promise<Post | null> {
    return em.findOne(Post, { id });
  }

  // @Arg("title", () => Int) title: string,
  @Mutation(() => Post)
  async createPost(
    @Arg("title") title: string,
    @Ctx() { em }: RedditDbContext
  ): Promise<Post> {
    const post = em.create(Post, { title });
    await em.persistAndFlush(post);
    return post;
  }

  @Mutation(() => Post)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String, { nullable: true }) title: string,
    @Ctx() { em }: RedditDbContext
  ): Promise<Post | null> {
    const post = await em.findOne(Post, { id });
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      post.title = title;
      await em.persistAndFlush(post);
    }
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { em }: RedditDbContext
  ): Promise<boolean> {
    try {
      await em.nativeDelete(Post, { id });
      return true;
    } catch (error) {
      return false;
    }
  }
}
