import { describe, it, expect } from "vitest";
import { buildSchema, parse, validate } from "graphql";
import { createComplexityLimitRule } from "../src";

describe("createComplexityLimitRule", () => {
  it("allows query within max complexity", () => {
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

    const document = parse(query);
    const errors = validate(schema, document, [
      createComplexityLimitRule({
        maxComplexity: 5,
      }),
    ]);

    expect(errors).toHaveLength(0);
  });

  // Test 2 — blocks query exceeding max complexity
  it("blocks query exceeding max complexity", () => {
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

    const document = parse(query);
    const errors = validate(schema, document, [
      createComplexityLimitRule({
        maxComplexity: 2,
      }),
    ]);

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("exceeds");
  });

  // Test 3 — uses default cost
  it("uses default cost when no field cost provided", () => {
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

    const document = parse(query);
    const errors = validate(schema, document, [
      createComplexityLimitRule({
        maxComplexity: 2,
      }),
    ]);

    expect(errors).toHaveLength(1);
  });

  // Test 4 — applies custom field costs
  it("applies custom field costs", () => {
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

    const document = parse(query);
    const errors = validate(schema, document, [
      createComplexityLimitRule({
        maxComplexity: 3,
        fieldCosts: {
          posts: 3,
        },
      }),
    ]);

    expect(errors).toHaveLength(1);
  });

  // Test 5 — ignores introspection fields
  it("ignores introspection fields", () => {
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

    const document = parse(query);
    const errors = validate(schema, document, [
      createComplexityLimitRule({
        maxComplexity: 1,
      }),
    ]);

    expect(errors).toHaveLength(0);
  });

  // Test 6 — custom error message
  it("uses custom error message", () => {
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

    const document = parse(query);
    const errors = validate(schema, document, [
      createComplexityLimitRule({
        maxComplexity: 2,
        message: (cost, max) => `Cost ${cost} exceeds ${max}`,
      }),
    ]);

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("Cost");
  });

  // Test 7 — validates only executed operation
  it("validates only the executed operation", () => {
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
    const document = parse(query);
    const errors = validate(schema, document, [
      createComplexityLimitRule({
        maxComplexity: 1,
      }),
    ]);
    expect(errors.length).toBeGreaterThan(0);
  });
});
