import { AxiosResponse } from "axios";
import * as vscode from "vscode";
export const isObject = (input: any) => {
  if (typeof input !== "object" || input === null) {
    return false;
  }
  return true;
};

export const convertInputToString = (
  input: number | string | Object | Array<any>
) => {
  return isObject(input) ? JSON.stringify(input) : input;
};

export const convertToArrayType = (input: Array<any>): string => {
  const prefersBrackets = vscode.workspace
    .getConfiguration("arrayDeclarationAsBrackets")
    .get("Enabled");

  if (!input.length) {
    return prefersBrackets ? "any[]" : "Array<any>";
  }

  const inputType = getTypeFromInput(input[0]);
  return prefersBrackets
    ? `${convertInputToString(inputType)}[]`
    : `Array<${convertInputToString(inputType)}>`;
};

export const getTypeFromInput = (
  input: string | number | Array<any> | AxiosResponse["data"]
) => {
  const isInputObject = isObject(input);

  if (!isInputObject) return typeof input;

  if (Array.isArray(input)) return convertToArrayType(input);

  Object.keys(input).map(
    (key: string) => (input[key] = getTypeFromInput(input[key]))
  );

  return input;
};
