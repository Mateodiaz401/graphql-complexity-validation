// calculateComplexity.ts - VERSIÓN FINAL
import {
  Kind,
  type FieldNode,
  type SelectionNode,
  type FragmentDefinitionNode,
  type DocumentNode,
} from "graphql";
import { isIntrospectionField } from "./isIntrospection";
import type { ComplexityLimitOptions } from "../types";

interface Context {
  fragments: Record<string, FragmentDefinitionNode>;
  options: Required<
    Pick<
      ComplexityLimitOptions,
      "defaultCost" | "fieldCosts" | "ignoreIntrospection"
    >
  >;
}

export function calculateSelectionComplexity(
  selections: readonly SelectionNode[],
  context: Context
): number {
  let total = 0;

  for (const selection of selections) {
    if (selection.kind === Kind.FIELD) {
      total += calculateFieldComplexity(selection, context);
    } else if (selection.kind === Kind.FRAGMENT_SPREAD) {
      const fragment = context.fragments[selection.name.value];
      if (fragment) {
        total += calculateSelectionComplexity(
          fragment.selectionSet.selections,
          context
        );
      }
    } else if (selection.kind === Kind.INLINE_FRAGMENT) {
      total += calculateSelectionComplexity(
        selection.selectionSet.selections,
        context
      );
    }
  }
  return total;
}

function calculateFieldComplexity(field: FieldNode, context: Context): number {
  const fieldName = field.name.value;

  if (context.options.ignoreIntrospection && isIntrospectionField(fieldName)) {
    return 0;
  }

  const fieldCost =
    context.options.fieldCosts[fieldName] ?? context.options.defaultCost;

  if (!field.selectionSet) {
    return fieldCost;
  }
  const childrenComplexity = calculateSelectionComplexity(
    field.selectionSet.selections,
    context
  );
  return fieldCost + childrenComplexity;
}

export function calculateOperationComplexity(
  document: DocumentNode,
  selections: readonly SelectionNode[],
  options: Required<
    Pick<
      ComplexityLimitOptions,
      "defaultCost" | "fieldCosts" | "ignoreIntrospection"
    >
  >
): number {
  const fragments: Context["fragments"] = {};
  for (const definition of document.definitions) {
    if (definition.kind === Kind.FRAGMENT_DEFINITION) {
      fragments[definition.name.value] = definition;
    }
  }

  return calculateSelectionComplexity(selections, {
    fragments,
    options,
  });
}
