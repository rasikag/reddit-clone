import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core"

export type  RedditDbContext {
em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>
} 