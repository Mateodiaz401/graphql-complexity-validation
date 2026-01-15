import { describe, it, expect } from "vitest";
import { graphql, buildSchema } from "graphql";
import { createComplexityLimitRule } from "../src";

describe("createComplexityLimitRule", () => {
  // Test 1 — allows query within max complexity
  it("allows query within max complexity", async () => {
    const schema = buildSchema(`
      type Query {
        user: User
      }

      type User {
        id: ID
        name: String
      }
    `);

    const query = `
      query {
        user {
          id
          name
        }
      }
    `;

    const result = await graphql({
      schema,
      source: query,
      validationRules: [
        createComplexityLimitRule({
          maxComplexity: 5,
        }),
      ],
    });

    expect(result.errors).toBeUndefined();
  });
  // Test 2 — blocks query exceeding max complexity
  it("blocks query exceeding max complexity", async () => {
    const schema = buildSchema(`
    type Query {
      user: User
    }

    type User {
      posts: [Post]
    }

    type Post {
      comments: [Comment]
    }

    type Comment {
      id: ID
    }
  `);

    const query = `
    query {
      user {
        posts {
          comments {
            id
          }
        }
      }
    }
  `;

    const result = await graphql({
      schema,
      source: query,
      validationRules: [
        createComplexityLimitRule({
          maxComplexity: 2,
        }),
      ],
    });

    expect(result.errors).toHaveLength(1);
  });
  //Test 3 — uses default cost
  it("uses default cost when no field cost provided", async () => {
    const schema = buildSchema(`
    type Query {
      a: A
    }

    type A {
      b: B
    }

    type B {
      c: String
    }
  `);

    const query = `
    query {
      a {
        b {
          c
        }
      }
    }
  `;

    const result = await graphql({
      schema,
      source: query,
      validationRules: [
        createComplexityLimitRule({
          maxComplexity: 2,
        }),
      ],
    });

    expect(result.errors).toHaveLength(1);
  });
  // Test 4 — applies custom field costs
  it("applies custom field costs", async () => {
    const schema = buildSchema(`
    type Query {
      user: User
    }

    type User {
      posts: [Post]
    }

    type Post {
      id: ID
    }
  `);

    const query = `
    query {
      user {
        posts {
          id
        }
      }
    }
  `;

    const result = await graphql({
      schema,
      source: query,
      validationRules: [
        createComplexityLimitRule({
          maxComplexity: 3,
          fieldCosts: {
            posts: 3,
          },
        }),
      ],
    });

    expect(result.errors).toHaveLength(1);
  });

  // Test 5 — ignores introspection fields
  it("ignores introspection fields", async () => {
    const schema = buildSchema(`
    type Query {
      hello: String
    }
  `);

    const query = `
    query {
      __schema {
        types {
          name
        }
      }
    }
  `;

    const result = await graphql({
      schema,
      source: query,
      validationRules: [
        createComplexityLimitRule({
          maxComplexity: 1,
        }),
      ],
    });

    expect(result.errors).toBeUndefined();
  });

  // Test 6 — custom error message
  it("uses custom error message", async () => {
    const schema = buildSchema(`
    type Query {
      a: A
    }

    type A {
      b: B
    }

    type B {
      c: String
    }
  `);

    const query = `
    query {
      a {
        b {
          c
        }
      }
    }
  `;

    const result = await graphql({
      schema,
      source: query,
      validationRules: [
        createComplexityLimitRule({
          maxComplexity: 2,
          message: (cost, max) => `Cost ${cost} exceeds ${max}`,
        }),
      ],
    });

    expect(result.errors?.[0].message).toContain("Cost");
  });
  // Test 7 — validates only executed operation
  it("validates only the executed operation", async () => {
    const schema = buildSchema(`
    type Query {
      a: A
      b: B
    }

    type A {
      x: X
    }

    type X {
      y: String
    }

    type B {
      id: ID
    }
  `);

    const query = `
    query A {
      a {
        x {
          y
        }
      }
    }

    query B {
      b {
        id
      }
    }
  `;

    const result = await graphql({
      schema,
      source: query,
      operationName: "B",
      validationRules: [
        createComplexityLimitRule({
          maxComplexity: 1,
        }),
      ],
    });

    expect(result.errors).toBeUndefined();
  });
});
