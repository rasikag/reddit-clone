import { Post } from "../entities/Post";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { RedditDbContext } from "src/types";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
import { Upvote } from "../entities/Upvote";
// import { sleep } from "./sleep";

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: RedditDbContext
  ) {
    const isUpvote = value !== -1;
    const realValue = isUpvote ? 1 : -1;
    const { userId } = req.session;

    const upvote = await Upvote.findOne({ where: { postId, userId } });

    if (upvote && upvote.value !== realValue) {
      await getConnection().transaction(async (tm) => {
        await tm.query(
          ` update upvote
            set value = $1
            where "postId" = $2 and "userId" = $3`,
          [realValue, postId, userId]
        );

        await tm.query(
          ` update post
            set points = points + $1
            where id = $2`,
          [2 * realValue, postId]
        );
      });
    } else if (!upvote) {
      // has never voted before
      await getConnection().transaction(async (tm) => {
        await tm.query(
          ` insert into upvote ("userId", "postId", value)
            values ($1, $2, $3)`,
          [userId, postId, realValue]
        );

        await tm.query(
          ` update post
            set points = points + $1
            where id = $2`,
          [realValue, postId]
        );
      });
    }

    return true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: RedditDbContext
  ): Promise<PaginatedPosts> {
    // return await Post.find();
    // using query builder
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    const replacement: any[] = [realLimitPlusOne];

    if (req.session.userId) {
      replacement.push(req.session.userId);
    }
    let cursorIdx = 3;
    if (cursor) {
      replacement.push(new Date(parseInt(cursor)));
      cursorIdx = replacement.length;
    }

    const posts = await getConnection().query(
      `
      SELECT p.*,
      json_build_object(
        'id', u.id,
        'username', u.username,
        'email', u.email
      ) creator,
      ${
        req.session.userId
          ? '(select value from upvote where "userId" = $2 and "postId" = p.id) "voteStatus"'
          : 'null as "voteStatus"'
      }
      FROM post p 
      INNER JOIN public.user u on u.id = p."creatorId"
      ${cursor ? ` WHERE  p."createdAt" < $${cursorIdx}` : ""}
      ORDER BY p."createdAt" DESC
      LIMIT $1
      `,
      replacement
    );

    // const qb = getConnection()
    //   .getRepository(Post)
    //   .createQueryBuilder("p")
    //   .innerJoinAndSelect("p.creator", "u", 'u.id = p."creatorId"')
    //   .orderBy('p."createdAt"', "DESC")
    //   .take(realLimitPlusOne);

    // if (cursor) {
    //   qb.where('p."createdAt" < :cursor', {
    //     cursor: new Date(parseInt(cursor)),
    //   });
    // }

    // const posts = await qb.getMany();

    console.log(posts);

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    };
  }

  // return a post or null
  @Query(() => Post, { nullable: true })
  post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    // this should be match with post entity relation's property name
    return Post.findOne(id, { relations: ["creator"] });
  }

  // @Arg("title", () => Int) title: string,
  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: RedditDbContext
  ): Promise<Post> {
    return Post.create({ ...input, creatorId: req.session.userId }).save();
  }

  @Mutation(() => Post)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String, { nullable: true }) title: string,
    @Arg("text") text: string,
    @Ctx() { req }: RedditDbContext
  ): Promise<Post | null> {
    // const post = await Post.findOne(id);
    // if (!post) {
    //   return null;
    // }
    // if (typeof title !== "undefined") {
    //   await Post.update({ id }, { title });
    // }
    // return post;
    // return Post.update({ id, creatorId: req.session.userId }, { title, text });
    const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :id and "creatorId" = :creatorId', {
        id,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute();
    return result.raw[0];
  }

  @Mutation(() => Boolean)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: RedditDbContext
  ): Promise<boolean> {
    // const post = await Post.findOne(id);
    // if (!post) {
    //   return false
    // }
    // if (post.creatorId !== req.session.userId) {
    //   throw new Error("not authorize")
    // }
    // await Upvote.delete({postId: id});
    await Post.delete({ id, creatorId: req.session.userId });
    return true;
  }
}
