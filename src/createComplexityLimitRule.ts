import {
  GraphQLError,
  type ValidationContext,
  type OperationDefinitionNode,
  type ASTVisitor,
} from "graphql";
import { ComplexityLimitOptions } from "./types";
import { calculateOperationComplexity } from "./utils/calculateComplexity";

export function createComplexityLimitRule(
  options: ComplexityLimitOptions
): (context: ValidationContext) => ASTVisitor {
  const {
    maxComplexity,
    defaultCost = 1,
    fieldCosts = {},
    ignoreIntrospection = true,
    message,
  } = options;

  return (context: ValidationContext): ASTVisitor => ({
    OperationDefinition(node: OperationDefinitionNode) {
      const complexity = calculateOperationComplexity(
        context.getDocument(),
        node.selectionSet.selections,
        {
          defaultCost,
          fieldCosts,
          ignoreIntrospection,
        }
      );

      if (complexity > maxComplexity) {
        context.reportError(
          new GraphQLError(
            message
              ? message(complexity, maxComplexity)
              : `Query complexity ${complexity} exceeds the maximum allowed of ${maxComplexity}`,
            { nodes: [node] }
          )
        );
      }
    },
  });
}
