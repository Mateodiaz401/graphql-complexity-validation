export type FieldCostMap = Record<string, number>;

export interface ComplexityLimitOptions {
  maxComplexity: number;
  defaultCost?: number;
  fieldCosts?: FieldCostMap;
  ignoreIntrospection?: boolean;
  message?: (cost: number, max: number) => string;
}
