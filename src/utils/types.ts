import { AxiosResponse } from "axios";
import * as vscode from "vscode";
export const isObject = (input: any) => {
  if (typeof input !== "object" || input === null) {
    return false;
  }
  return true;
};

const stringifyObjectWithoutQuotes = (input: Object) => {
  return JSON.stringify(input)
    .replace(/["'\\]/g, "")
    .replace(/([^",{]+):/g, (match, secure) => {
      const validKeyCharacters = /^[a-z0-9_]+$/i;
      if (!validKeyCharacters.test(secure)) return `"${secure}":`;
      return `${secure}:`;
    });
};

export const convertInputToString = (
  input: number | string | Object | Array<any>
) => {
  return isObject(input) ? stringifyObjectWithoutQuotes(input) : input;
};

export const convertToArrayType = (input: Array<any>): string => {
  const prefersBrackets = vscode.workspace
    .getConfiguration()
    .get("json-type-generator.arrayDeclarationAsBrackets");

  if (!input.length) {
    return prefersBrackets ? "any[]" : "Array<any>";
  }

  const inputType = getTypeFromInput(input[0]);
  return prefersBrackets ? `${inputType}[]` : `Array<${inputType}>`;
};

export const getTypeFromInput = (
  input: string | number | Array<any> | AxiosResponse["data"]
) => {
  const isInputObject = isObject(input);

  if (!isInputObject) return typeof input;

  if (Array.isArray(input)) return convertToArrayType(input);

  const objectTypes: typeof input = {};

  Object.keys(input).map(
    (key: string) => (objectTypes[key] = getTypeFromInput(input[key]))
  );

  return stringifyObjectWithoutQuotes(objectTypes);
};
