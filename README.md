# graphql-validation-complexity

![CI](https://github.com/Mateodiaz401/graphql-complexity-validation/actions/workflows/ci.yml/badge.svg)
![npm](https://img.shields.io/npm/v/graphql-complexity-validation)
![license](https://img.shields.io/npm/l/graphql-complexity-validation)

A lightweight, framework-agnostic GraphQL validation rule to limit query complexity and protect your server from expensive queries.

✅ Zero dependencies
✅ Compatible with `graphql-js` validation
✅ Works with Apollo Server, GraphQL Yoga, Envelop, NestJS
✅ Supports fragments, inline fragments, and introspection
✅ Fully typed (TypeScript)

---

## Installation

```bash
npm install graphql-complexity-validation
```

or

```bash
yarn add graphql-complexity-validation
```

---

## Basic Usage

```ts
import { validate, parse } from "graphql";
import { createComplexityLimitRule } from "graphql-complexity-validation";

const errors = validate(schema, parse(query), [
  createComplexityLimitRule({
    maxComplexity: 10,
  }),
]);
```

If the query exceeds the configured complexity, a validation error is returned.

---

## How Complexity Is Calculated

- Each field has a **cost**
- Default field cost is `1`
- Nested fields add their cost recursively
- Fragments and inline fragments are fully supported
- Introspection fields (`__schema`, `__type`, etc.) are ignored by default

Example:

```graphql
query {
  user {
    posts {
      comments {
        id
      }
    }
  }
}
```

Complexity (default):

```
user(1)
└─ posts(1)
   └─ comments(1)
      └─ id(1)

Total = 4
```

---

## Configuration Options

```ts
createComplexityLimitRule({
  maxComplexity: number;           // required
  defaultCost?: number;            // default: 1
  fieldCosts?: Record<string, number>;
  ignoreIntrospection?: boolean;   // default: true
  message?: (cost, max) => string; // custom error message
});
```

---

## Custom Field Costs

```ts
createComplexityLimitRule({
  maxComplexity: 5,
  fieldCosts: {
    posts: 3,
    comments: 2,
  },
});
```

---

## Custom Error Message

```ts
createComplexityLimitRule({
  maxComplexity: 10,
  message: (cost, max) =>
    `Query cost ${cost} exceeds the allowed maximum of ${max}`,
});
```

---

## Apollo Server

```ts
import { ApolloServer } from "@apollo/server";
import { createComplexityLimitRule } from "graphql-complexity-validation";

const server = new ApolloServer({
  schema,
  validationRules: [
    createComplexityLimitRule({
      maxComplexity: 20,
    }),
  ],
});
```

---

## GraphQL Yoga

```ts
import { createYoga } from "graphql-yoga";
import { createComplexityLimitRule } from "graphql-complexity-validation";

const yoga = createYoga({
  schema,
  validationRules: [
    createComplexityLimitRule({
      maxComplexity: 20,
    }),
  ],
});
```

---

## Envelop

```ts
import { envelop, useValidationRules } from "@envelop/core";
import { createComplexityLimitRule } from "graphql-complexity-validation";

const getEnveloped = envelop({
  plugins: [
    useValidationRules([
      createComplexityLimitRule({
        maxComplexity: 20,
      }),
    ]),
  ],
});
```

---

## NestJS (GraphQLModule)

```ts
import { GraphQLModule } from "@nestjs/graphql";
import { createComplexityLimitRule } from "graphql-complexity-validation";

GraphQLModule.forRoot({
  schema,
  validationRules: [
    createComplexityLimitRule({
      maxComplexity: 20,
    }),
  ],
});
```

---

## Why This Library?

- No schema traversal at runtime
- No directive setup
- No Apollo-specific plugins
- Uses **native GraphQL validation**
- Predictable and easy to reason about

Designed for **performance**, **clarity**, and **portability**.

---

## License

MIT © Mateo Diaz
