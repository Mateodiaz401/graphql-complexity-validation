export function isIntrospectionField(fieldName: string): boolean {
  return fieldName.startsWith("__");
}
